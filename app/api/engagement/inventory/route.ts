// app/api/engagement/inventory/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to view inventory' },
      { status: 401 }
    )
  }
  
  try {
    // Get all user's inventory items with flair details
    const { data, error } = await supabase
      .from('user_inventory')
      .select(`
        id,
        acquired_at,
        flair_items (
          id,
          name,
          description,
          type,
          rarity,
          ink_price,
          prismatic_price,
          css_class,
          preview_image_url
        )
      `)
      .eq('user_id', user.id)
      .order('acquired_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching inventory:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Get user's applied flairs - THIS IS THE FIX:
    // Adding 'posts!inner (user_id)' to include the posts table in the select
    const { data: appliedFlairs, error: flairsError } = await supabase
      .from('post_flairs')
      .select(`
        id,
        post_id,
        flair_id,
        applied_at,
        posts!inner (user_id)
      `)
      .eq('posts.user_id', user.id)
      .order('applied_at', { ascending: false })
    
    if (flairsError && flairsError.code !== 'PGRST116') {
      console.error('Error fetching applied flairs:', flairsError)
    }
    
    // Format the inventory data
    const formattedInventory = data.map(item => ({
      id: item.id,
      acquired_at: item.acquired_at,
      flair: item.flair_items,
      applied_to: appliedFlairs 
        ? appliedFlairs.filter(f => f.flair_id === item.flair_items.id).map(f => f.post_id)
        : []
    }))
    
    // Group by type for easier UI rendering
    const groupedInventory = formattedInventory.reduce((acc, item) => {
      const type = item.flair.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(item)
      return acc
    }, {} as Record<string, typeof formattedInventory>)
    
    return NextResponse.json({
      inventory: formattedInventory,
      groupedInventory
    })
    
  } catch (error) {
    console.error('Error handling inventory request:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve inventory data' },
      { status: 500 }
    )
  }
}