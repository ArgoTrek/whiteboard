"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CircleDollarSign, Sparkles, Gift, History, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAchievement } from '@/components/achievements/achievement-context'
import { Currency, Flair, InventoryItem } from '@/types/database'

interface CurrencyDisplayProps {
  className?: string
  onCurrencyUpdate?: (currency: Currency) => void
}

interface GachaCollection {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  rarities: string[];
}

interface GachaPull {
  id: string;
  pull_time: string;
  flair_items: Flair;
}

export function CurrencyDisplay({ className, onCurrencyUpdate }: CurrencyDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState(false)
  const [currency, setCurrency] = useState<Currency>({ ink_points: 0, prismatic_ink: 0 })
  const [collections, setCollections] = useState<GachaCollection[]>([])
  const [recentPulls, setRecentPulls] = useState<GachaPull[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'gacha' | 'inventory'>('gacha')
  
  const { showAchievement } = useAchievement()

  // Load currency and gacha info on mount
  useEffect(() => {
    fetchGachaInfo()
    fetchInventory()
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

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/engagement/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
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
        
        // Update inventory
        fetchInventory()
        
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
    <div className={className}>
      <div className="flex space-x-4 mb-4">
        <Button
          variant={activeTab === 'gacha' ? 'default' : 'outline'}
          onClick={() => setActiveTab('gacha')}
          className="flex-1"
        >
          <Gift className="mr-2 h-4 w-4" />
          Gacha
        </Button>
        <Button
          variant={activeTab === 'inventory' ? 'default' : 'outline'}
          onClick={() => setActiveTab('inventory')}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Inventory
        </Button>
      </div>

      {activeTab === 'gacha' && (
        <>
          {/* Gacha Panel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gacha Machine</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    {collections.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">{collections[0].name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {collections[0].description || "Collect unique flairs to customize your posts!"}
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {collections[0].rarities.map(rarity => (
                            <span 
                              key={rarity}
                              className={`text-xs px-2 py-1 rounded-full ${getRarityTextColor(rarity)} bg-gray-100 dark:bg-gray-800`}
                            >
                              {rarity}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Gift className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-500">No active gacha collections available</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button
                      onClick={() => handleGachaPull(false)}
                      disabled={pulling || currency.ink_points < 100 || collections.length === 0}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      {pulling ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <CircleDollarSign className="mr-2 h-4 w-4" />
                      )}
                      Standard Pull (100 Ink)
                    </Button>
                    
                    <Button
                      onClick={() => handleGachaPull(true)}
                      disabled={pulling || currency.prismatic_ink < 1 || collections.length === 0}
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                    >
                      {pulling ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Premium Pull (1 Prismatic)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Pulls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Pulls</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-500"
              >
                <History className="h-4 w-4 mr-1" />
                {showHistory ? 'Show Less' : 'Show More'}
              </Button>
            </CardHeader>
            <CardContent>
              {recentPulls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent pulls</p>
                  <p className="text-sm mt-2">Try your luck with the gacha machine!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {recentPulls.slice(0, showHistory ? undefined : 6).map((pull) => (
                    <div 
                      key={pull.id} 
                      className={`border-2 rounded-lg p-3 flex flex-col items-center justify-center ${getRarityColor(pull.flair_items.rarity)}`}
                    >
                      <div className="text-center">
                        <p className={`font-medium ${getRarityTextColor(pull.flair_items.rarity)}`}>
                          {pull.flair_items.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize mt-1">
                          {pull.flair_items.type} · {pull.flair_items.rarity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'inventory' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Inventory</CardTitle>
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
                <p>Your inventory is empty</p>
                <p className="text-sm mt-2">Try your luck with the gacha machine!</p>
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
          <CardFooter className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('gacha')} 
              className="text-sm"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Get More Flairs
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}