"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Currency, InventoryItem } from '@/types/database'

interface InventoryDisplayProps {
  className?: string
  onCurrencyUpdate?: (currency: Currency) => void
}

export function InventoryDisplay({ className, onCurrencyUpdate }: InventoryDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [currency, setCurrency] = useState<Currency>({ ink_points: 0, prismatic_ink: 0 })
  
  // Load inventory on mount
  useEffect(() => {
    fetchInventory()
    fetchCurrency()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/engagement/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrency = async () => {
    try {
      const response = await fetch('/api/engagement/activities')
      if (response.ok) {
        const data = await response.json()
        setCurrency(data.currency)
        
        // Notify parent component of currency update if callback provided
        if (onCurrencyUpdate) {
          onCurrencyUpdate(data.currency)
        }
      }
    } catch (error) {
      console.error('Error fetching currency:', error)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 dark:border-gray-600'
      case 'rare': return 'border-blue-400 dark:border-blue-500'
      case 'epic': return 'border-purple-400 dark:border-purple-500'
      case 'legendary': return 'border-amber-400 dark:border-amber-500'
      default: return 'border-gray-300 dark:border-gray-600'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 dark:text-gray-300'
      case 'rare': return 'text-blue-600 dark:text-blue-300'
      case 'epic': return 'text-purple-600 dark:text-purple-300'
      case 'legendary': return 'text-amber-600 dark:text-amber-300'
      default: return 'text-gray-600 dark:text-gray-300'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Flairs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>Your flair collection is empty</p>
            <p className="text-sm mt-2">Complete achievements to earn flairs!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(inventory.reduce((acc, item) => {
              const type = item.flair.type;
              if (!acc[type]) acc[type] = [];
              acc[type].push(item);
              return acc;
            }, {} as Record<string, typeof inventory>)).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-lg font-medium mb-3 capitalize">{type} Flairs</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`border-2 rounded-lg p-3 flex flex-col items-center justify-center ${getRarityColor(item.flair.rarity)}`}
                    >
                      <div className="text-center">
                        <p className={`font-medium ${getRarityTextColor(item.flair.rarity)}`}>
                          {item.flair.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize mt-1">
                          {item.flair.rarity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}