// app/api/engagement/activities/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to view activities' },
      { status: 401 }
    )
  }
  
  try {
    // Get user's daily activities for today
    const { data: activities, error: activitiesError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()
    
    if (activitiesError && activitiesError.code !== 'PGRST116') { // Not found is okay
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json(
        { error: activitiesError.message },
        { status: 500 }
      )
    }
    
    // Get user's currency info
    const { data: userCurrency, error: currencyError } = await supabase
      .from('user_currency')
      .select('streak_days, ink_points, prismatic_ink, last_check_in')
      .eq('user_id', user.id)
      .single()
    
    if (currencyError && currencyError.code !== 'PGRST116') {
      console.error('Error fetching user currency:', currencyError)
      return NextResponse.json(
        { error: currencyError.message },
        { status: 500 }
      )
    }
    
    // Format the response
    const activityStatus = {
      check_in: activities?.check_in || false,
      posted: activities?.posted || false,
      commented: activities?.commented || false,
      liked: activities?.liked || false,
      all_completed: activities ? (activities.check_in && activities.posted && activities.commented && activities.liked) : false
    }
    
    return NextResponse.json({
      activities: activityStatus,
      streak: userCurrency?.streak_days || 0,
      currency: {
        ink_points: userCurrency?.ink_points || 0,
        prismatic_ink: userCurrency?.prismatic_ink || 0
      },
      last_check_in: userCurrency?.last_check_in || null
    })
    
  } catch (error) {
    console.error('Error handling activities request:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve activity data' },
      { status: 500 }
    )
  }
}