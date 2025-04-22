"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AchievementToast, Achievement } from './achievement-toast'

interface AchievementContextType {
  showAchievement: (achievement: Achievement) => void
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [queue, setQueue] = useState<Achievement[]>([])

  const showAchievement = useCallback((achievement: Achievement) => {
    if (currentAchievement) {
      // If another achievement is showing, queue this one
      setQueue(prev => [...prev, achievement])
    } else {
      // Otherwise show it immediately
      setCurrentAchievement(achievement)
    }
  }, [currentAchievement])

  const handleClose = useCallback(() => {
    setCurrentAchievement(null)
    
    // Check if there's another achievement in the queue
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev
          setCurrentAchievement(next)
          return rest
        }
        return prev
      })
    }, 500)
  }, [])

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementToast 
        achievement={currentAchievement} 
        onClose={handleClose} 
      />
    </AchievementContext.Provider>
  )
}

export function useAchievement() {
  const context = useContext(AchievementContext)
  if (context === undefined) {
    throw new Error('useAchievement must be used within an AchievementProvider')
  }
  return context
}