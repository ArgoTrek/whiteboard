import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to thumb up' },
      { status: 401 }
    )
  }
  
  const { post_id, comment_id } = await request.json()
  
  if (!post_id && !comment_id) {
    return NextResponse.json(
      { error: 'Either post_id or comment_id is required' },
      { status: 400 }
    )
  }
  
  if (post_id && comment_id) {
    return NextResponse.json(
      { error: 'You can only thumb up a post or a comment, not both' },
      { status: 400 }
    )
  }
  
  // Check if user has already thumbed
  const { data: existingThumb, error: thumbCheckError } = await supabase
    .from('thumbs')
    .select('id')
    .eq('user_id', user.id)
    .eq(post_id ? 'post_id' : 'comment_id', post_id || comment_id)
    .is(post_id ? 'comment_id' : 'post_id', null)
    .maybeSingle()
  
  if (thumbCheckError) {
    return NextResponse.json({ error: thumbCheckError.message }, { status: 500 })
  }
  
  let action: 'added' | 'removed' = 'added'
  
  if (existingThumb) {
    // Remove thumb if it already exists
    const { error: removeError } = await supabase
      .from('thumbs')
      .delete()
      .eq('id', existingThumb.id)
    
    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 })
    }
    
    action = 'removed'
  } else {
    // Add new thumb
    const { error: addError } = await supabase
      .from('thumbs')
      .insert([
        {
          user_id: user.id,
          post_id: post_id || null,
          comment_id: comment_id || null,
        },
      ])
    
    if (addError) {
      return NextResponse.json({ error: addError.message }, { status: 500 })
    }
  }
  
  return NextResponse.json({ action })
}