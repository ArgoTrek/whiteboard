import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id') || ''
  
  const supabase = await createClient()
  
  // Check if user exists for thumbs status
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get comments with their authors
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id(id, email),
      thumb_count:thumbs(count)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // If user is authenticated, check which comments they've thumbed
  let userThumbs: { comment_id: string }[] = [];
  if (user) {
    const { data: thumbsData } = await supabase
      .from('thumbs')
      .select('comment_id')
      .eq('user_id', user.id)
      .is('post_id', null);
    
    userThumbs = thumbsData || [];
  }
  
  // Format the comments data
  const comments = data.map(comment => {
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.comment_id === comment.id) : false;
    
    return {
      ...comment,
      author: comment.profiles,
      profiles: undefined,
      thumb_count: comment.thumb_count[0]?.count || 0,
      user_has_thumbed: userHasThumbed
    };
  });
  
  return NextResponse.json({ comments })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to comment' },
      { status: 401 }
    )
  }
  
  const { post_id, content } = await request.json()
  
  if (!post_id || !content) {
    return NextResponse.json(
      { error: 'Post ID and content are required' },
      { status: 400 }
    )
  }
  
  // Create comment
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        post_id,
        user_id: user.id,
        content,
      },
    ])
    .select(`
      *,
      profiles:user_id(id, email)
    `)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Format the comment for response
  const comment = {
    ...data[0],
    author: data[0].profiles,
    profiles: undefined,
    thumb_count: 0,
    user_has_thumbed: false
  };
  
  return NextResponse.json({ comment })
}