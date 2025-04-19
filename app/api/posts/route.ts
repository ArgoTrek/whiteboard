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
  
  // Get posts with count of comments and thumbs
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(id, email),
      comment_count:comments(count),
      thumb_count:thumbs(count)
    `)
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
  
  // Format the posts data
  const posts = data.map(post => {
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.post_id === post.id) : false;
    
    return {
      ...post,
      author: post.profiles,
      profiles: undefined,
      comment_count: post.comment_count[0]?.count || 0,
      thumb_count: post.thumb_count[0]?.count || 0,
      user_has_thumbed: userHasThumbed
    };
  });
  
  return NextResponse.json({ posts })
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
  
  // Create post
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        board_id,
        user_id: user.id,
        content,
      },
    ])
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ post: data[0] })
}