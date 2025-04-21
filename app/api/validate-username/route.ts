// app/api/validate-username/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  
  if (!username) {
    return NextResponse.json({ valid: false, message: 'Username is required' })
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Username can only contain letters, numbers, and underscores' 
    })
  }

  if (username.length < 3) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Username must be at least 3 characters' 
    })
  }

  if (username.length > 20) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Username must be less than 20 characters' 
    })
  }

  // Check if username is already taken
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ valid: false, message: 'Error checking username' })
  }

  if (data) {
    return NextResponse.json({ valid: false, message: 'Username is already taken' })
  }

  return NextResponse.json({ valid: true, message: 'Username is available' })
}