// app/api/engagement/achievements/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to view achievements' },
      { status: 401 }
    )
  }
  
  try {
    // Get all available achievements with user progress
    const { data, error } = await supabase
      .from('achievements')
      .select(`
        id,
        name,
        description,
        category,
        required_progress,
        ink_reward,
        prismatic_reward,
        flair_reward,
        icon,
        user_achievements!inner (
          current_progress,
          completed,
          completed_at,
          reward_claimed
        )
      `)
      .eq('user_achievements.user_id', user.id)
      .order('category')
      .order('required_progress')
    
    if (error) {
      // If no user_achievements exist yet, just get all achievements
      if (error.code === 'PGRST116') { // Join not found
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('category')
          .order('required_progress')
        
        if (achievementsError) {
          console.error('Error fetching achievements:', achievementsError)
          return NextResponse.json(
            { error: achievementsError.message },
            { status: 500 }
          )
        }
        
        // Format the data with zero progress
        const formattedData = allAchievements.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          required_progress: achievement.required_progress,
          ink_reward: achievement.ink_reward,
          prismatic_reward: achievement.prismatic_reward,
          flair_reward: achievement.flair_reward,
          icon: achievement.icon,
          current_progress: 0,
          completed: false,
          completed_at: null,
          reward_claimed: false,
          progress_percentage: 0
        }))
        
        return NextResponse.json({
          achievements: formattedData,
          categories: [...new Set(formattedData.map(a => a.category))]
        })
      }
      
      console.error('Error fetching user achievements:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Format the response data
    const formattedData = data.map(item => {
      const userAchievement = item.user_achievements[0]
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        required_progress: item.required_progress,
        ink_reward: item.ink_reward,
        prismatic_reward: item.prismatic_reward,
        flair_reward: item.flair_reward,
        icon: item.icon,
        current_progress: userAchievement.current_progress,
        completed: userAchievement.completed,
        completed_at: userAchievement.completed_at,
        reward_claimed: userAchievement.reward_claimed,
        progress_percentage: Math.min(100, Math.round((userAchievement.current_progress / item.required_progress) * 100))
      }
    })
    
    return NextResponse.json({
      achievements: formattedData,
      categories: [...new Set(formattedData.map(a => a.category))]
    })
    
  } catch (error) {
    console.error('Error handling achievements request:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve achievement data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to claim achievement rewards' },
      { status: 401 }
    )
  }
  
  try {
    const { achievement_id } = await request.json()
    
    if (!achievement_id) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      )
    }
    
    // Call the claim_achievement_reward function
    const { data, error } = await supabase.rpc('claim_achievement_reward', {
      user_uuid: user.id,
      achievement_uuid: achievement_id
    })
    
    if (error) {
      console.error('Error claiming achievement reward:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // If false, achievement wasn't completed or was already claimed
    if (data === false) {
      return NextResponse.json(
        { success: false, message: 'Achievement either not completed or already claimed' },
        { status: 400 }
      )
    }
    
    // Get achievement details for the response
    const { data: achievement } = await supabase
      .from('achievements')
      .select('name, ink_reward, prismatic_reward, flair_reward')
      .eq('id', achievement_id)
      .single()
    
    // Get flair details if there was a flair reward
    let flairDetails = null
    if (achievement?.flair_reward) {
      const { data: flair } = await supabase
        .from('flair_items')
        .select('name, type, rarity, css_class')
        .eq('id', achievement.flair_reward)
        .single()
      
      flairDetails = flair
    }
    
    return NextResponse.json({
      success: true,
      message: `You've claimed the reward for "${achievement?.name}"!`,
      rewards: {
        ink_points: achievement?.ink_reward || 0,
        prismatic_ink: achievement?.prismatic_reward || 0,
        flair: flairDetails
      }
    })
    
  } catch (error) {
    console.error('Error handling claim achievement request:', error)
    return NextResponse.json(
      { error: 'Failed to process achievement claim' },
      { status: 500 }
    )
  }
}