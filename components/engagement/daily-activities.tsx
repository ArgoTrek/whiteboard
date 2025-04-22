"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, CalendarDays, Flame } from 'lucide-react'
import { useAchievement } from '@/components/achievements/achievement-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ActivityStatus, Currency } from '@/types/database'

interface DailyActivitiesProps {
  className?: string
  onCurrencyUpdate?: (currency: Currency) => void
}

export function DailyActivities({ className, onCurrencyUpdate }: DailyActivitiesProps) {
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [activities, setActivities] = useState<ActivityStatus>({
    check_in: false,
    posted: false,
    commented: false,
    liked: false,
    all_completed: false
  })
  const [streak, setStreak] = useState(0)
  const [currency, setCurrency] = useState<Currency>({ ink_points: 0, prismatic_ink: 0 })
  
  const { showAchievement } = useAchievement()

  // Load activities on mount
  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/engagement/activities')
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      setActivities(data.activities)
      setStreak(data.streak)
      setCurrency(data.currency)
      
      // Notify parent component of currency update if callback provided
      if (onCurrencyUpdate) {
        onCurrencyUpdate(data.currency)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load daily activities')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (activities.check_in || checkingIn) return
    
    try {
      setCheckingIn(true)
      const response = await fetch('/api/engagement/check-in', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to check in')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setActivities(prev => ({
          ...prev,
          check_in: true,
          all_completed: prev.posted && prev.commented && prev.liked && true
        }))
        setStreak(data.streak)
        setCurrency(data.currency)
        
        // Show success notification
        toast.success(`Day ${data.streak} streak! +10 Ink Points`)
        
        // Notify parent component of currency update if callback provided
        if (onCurrencyUpdate) {
          onCurrencyUpdate(data.currency)
        }
        
        // Show achievement if it's a milestone streak
        if (data.streak === 7) {
          showAchievement({
            id: 'streak-7',
            name: 'One Week Streak',
            description: `You've logged in for 7 consecutive days!`,
            category: 'consistency',
            icon: 'calendar-days',
            rewards: {
              ink_points: 30,
              prismatic_ink: 1
            }
          })
        } else if (data.streak === 30) {
          showAchievement({
            id: 'streak-30',
            name: 'Monthly Dedication',
            description: `You've logged in for 30 consecutive days!`,
            category: 'consistency',
            icon: 'calendar-heart',
            rewards: {
              ink_points: 200,
              prismatic_ink: 5
            }
          })
        }
      } else {
        toast.info('You have already checked in today')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to complete check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  // Check if all activities are newly completed
  useEffect(() => {
    if (activities.all_completed) {
      // Only show the achievement popup once when all completed
      showAchievement({
        id: 'daily-complete',
        name: 'Daily Champion',
        description: `You've completed all daily activities!`,
        category: 'consistency',
        icon: 'check-circle',
        rewards: {
          prismatic_ink: 1
        }
      })
    }
  }, [activities.all_completed, showAchievement])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Daily Activities</span>
          <div className="flex items-center space-x-2 text-sm font-normal">
            <div className="flex items-center text-amber-500 dark:text-amber-400">
              <Flame className="h-4 w-4 mr-1" />
              <span>Streak: {streak}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <ActivityItem 
                label="Daily Check-in" 
                completed={activities.check_in}
                reward="10 Ink Points"
                onClick={!activities.check_in ? handleCheckIn : undefined}
                loading={checkingIn}
              />
              <ActivityItem 
                label="Create a Post" 
                completed={activities.posted}
                reward="20 Ink Points"
              />
              <ActivityItem 
                label="Leave a Comment" 
                completed={activities.commented}
                reward="10 Ink Points"
              />
              <ActivityItem 
                label="Like a Post" 
                completed={activities.liked}
                reward="5 Ink Points"
              />
            </div>
            
            {/* Completion bonus */}
            <div className={cn(
              "mt-4 p-3 rounded-lg text-sm border",
              activities.all_completed 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            )}>
              <div className="flex items-center">
                {activities.all_completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                ) : (
                  <CalendarDays className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium">
                    {activities.all_completed ? 'All activities completed!' : 'Complete all activities'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activities.all_completed 
                      ? 'You earned +1 Prismatic Ink as a bonus!' 
                      : 'Complete all daily activities to earn +1 Prismatic Ink'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  label: string
  completed: boolean
  reward: string
  onClick?: () => void
  loading?: boolean
}

function ActivityItem({ label, completed, reward, onClick, loading = false }: ActivityItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-md",
        completed ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800/50",
        onClick && !completed ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
        )}
        <span className={completed ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}>
          {label}
        </span>
      </div>
      <div className="flex items-center">
        {loading ? (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
        ) : null}
        <span className="text-xs text-gray-500 dark:text-gray-400">{reward}</span>
      </div>
    </div>
  )
}