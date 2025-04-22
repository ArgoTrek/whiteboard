"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PaintBucket, Layers, Sparkles, X } from 'lucide-react'

interface PostFlairDisplayProps {
  postId: string
  userId?: string
  className?: string
}

interface Flair {
  id: string
  name: string
  type: string
  rarity: string
  css_class: string
  preview_image_url?: string
}

interface PostFlair {
  id: string
  applied_at: string
  flair: Flair
}

export function PostFlairDisplay({ postId, userId, className }: PostFlairDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [flairs, setFlairs] = useState<PostFlair[]>([])
  const [flairsByType, setFlairsByType] = useState<Record<string, Flair[]>>({})
  const [inventory, setInventory] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Load flairs on mount
  useEffect(() => {
    fetchFlairs()
    
    // Check if user is post owner to load inventory
    if (userId) {
      checkOwnership()
    }
  }, [postId, userId])

  const fetchFlairs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/engagement/post-flairs?post_id=${postId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch post flairs')
      }
      
      const data = await response.json()
      setFlairs(data.flairs)
      setFlairsByType(data.flairsByType)
    } catch (error) {
      console.error('Error fetching post flairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkOwnership = async () => {
    try {
      // Fetch the post to check ownership
      const response = await fetch(`/api/posts/${postId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch post')
      }
      
      const data = await response.json()
      
      // Check if current user is post owner
      const isPostOwner = data.post.user_id === userId
      setIsOwner(isPostOwner)
      
      // If owner, fetch inventory
      if (isPostOwner) {
        fetchInventory()
      }
    } catch (error) {
      console.error('Error checking post ownership:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/engagement/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      
      const data = await response.json()
      setInventory(data.inventory)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const applyFlair = async (flairId: string) => {
    if (isApplying) return
    
    try {
      setIsApplying(true)
      
      const response = await fetch('/api/engagement/apply-flair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postId,
          flair_id: flairId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to apply flair')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        // Refresh flairs
        fetchFlairs()
      } else {
        toast.error(data.message || 'Failed to apply flair')
      }
    } catch (error) {
      console.error('Error applying flair:', error)
      toast.error('Failed to apply flair to post')
    } finally {
      setIsApplying(false)
    }
  }

  const removeFlair = async (flairId: string) => {
    if (isRemoving) return
    
    try {
      setIsRemoving(true)
      
      const response = await fetch(`/api/engagement/apply-flair?post_id=${postId}&flair_id=${flairId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove flair')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        // Refresh flairs
        fetchFlairs()
      } else {
        toast.error(data.message || 'Failed to remove flair')
      }
    } catch (error) {
      console.error('Error removing flair:', error)
      toast.error('Failed to remove flair from post')
    } finally {
      setIsRemoving(false)
    }
  }

  // Get CSS classes for flairs
  const getFlairClasses = () => {
    const classes: string[] = []
    
    // Add classes from each flair type
    Object.entries(flairsByType).forEach(([type, typeFlairs]) => {
      typeFlairs.forEach(flair => {
        if (flair.css_class) {
          classes.push(flair.css_class)
        }
      })
    })
    
    return classes.join(' ')
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600 dark:text-gray-300'
      case 'rare':
        return 'text-blue-600 dark:text-blue-300'
      case 'epic':
        return 'text-purple-600 dark:text-purple-300'
      case 'legendary':
        return 'text-amber-600 dark:text-amber-300'
      default:
        return 'text-gray-600 dark:text-gray-300'
    }
  }

  // Get available flairs not yet applied to this post
  const getAvailableFlairs = () => {
    if (!inventory || inventory.length === 0) return []
    
    const appliedFlairIds = flairs.map(f => f.flair.id)
    return inventory.filter(item => !appliedFlairIds.includes(item.flair.id))
  }

  // If no flairs and not owner, don't render anything
  if (flairs.length === 0 && !isOwner) {
    return null
  }

  // Group inventory by type for dropdown
  const groupedInventory = getAvailableFlairs().reduce((acc, item) => {
    const type = item.flair.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className={cn("mb-4", className, getFlairClasses())}>
      {/* Applied flairs display */}
      {flairs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {flairs.map(flair => (
            <div 
              key={flair.id}
              className={cn(
                "px-2 py-1 rounded-full text-xs flex items-center",
                flair.flair.type === 'border' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                flair.flair.type === 'background' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                flair.flair.type === 'effect' && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
                flair.flair.type === 'badge' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                flair.flair.type === 'trim' && "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
              )}
            >
              <span className={getRarityColor(flair.flair.rarity)}>
                {flair.flair.name}
              </span>
              
              {/* Remove button if owner */}
              {isOwner && (
                <button
                  onClick={() => removeFlair(flair.flair.id)}
                  className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isRemoving}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Add flair button for post owner */}
      {isOwner && Object.keys(groupedInventory).length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <PaintBucket className="h-3 w-3 mr-1" />
              <span>Add Flair</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Choose Flair</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {Object.entries(groupedInventory).map(([type, items]) => (
              <div key={type}>
                <DropdownMenuLabel className="text-xs text-gray-500 capitalize">
                  {type}
                </DropdownMenuLabel>
                
                {items.map(item => (
                  <DropdownMenuItem 
                    key={item.id}
                    onClick={() => applyFlair(item.flair.id)}
                    disabled={isApplying}
                    className={getRarityColor(item.flair.rarity)}
                  >
                    {getFlairIcon(item.flair.type)}
                    <span className="ml-1">{item.flair.name}</span>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Helper to get icon for flair type
function getFlairIcon(type: string) {
  switch (type) {
    case 'border':
      return <PaintBucket className="h-3 w-3" />
    case 'background':
      return <Layers className="h-3 w-3" />
    case 'effect':
    case 'badge':
    case 'trim':
      return <Sparkles className="h-3 w-3" />
    default:
      return <Sparkles className="h-3 w-3" />
  }
}