// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Return to login page with error message
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  return redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
  }

  // Validate username
  if (!data.username || data.username.trim() === '') {
    return redirect(`/login?error=${encodeURIComponent('Username is required')}`)
  }

  if (data.username.length < 3) {
    return redirect(`/login?error=${encodeURIComponent('Username must be at least 3 characters')}`)
  }

  if (data.username.length > 20) {
    return redirect(`/login?error=${encodeURIComponent('Username must be less than 20 characters')}`)
  }

  // Check if username is already taken
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', data.username)
    .single()

  if (existingUser) {
    return redirect(`/login?error=${encodeURIComponent('Username is already taken')}`)
  }

  if (checkError && checkError.code !== 'PGRST116') {
    return redirect(`/login?error=${encodeURIComponent('Error checking username: ' + checkError.message)}`)
  }

  // Sign up the user
  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        username: data.username,
      },
    },
  })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Create or update the profile
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: data.email,
        username: data.username,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }
  }

  // Check if email confirmation is required
  if (authData?.user?.identities?.length === 0 || authData?.user?.confirmed_at === null) {
    return redirect('/login?verification=true')
  }

  revalidatePath('/', 'layout')
  return redirect('/')
}