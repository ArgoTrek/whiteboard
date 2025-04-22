"use client"

import { useState } from 'react'
import { DailyActivities } from '@/components/engagement/daily-activities'
import { CurrencyDisplay } from '@/components/engagement/currency-display'
import { AchievementsDisplay } from '@/components/engagement/achievements-display'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EngagementPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')
  const [currency, setCurrency] = useState({ ink_points: 0, prismatic_ink: 0 })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      setLoading(true)
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data.user) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }
      
      setUser(data.user)
      setLoading(false)
    }
  
    getUser()
  }, [])

  const handleCurrencyUpdate = (newCurrency: { ink_points: number; prismatic_ink: number }) => {
    setCurrency(newCurrency)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
            <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Engagement Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your daily activities, achievements, and rewards
          </p>
        </div>
        
        {/* Currency Summary */}
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
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="gacha">Gacha & Flairs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-6">
            <DailyActivities onCurrencyUpdate={handleCurrencyUpdate} />
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-6">
            <AchievementsDisplay onCurrencyUpdate={handleCurrencyUpdate} />
          </TabsContent>
          
          <TabsContent value="gacha" className="space-y-6">
            <CurrencyDisplay onCurrencyUpdate={handleCurrencyUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}