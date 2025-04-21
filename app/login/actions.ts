// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service-server'
import { signupSchema } from '@/lib/validations'

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
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // Validate with Zod
  const result = signupSchema.safeParse({ email, password, username })

  if (!result.success) {
    // Get the first error message
    const fieldErrors = result.error.flatten().fieldErrors;
    // Define the possible field names based on the schema
    type FieldErrorKeys = keyof typeof fieldErrors;
    const firstErrorField = Object.keys(fieldErrors)[0] as FieldErrorKeys;
    const firstErrorMessage = fieldErrors[firstErrorField]?.[0] || 'Invalid form data';
    
    return redirect(`/login?error=${encodeURIComponent(firstErrorMessage)}`);
  }

  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Create the auth user using regular client
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })

  if (authError) {
    console.error('Auth signup error:', authError)
    redirect(`/login?error=${encodeURIComponent(authError.message)}`)
  }

  if (!authData?.user) {
    console.error('No user returned from signup')
    redirect(`/login?error=${encodeURIComponent('Error creating user')}`)
  }

  console.log('Auth user created:', authData.user.id)
  
  // Create the profile using service client to bypass RLS
  const { error: profileError } = await serviceClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email,
      username: username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    // Continue anyway since auth user is created
  } else {
    console.log('Profile created for user:', authData.user.id)
  }

  // Redirect to verification page
  console.log('Email verification required')
  redirect('/login?verification=true')
}