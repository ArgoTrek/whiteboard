// app/api/posts/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get('board_id') || ''
  const limit = parseInt(searchParams.get('limit') || '10')
  const page = parseInt(searchParams.get('page') || '0')
  
  const supabase = await createClient()
  
  // Check if user exists for thumbs status
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get posts with simpler approach
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('board_id', boardId)
    .order('updated_at', { ascending: false })
    .limit(limit)
    .range(page * limit, (page + 1) * limit - 1)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If user is authenticated, check which posts they've thumbed
  let userThumbs: { post_id: string }[] = [];
  if (user) {
    const { data: thumbsData } = await supabase
      .from('thumbs')
      .select('post_id')
      .eq('user_id', user.id)
      .is('comment_id', null);
    
    userThumbs = thumbsData || [];
  }
  
  // Get comment counts for each post individually
  const postsWithCounts = await Promise.all(data.map(async (post) => {
    // Get comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    // Get thumb count
    const { count: thumbCount } = await supabase
      .from('thumbs')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .is('comment_id', null);
    
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.post_id === post.id) : false;
    
    return {
      ...post,
      author: {
        id: post.user_id,
        email: post.author_email || 'Unknown User'
      },
      comment_count: commentCount || 0,
      thumb_count: thumbCount || 0,
      user_has_thumbed: userHasThumbed
    };
  }));
  
  return NextResponse.json({ posts: postsWithCounts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to create a post' },
      { status: 401 }
    )
  }
  
  // Check if user has already posted today
  const { data: canPost } = await supabase.rpc('can_user_post_today', { user_uuid: user.id })
  
  if (!canPost) {
    return NextResponse.json(
      { error: 'You can only make one post per day' },
      { status: 429 }
    )
  }
  
  const { board_id, content } = await request.json()
  
  if (!board_id || !content) {
    return NextResponse.json(
      { error: 'Board ID and content are required' },
      { status: 400 }
    )
  }
  
  // Create post with author_email
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        board_id,
        user_id: user.id,
        author_email: user.email, // Store author email directly
        content,
      },
    ])
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ post: data[0] })
}