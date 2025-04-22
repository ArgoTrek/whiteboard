"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Currency } from "@/types/database"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>({ ink_points: 0, prismatic_ink: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser()
      setIsLoading(false)
      if (!error && data.user) {
        setUser(data.user)
        
        // Fetch user profile to get avatar_url
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single();
          
        if (profileData) {
          setUser({
            ...data.user,
            profile: profileData
          });
        }

        // Fetch currency information
        try {
          const response = await fetch('/api/engagement/activities')
          if (response.ok) {
            const data = await response.json()
            if (data.currency) {
              setCurrency(data.currency)
            }
          }
        } catch (error) {
          console.error('Error fetching currency:', error)
        }
      }
    }
  
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold">
            Whiteboard
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          ) : user ? (
            <>
              {/* Currency display */}
              <div className="hidden md:flex items-center space-x-3 text-sm">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                  <span>{currency.ink_points}</span>
                </div>
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-1.5"></div>
                  <span>{currency.prismatic_ink}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile?.avatar_url || ""} alt={user.user_metadata?.username || user.email} />
                      <AvatarFallback>
                        {(user.user_metadata?.username || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}