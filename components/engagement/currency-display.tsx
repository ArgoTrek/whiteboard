"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CircleDollarSign, Sparkles, Gift, History } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAchievement } from '@/components/achievements/achievement-context'

interface CurrencyDisplayProps {
  className?: string
  onCurrencyUpdate?: (currency: { ink_points: number; prismatic_ink: number }) => void
}

export function CurrencyDisplay({ className, onCurrencyUpdate }: CurrencyDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState({ ink_points: 0, prismatic_ink: 0 })
  const [pulling, setPulling] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [recentPulls, setRecentPulls] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  const { showAchievement } = useAchievement()

  // Load currency and gacha info on mount
  useEffect(() => {
    fetchGachaInfo()
  }, [])

  const fetchGachaInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/engagement/gacha')
      
      if (!response.ok) {
        throw new Error('Failed to fetch gacha info')
      }
      
      const data = await response.json()
      setCurrency(data.currency)
      setCollections(data.collections)
      setRecentPulls(data.recentPulls)
      
      // Notify parent component of currency update if callback provided
      if (onCurrencyUpdate) {
        onCurrencyUpdate(data.currency)
      }
    } catch (error) {
      console.error('Error fetching gacha info:', error)
      toast.error('Failed to load currency information')
    } finally {
      setLoading(false)
    }
  }

  const handleGachaPull = async (isPremium: boolean = false) => {
    // Check if user has enough currency
    if ((isPremium && currency.prismatic_ink < 1) || 
        (!isPremium && currency.ink_points < 100)) {
      toast.error(`Not enough ${isPremium ? 'Prismatic Ink' : 'Ink Points'} for a pull`)
      return
    }
    
    if (collections.length === 0) {
      toast.error('No active gacha collections available')
      return
    }
    
    try {
      setPulling(true)
      
      // Use the first collection for now
      const collectionId = collections[0].id
      
      const response = await fetch('/api/engagement/gacha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection_id: collectionId,
          is_premium: isPremium
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to perform gacha pull')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update currency
        setCurrency(data.currency)
        
        // Add to recent pulls
        setRecentPulls(prev => [
          {
            id: Math.random().toString(),
            pull_time: data.pull.timestamp,
            flair_items: data.pull.flair
          },
          ...prev.slice(0, 9) // Keep only 10 items
        ])
        
        // Show achievement for first pull if needed
        if (recentPulls.length === 0) {
          showAchievement({
            id: 'first-pull',
            name: 'Gacha Beginner',
            description: `You've made your first gacha pull!`,
            category: 'engagement',
            icon: 'gift',
            rewards: {
              ink_points: 10
            }
          })
        }
        
        // Show toast notification
        const rarityColors: Record<string, string> = {
          common: 'text-gray-600 dark:text-gray-300',
          rare: 'text-blue-600 dark:text-blue-300',
          epic: 'text-purple-600 dark:text-purple-300',
          legendary: 'text-amber-600 dark:text-amber-300'
        }
        
        toast.success(
          <div className="flex flex-col">
            <span>You obtained:</span>
            <span className={rarityColors[data.pull.flair.rarity] || 'text-gray-600'}>
              {data.pull.flair.name} ({data.pull.flair.rarity})
            </span>
          </div>
        )
        
        // Notify parent component of currency update if callback provided
        if (onCurrencyUpdate) {
          onCurrencyUpdate(data.currency)
        }
      } else {
        toast.error(data.message || 'Failed to perform gacha pull')
      }
    } catch (error) {
      console.error('Error performing gacha pull:', error)
      toast.error('Failed to perform gacha pull')
    } finally {
      setPulling(false)
    }
  }
}