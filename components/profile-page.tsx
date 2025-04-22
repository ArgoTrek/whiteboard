"use client"

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Award, Sparkles, Calendar } from 'lucide-react'
import { DailyActivities } from '@/components/engagement/daily-activities'
import { AchievementsDisplay } from '@/components/engagement/achievements-display'
import { InventoryDisplay } from '@/components/engagement/inventory-display'
import { Currency, Profile as ProfileType } from '@/types/database'

interface ProfilePageProps {
  user: any
  profile: ProfileType
}

export default function ProfilePage({ user, profile }: ProfilePageProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [username, setUsername] = useState(profile?.username || '')
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [activeTab, setActiveTab] = useState(
    tabParam && ['profile', 'daily', 'achievements', 'inventory'].includes(tabParam) 
      ? tabParam 
      : 'profile'
  )
  const [currency, setCurrency] = useState<Currency>({ ink_points: 0, prismatic_ink: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Update URL when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (activeTab !== 'profile') {
      newParams.set('tab', activeTab)
    } else {
      newParams.delete('tab')
    }
    const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [activeTab, searchParams])

  // Fetch currency data when the component mounts
  useEffect(() => {
    async function fetchCurrencyData() {
      try {
        const response = await fetch('/api/engagement/activities')
        if (response.ok) {
          const data = await response.json()
          setCurrency(data.currency || { ink_points: 0, prismatic_ink: 0 })
        }
      } catch (error) {
        console.error('Error fetching currency data:', error)
      }
    }
    
    fetchCurrencyData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleUsernameEdit = () => {
    setIsEditingUsername(!isEditingUsername)
    // Reset to original value if canceling
    if (isEditingUsername) {
      setUsername(profile?.username || '')
    }
  }

  const updateUsername = async () => {
    if (!username || username.trim().length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    if (username.trim().length > 20) {
      toast.error('Username must be less than 20 characters')
      return
    }

    setIsUpdatingUsername(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username')
      }

      toast.success('Username updated successfully')
      setIsEditingUsername(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating username:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update username')
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload to API
      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }
      
      // Immediately update the avatarUrl state with the new URL
      setAvatarUrl(data.url)
      toast.success('Profile picture updated')
      router.refresh()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture')
    } finally {
      setIsUploadingAvatar(false)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCurrencyUpdate = (newCurrency: Currency) => {
    setCurrency(newCurrency)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Currency Summary - Always visible */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-around gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-600"></div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Ink Points</div>
                <div className="text-2xl font-bold">{currency.ink_points}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 dark:bg-purple-600"></div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Prismatic Ink</div>
                <div className="text-2xl font-bold">{currency.prismatic_ink}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="mr-2 h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Sparkles className="mr-2 h-4 w-4" />
            Flairs
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  {/* Base avatar container */}
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center relative">
                    {/* The actual image */}
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={username || 'User avatar'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-white">
                        {(username || profile?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                    
                    {/* Hover overlay with transition */}
                    <div 
                      className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 rounded-full flex items-center justify-center transition-opacity duration-200"
                    >
                      <User className="h-8 w-8 text-white transition-opacity" />
                    </div>
                  </div>
                  
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploadingAvatar}
                />
                <p className="text-sm text-gray-500">Click to change profile picture</p>
              </div>

              {/* Email display */}
              <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="rounded-md bg-gray-100 p-2 dark:bg-gray-800">
                  {profile.email}
                </p>
              </div>
              
              {/* Username section */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Username</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleUsernameEdit}
                    disabled={isUpdatingUsername}
                  >
                    {isEditingUsername ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                
                {isEditingUsername ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Enter new username"
                    />
                    <Button 
                      onClick={updateUsername} 
                      disabled={isUpdatingUsername}
                      className="w-full"
                    >
                      {isUpdatingUsername ? 'Updating...' : 'Save Username'}
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-md bg-gray-100 p-2 dark:bg-gray-800">
                    {profile?.username || 'No username set'}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          <DailyActivities onCurrencyUpdate={handleCurrencyUpdate} />
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <AchievementsDisplay onCurrencyUpdate={handleCurrencyUpdate} />
        </TabsContent>
        
        {/* Inventory Tab - Now using InventoryDisplay instead of CurrencyDisplay */}
        <TabsContent value="inventory" className="space-y-6">
          <InventoryDisplay onCurrencyUpdate={handleCurrencyUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}