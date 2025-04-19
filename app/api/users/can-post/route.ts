// app/api/user/can-post/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { can_post: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  // Check if user can post today
  const { data: canPost, error } = await supabase.rpc('can_user_post_today', {
    user_uuid: user.id,
  })
  
  if (error) {
    return NextResponse.json(
      { can_post: false, error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ can_post: canPost })
}