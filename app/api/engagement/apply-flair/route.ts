// app/api/engagement/apply-flair/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST endpoint to apply a flair to a post
export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to apply flairs' },
      { status: 401 }
    )
  }
  
  try {
    const { post_id, flair_id } = await request.json()
    
    if (!post_id || !flair_id) {
      return NextResponse.json(
        { error: 'Post ID and Flair ID are required' },
        { status: 400 }
      )
    }
    
    // Call the apply_flair_to_post function
    const { data, error } = await supabase.rpc('apply_flair_to_post', {
      user_uuid: user.id,
      post_uuid: post_id,
      flair_uuid: flair_id
    })
    
    if (error) {
      console.error('Error applying flair to post:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // If false, user doesn't own the post or flair
    if (data === false) {
      return NextResponse.json(
        { success: false, message: 'You must own both the post and the flair to apply it' },
        { status: 400 }
      )
    }
    
    // Get details of the applied flair
    const { data: flairDetails } = await supabase
      .from('flair_items')
      .select('name, type, rarity, css_class')
      .eq('id', flair_id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: `Successfully applied "${flairDetails?.name}" to your post!`,
      flair: flairDetails
    })
    
  } catch (error) {
    console.error('Error handling apply flair request:', error)
    return NextResponse.json(
      { error: 'Failed to apply flair to post' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a flair from a post
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')
  const flairId = searchParams.get('flair_id')
  
  if (!postId || !flairId) {
    return NextResponse.json(
      { error: 'Post ID and Flair ID are required' },
      { status: 400 }
    )
  }
  
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to remove flairs' },
      { status: 401 }
    )
  }
  
  try {
    // Check if user owns the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()
    
    if (postError) {
      return NextResponse.json(
        { error: 'Post not found or you do not have permission to modify it' },
        { status: 403 }
      )
    }
    
    // Remove the flair from the post
    const { error: removeError } = await supabase
      .from('post_flairs')
      .delete()
      .eq('post_id', postId)
      .eq('flair_id', flairId)
    
    if (removeError) {
      console.error('Error removing flair from post:', removeError)
      return NextResponse.json(
        { error: removeError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Flair removed successfully'
    })
    
  } catch (error) {
    console.error('Error handling remove flair request:', error)
    return NextResponse.json(
      { error: 'Failed to remove flair from post' },
      { status: 500 }
    )
  }
}