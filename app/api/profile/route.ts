// app/api/profile/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  // Get user profile
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url, email')
    .eq('id', user.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  // Get the updates from the request
  const updates = await request.json()
  
  // Only allow updating username for now (avatar is handled separately)
  const allowedUpdates = ['username']
  const filteredUpdates: any = {}
  
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field]
    }
  })
  
  // Validate username
  if (filteredUpdates.username !== undefined) {
    if (!filteredUpdates.username || filteredUpdates.username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }
    
    if (filteredUpdates.username.trim().length > 20) {
      return NextResponse.json(
        { error: 'Username must be less than 20 characters' },
        { status: 400 }
      )
    }
    
    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', filteredUpdates.username)
      .neq('id', user.id)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }
  }
  
  // Update the profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...filteredUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('username, avatar_url, email')
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ profile: data })
}