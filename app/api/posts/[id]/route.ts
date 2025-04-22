// app/api/posts/[id]/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Add GET method to fetch a single post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }

  const supabase = await createClient()
  
  // Get the post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()
  
  if (postError) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  
  // Get author profile with avatar_url
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', post.user_id)
    .single();
  
  // Format the post for response
  const formattedPost = {
    ...post,
    author: {
      id: post.user_id,
      email: post.author_email || 'Unknown User',
      username: authorProfile?.username,
      avatar_url: authorProfile?.avatar_url
    }
  };
  
  return NextResponse.json({ post: formattedPost })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }

  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to update a post' },
      { status: 401 }
    )
  }
  
  const updates = await request.json()
  
  // Make sure the user owns this post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()
  
  if (postError) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  
  if (post.user_id !== user.id) {
    return NextResponse.json(
      { error: 'You can only update your own posts' },
      { status: 403 }
    )
  }
  
  // Update the post
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ post: data[0] })
}