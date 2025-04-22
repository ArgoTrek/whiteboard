// app/profile/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfilePage from '@/components/profile-page'

export const dynamic = 'force-dynamic'

export default async function ProfilePageContainer() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, email') // Added 'id'
    .eq('id', user.id)
    .single()

  // Ensure profile has the required fields, providing a fallback with id
  const profileData = profile || { 
    id: user.id, // Added id
    username: user.email, 
    avatar_url: null, 
    email: user.email 
  }

  return <ProfilePage user={user} profile={profileData} />
}
