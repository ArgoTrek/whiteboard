// app/api/engagement/gacha/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET endpoint to fetch available gacha collections
export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to view gacha collections' },
      { status: 401 }
    )
  }
  
  try {
    // Get active gacha collections
    const { data: collections, error } = await supabase
      .from('gacha_collections')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        is_active
      `)
      .eq('is_active', true)
      .order('start_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching gacha collections:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Get available rarities in the collection
    const collectionsWithRarities = await Promise.all(
      collections.map(async (collection) => {
        const { data: rarities } = await supabase
          .from('collection_items')
          .select(`
            flair_items (
              rarity
            )
          `)
          .eq('collection_id', collection.id)
        
        const uniqueRarities = [...new Set(rarities?.map(item => item.flair_items[0].rarity) || [])]
        
        return {
          ...collection,
          rarities: uniqueRarities
        }
      })
    )
    
    // Get user's currency for displaying what they can afford
    const { data: userCurrency } = await supabase
      .from('user_currency')
      .select('ink_points, prismatic_ink')
      .eq('user_id', user.id)
      .single()
    
    // Get user's recent pulls
    const { data: recentPulls } = await supabase
      .from('gacha_pulls')
      .select(`
        id,
        pull_time,
        collection_id,
        flair_items (
          id,
          name,
          type,
          rarity,
          css_class,
          preview_image_url
        )
      `)
      .eq('user_id', user.id)
      .order('pull_time', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      collections: collectionsWithRarities,
      currency: userCurrency || { ink_points: 0, prismatic_ink: 0 },
      recentPulls: recentPulls || []
    })
    
  } catch (error) {
    console.error('Error handling gacha collections request:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve gacha data' },
      { status: 500 }
    )
  }
}

// POST endpoint to perform a gacha pull
export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to perform gacha pulls' },
      { status: 401 }
    )
  }
  
  try {
    const { collection_id, is_premium = false } = await request.json()
    
    if (!collection_id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }
    
    // Call the perform_gacha_pull function
    const { data: flairId, error } = await supabase.rpc('perform_gacha_pull', {
      user_uuid: user.id,
      collection_uuid: collection_id,
      is_premium
    })
    
    if (error) {
      console.error('Error performing gacha pull:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // If null, user couldn't afford the pull
    if (!flairId) {
      return NextResponse.json(
        { success: false, message: 'Not enough currency to perform pull' },
        { status: 400 }
      )
    }
    
    // Get details of the pulled flair
    const { data: flairDetails } = await supabase
      .from('flair_items')
      .select('*')
      .eq('id', flairId)
      .single()
    
    // Get user's updated currency
    const { data: userCurrency } = await supabase
      .from('user_currency')
      .select('ink_points, prismatic_ink')
      .eq('user_id', user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: `You pulled a ${flairDetails?.rarity} item: "${flairDetails?.name}"!`,
      pull: {
        flair: flairDetails,
        timestamp: new Date().toISOString()
      },
      currency: userCurrency
    })
    
  } catch (error) {
    console.error('Error handling gacha pull request:', error)
    return NextResponse.json(
      { error: 'Failed to process gacha pull' },
      { status: 500 }
    )
  }
}