// app/api/engagement/check-in/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to check in' },
      { status: 401 }
    )
  }
  
  try {
    // Call the check_in_user function
    const { data, error } = await supabase.rpc('check_in_user', {
      user_uuid: user.id
    })
    
    if (error) {
      console.error('Error during check-in:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // If false, user already checked in today
    if (data === false) {
      return NextResponse.json(
        { success: false, message: 'You have already checked in today' }
      )
    }
    
    // Get user's updated streak and currency info
    const { data: userCurrency } = await supabase
      .from('user_currency')
      .select('streak_days, ink_points, prismatic_ink')
      .eq('user_id', user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      streak: userCurrency?.streak_days || 1,
      currency: {
        ink_points: userCurrency?.ink_points || 0,
        prismatic_ink: userCurrency?.prismatic_ink || 0
      }
    })
    
  } catch (error) {
    console.error('Error handling check-in:', error)
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}