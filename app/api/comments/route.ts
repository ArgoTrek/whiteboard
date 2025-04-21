// app/api/comments/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id') || ''
  
  const supabase = await createClient()
  
  // Check if user exists for thumbs status
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get comments with direct author info
  const { data, error } = await supabase
    .from('comments')
    .select('*')
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
  
  // Process comments to include thumb counts and author profiles
  const commentsWithCounts = await Promise.all(data.map(async (comment) => {
    // Get thumb count
    const { count: thumbCount } = await supabase
      .from('thumbs')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', comment.id)
      .is('post_id', null);
    
    // Get author profile with avatar_url
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', comment.user_id)
      .single();
    
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.comment_id === comment.id) : false;
    
    return {
      ...comment,
      author: {
        id: comment.user_id,
        email: comment.author_email || 'Unknown User',
        username: authorProfile?.username,
        avatar_url: authorProfile?.avatar_url
      },
      thumb_count: thumbCount || 0,
      user_has_thumbed: userHasThumbed
    };
  }));
  
  return NextResponse.json({ comments: commentsWithCounts })
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
  
  console.log('Creating comment for post:', post_id, 'by user:', user.id);
  
  // Create comment with author_email
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        post_id,
        user_id: user.id,
        author_email: user.email,
        content,
      },
    ])
    .select()
  
  if (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('Comment created successfully, ID:', data[0].id);
  
  // Now manually call the bump function
  console.log('Calling bump_post_on_comment RPC function...');
  const { data: bumpResult, error: bumpError } = await supabase.rpc(
    'bump_post_on_comment',
    { 
      post_uuid: post_id,
      user_uuid: user.id
    }
  );
  
  if (bumpError) {
    console.error('Error bumping post:', bumpError);
  } else {
    console.log('Post bump result:', bumpResult);
  }
  
  // Get the comment count
  const { count: thumbCount } = await supabase
    .from('thumbs')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', data[0].id)
    .is('post_id', null);
  
  // Get updated post information
  const { data: postData } = await supabase
    .from('posts')
    .select('push_count, updated_at')
    .eq('id', post_id)
    .single();
  
  // Get author profile information including avatar_url
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();
  
  console.log('Updated post data:', postData);
  
  // Format the comment for response with debug info
  const comment = {
    ...data[0],
    author: {
      id: user.id,
      email: user.email,
      username: authorProfile?.username,
      avatar_url: authorProfile?.avatar_url
    },
    thumb_count: thumbCount || 0,
    user_has_thumbed: false,
    debug: {
      bump_result: bumpResult,
      current_post: postData
    }
  };
  
  return NextResponse.json({ comment })
}