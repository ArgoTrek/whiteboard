"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, Medal, Star, CheckCircle2, LucideIcon, User, 
  Flame, Calendar, MessageSquare, Trophy, CircleDollarSign,
  Sparkles, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAchievement } from '@/components/achievements/achievement-context'

interface Achievement {
  id: string
  name: string
  description: string
  category: string
  required_progress: number
  current_progress: number
  completed: boolean
  completed_at: string | null
  reward_claimed: boolean
  progress_percentage: number
  ink_reward: number
  prismatic_reward: number
  flair_reward: string | null
  icon: string | null
}

interface AchievementsDisplayProps {
  className?: string
  onCurrencyUpdate?: (currency: { ink_points: number; prismatic_ink: number }) => void
}

export function AchievementsDisplay({ className, onCurrencyUpdate }: AchievementsDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentCategory, setCurrentCategory] = useState<string>('all')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  
  const { showAchievement } = useAchievement()

  // Load achievements on mount
  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/engagement/achievements')
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements')
      }
      
      const data = await response.json()
      setAchievements(data.achievements)
      setCategories(['all', ...data.categories])
      
      // Set initial category to first available
      if (data.categories.length > 0 && currentCategory === 'all') {
        setCurrentCategory('all')
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      toast.error('Failed to load achievements')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (achievement: Achievement) => {
    if (claimingId || !achievement.completed || achievement.reward_claimed) {
      return
    }
    
    try {
      setClaimingId(achievement.id)
      
      const response = await fetch('/api/engagement/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          achievement_id: achievement.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to claim achievement reward')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setAchievements(prevAchievements => 
          prevAchievements.map(a => 
            a.id === achievement.id 
              ? { ...a, reward_claimed: true } 
              : a
          )
        )
        
        // Show success notification
        toast.success(data.message || 'Reward claimed successfully!')
        
        // Show achievement notification
        showAchievement({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          icon: achievement.icon || undefined,
          rewards: {
            ink_points: data.rewards.ink_points,
            prismatic_ink: data.rewards.prismatic_ink,
            flair: data.rewards.flair
          }
        })
        
        // Notify parent component of currency update if callback provided
        if (onCurrencyUpdate && (data.rewards.ink_points || data.rewards.prismatic_ink)) {
          // We don't know the exact currency value here, so we'll just refetch activities
          const activitiesResponse = await fetch('/api/engagement/activities')
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json()
            if (onCurrencyUpdate) {
              onCurrencyUpdate(activitiesData.currency)
            }
          }
        }
      } else {
        toast.error(data.message || 'Failed to claim reward')
      }
    } catch (error) {
      console.error('Error claiming achievement reward:', error)
      toast.error('Failed to claim achievement reward')
    } finally {
      setClaimingId(null)
    }
  }

  // Helper function to get icon for achievement
  const getAchievementIcon = (achievement: Achievement): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      'award': Award,
      'medal': Medal,
      'star': Star,
      'check-circle': CheckCircle2,
      'user': User,
      'flame': Flame,
      'calendar': Calendar,
      'message-square': MessageSquare,
      'trophy': Trophy
    }
    
    // Try to match icon from achievement data
    if (achievement.icon && iconMap[achievement.icon]) {
      return iconMap[achievement.icon]
    }
    
    // Fallback to category-based icon
    switch (achievement.category) {
      case 'engagement':
        return MessageSquare
      case 'consistency':
        return Calendar
      case 'community':
        return User
      case 'content':
        return Trophy
      case 'special':
        return Star
      default:
        return Award
    }
  }

  // Filter achievements by selected category
  const filteredAchievements = currentCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === currentCategory)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : (
          <>
            <Tabs defaultValue={currentCategory} onValueChange={setCurrentCategory}>
              <TabsList className="grid grid-flow-col auto-cols-fr w-full mb-4">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={currentCategory} className="mt-0">
                {filteredAchievements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Award className="mx-auto h-10 w-10 mb-2 opacity-20" />
                    <p>No achievements found in this category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAchievements.map(achievement => {
                      const Icon = getAchievementIcon(achievement)
                      return (
                        <div 
                          key={achievement.id} 
                          className={cn(
                            "border rounded-lg p-4 relative",
                            achievement.completed 
                              ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{achievement.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                {achievement.description}
                              </p>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                <div 
                                  className={cn(
                                    "h-2 rounded-full",
                                    achievement.completed 
                                      ? "bg-green-500 dark:bg-green-600" 
                                      : "bg-blue-500 dark:bg-blue-600"
                                  )}
                                  style={{ width: `${achievement.progress_percentage}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                                <span>Progress: {achievement.current_progress}/{achievement.required_progress}</span>
                                <span>{achievement.progress_percentage}%</span>
                              </div>
                              
                              {/* Rewards section */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {achievement.ink_reward > 0 && (
                                  <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs">
                                    <CircleDollarSign className="h-3 w-3 mr-1" />
                                    <span>{achievement.ink_reward} Ink</span>
                                  </div>
                                )}
                                
                                {achievement.prismatic_reward > 0 && (
                                  <div className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    <span>{achievement.prismatic_reward} Prismatic</span>
                                  </div>
                                )}
                                
                                {achievement.flair_reward && (
                                  <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full text-xs">
                                    <Award className="h-3 w-3 mr-1" />
                                    <span>Special Flair</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Claim button */}
                            {achievement.completed && !achievement.reward_claimed && (
                              <Button
                                size="sm"
                                onClick={() => handleClaimReward(achievement)}
                                disabled={claimingId === achievement.id}
                                className="flex-shrink-0 self-start"
                              >
                                {claimingId === achievement.id ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <Award className="h-4 w-4 mr-1" />
                                    <span>Claim</span>
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {/* Claimed indicator */}
                            {achievement.completed && achievement.reward_claimed && (
                              <div className="flex-shrink-0 text-green-600 dark:text-green-400 self-start">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          
                          {/* Completion badge */}
                          {achievement.completed && (
                            <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                              <div className="bg-green-500 text-white rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}