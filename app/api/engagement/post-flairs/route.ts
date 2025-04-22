// app/api/engagement/post-flairs/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')
  
  if (!postId) {
    return NextResponse.json(
      { error: 'Post ID is required' },
      { status: 400 }
    )
  }
  
  const supabase = await createClient()
  
  try {
    // Get all flairs applied to the post
    const { data, error } = await supabase
      .from('post_flairs')
      .select(`
        id,
        applied_at,
        flair_items (
          id,
          name,
          type,
          rarity,
          css_class,
          preview_image_url
        )
      `)
      .eq('post_id', postId)
      .order('applied_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching post flairs:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Format the flairs data
    const formattedFlairs = data.map(item => ({
      id: item.id,
      applied_at: item.applied_at,
      flair: item.flair_items
    }))
    
    // Group by type for easier CSS application
    const flairsByType = formattedFlairs.reduce((acc, item) => {
      const type = item.flair[0].type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(item.flair)
      return acc
    }, {} as Record<string, any[]>)
    
    return NextResponse.json({
      flairs: formattedFlairs,
      flairsByType
    })
    
  } catch (error) {
    console.error('Error handling post flairs request:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve post flairs' },
      { status: 500 }
    )
  }
}