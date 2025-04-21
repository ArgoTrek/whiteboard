// components/profile-page.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User } from 'lucide-react'

export default function ProfilePage({ user, profile }: { 
  user: any, 
  profile: { username: string; avatar_url: string | null; email: string } 
}) {
  const [username, setUsername] = useState(profile?.username || '')
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Debug the avatar URL
  useEffect(() => {
    console.log("Profile avatar URL:", profile?.avatar_url);
    console.log("State avatar URL:", avatarUrl);
  }, [profile?.avatar_url, avatarUrl]);

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

  return (
    <div className="container mx-auto max-w-md py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar section with proper hover behavior */}
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
    </div>
  )
}