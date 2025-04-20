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
    .select('username, avatar_url, email')
    .eq('id', user.id)
    .single()

  return <ProfilePage user={user} profile={profile || { username: user.email, avatar_url: null, email: user.email }} />
}