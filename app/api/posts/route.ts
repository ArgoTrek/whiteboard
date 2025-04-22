// app/api/posts/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// First Post achievement ID from the database
const FIRST_POST_ACHIEVEMENT_ID = '05cfca09-1237-4649-bf87-93b5a3046482'

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
  
  // Get comment counts for each post individually and include author profiles
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
    
    // Get author profile with avatar_url
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', post.user_id)
      .single();
    
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.post_id === post.id) : false;
    
    return {
      ...post,
      author: {
        id: post.user_id,
        email: post.author_email || 'Unknown User',
        username: authorProfile?.username,
        avatar_url: authorProfile?.avatar_url
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
  
  const { board_id, content, flair_id } = await request.json()
  
  if (!board_id || !content) {
    return NextResponse.json(
      { error: 'Board ID and content are required' },
      { status: 400 }
    )
  }
  
  try {
    // If a flair was selected, verify that the user owns this flair
    if (flair_id) {
      // Check if user owns this flair
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('id')
        .eq('user_id', user.id)
        .eq('flair_id', flair_id)
        .single()
      
      if (inventoryError) {
        return NextResponse.json(
          { error: 'You do not own this flair' },
          { status: 403 }
        )
      }
    }
    
    // Create post with author_email
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          board_id,
          user_id: user.id,
          author_email: user.email,
          content,
        },
      ])
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const post = data[0]
    
    // If a flair was selected, apply it to the post
    if (flair_id) {
      const { error: flairError } = await supabase
        .from('post_flairs')
        .insert([{
          post_id: post.id,
          flair_id,
          applied_at: new Date().toISOString()
        }])
      
      if (flairError) {
        console.error('Error applying flair to post:', flairError)
        // We don't return an error here because the post was already created
        // Instead we'll log it and continue without the flair
      }
    }
    
    // Check if this is the user's first post - if so, award the achievement
    try {
      // Count user's posts
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!countError && count === 1) {
        // This is their first post, award the achievement
        
        // First check if they already have this achievement (shouldn't happen but just in case)
        const { data: existingAchievement, error: checkError } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_id', FIRST_POST_ACHIEVEMENT_ID)
          .maybeSingle()
        
        // Only proceed if they don't already have the achievement
        if (!checkError && !existingAchievement) {
          const now = new Date().toISOString()
          
          // Create the achievement entry
          const { error: achievementError } = await supabase
            .from('user_achievements')
            .insert([{
              user_id: user.id,
              achievement_id: FIRST_POST_ACHIEVEMENT_ID,
              current_progress: 1,
              completed: true,
              completed_at: now,
              reward_claimed: false,
              created_at: now,
              updated_at: now
            }])
          
          if (achievementError) {
            console.error('Error awarding first post achievement:', achievementError)
          } else {
            console.log('First Post achievement awarded to user:', user.id)
          }
        }
      }
    } catch (achievementError) {
      // Log achievement errors but don't fail the post creation
      console.error('Error processing achievement logic:', achievementError)
    }
    
    // Get author profile with avatar_url for the response
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    
    // Return post with author information including avatar_url
    const postWithDetails = {
      ...post,
      author: {
        id: user.id,
        email: user.email,
        username: authorProfile?.username,
        avatar_url: authorProfile?.avatar_url
      },
      comment_count: 0,
      thumb_count: 0,
      user_has_thumbed: false
    };
    
    return NextResponse.json({ post: postWithDetails })
  
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}