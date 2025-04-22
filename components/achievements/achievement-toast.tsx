"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Award, Star, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Achievement {
  id: string
  name: string
  description: string
  category: string
  icon?: string
  rewards: {
    ink_points?: number
    prismatic_ink?: number
    flair?: {
      name: string
      type: string
      rarity: string
    } | null
  }
}

interface AchievementToastProps {
  achievement: Achievement | null
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function AchievementToast({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 6000
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, autoCloseDelay)
        
        return () => clearTimeout(timer)
      }
    }
  }, [achievement, autoClose, autoCloseDelay])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Allow exit animation to complete
  }, [onClose])

  // Early return if no achievement
  if (!achievement) return null

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement':
        return 'bg-blue-500 dark:bg-blue-600'
      case 'consistency':
        return 'bg-green-500 dark:bg-green-600'
      case 'community':
        return 'bg-purple-500 dark:bg-purple-600'
      case 'content':
        return 'bg-amber-500 dark:bg-amber-600'
      case 'special':
        return 'bg-red-500 dark:bg-red-600'
      default:
        return 'bg-slate-500 dark:bg-slate-600'
    }
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-slate-600 dark:text-slate-300'
      case 'rare':
        return 'text-blue-600 dark:text-blue-300'
      case 'epic':
        return 'text-purple-600 dark:text-purple-300'
      case 'legendary':
        return 'text-amber-600 dark:text-amber-300'
      default:
        return 'text-slate-600 dark:text-slate-300'
    }
  }

  // Get icon based on achievement icon string or fall back to category
  const getIcon = (icon?: string, category?: string) => {
    if (icon === 'award' || category === 'special') {
      return <Award className="h-6 w-6" />
    }
    if (icon === 'star' || category === 'community') {
      return <Star className="h-6 w-6" />
    }
    return <Check className="h-6 w-6" />
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Top bar with category color */}
            <div className={cn("h-2", getCategoryColor(achievement.category))} />
            
            <div className="p-4">
              {/* Header with close button */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-white",
                    getCategoryColor(achievement.category)
                  )}>
                    {getIcon(achievement.icon, achievement.category)}
                  </div>
                  <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                </div>
                <button 
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Achievement name and description */}
              <div className="mb-4">
                <h4 className="font-semibold text-xl mb-1">{achievement.name}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{achievement.description}</p>
              </div>
              
              {/* Rewards section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-2">
                <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Rewards:</h5>
                <div className="space-y-2">
                  {achievement.rewards.ink_points ? (
                    <div className="flex items-center text-sm">
                      <div className="w-4 h-4 mr-2 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <span>{achievement.rewards.ink_points} Ink Points</span>
                    </div>
                  ) : null}
                  
                  {achievement.rewards.prismatic_ink ? (
                    <div className="flex items-center text-sm">
                      <div className="w-4 h-4 mr-2 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      </div>
                      <span>{achievement.rewards.prismatic_ink} Prismatic Ink</span>
                    </div>
                  ) : null}
                  
                  {achievement.rewards.flair ? (
                    <div className="flex items-center text-sm">
                      <div className="w-4 h-4 mr-2 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      </div>
                      <span className={getRarityColor(achievement.rewards.flair.rarity)}>
                        {achievement.rewards.flair.name} ({achievement.rewards.flair.type})
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* Go to profile button */}
              <button 
                onClick={handleClose}
                className="w-full flex items-center justify-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
              >
                <span>View in Achievements</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}