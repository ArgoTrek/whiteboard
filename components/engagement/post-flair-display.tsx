"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Layers, PaintBucket, Sparkles } from 'lucide-react'

interface PostFlairDisplayProps {
  postId: string
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

export function PostFlairDisplay({ postId, className }: PostFlairDisplayProps) {
  const [loading, setLoading] = useState(true)
  const [flairs, setFlairs] = useState<PostFlair[]>([])
  const [flairsByType, setFlairsByType] = useState<Record<string, Flair[]>>({})

  // Load flairs on mount
  useEffect(() => {
    fetchFlairs()
  }, [postId])

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

  // If no flairs, don't render anything
  if (flairs.length === 0) {
    return null
  }

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
              {getFlairIcon(flair.flair.type)}
              <span className={cn("ml-1", getRarityColor(flair.flair.rarity))}>
                {flair.flair.name}
              </span>
            </div>
          ))}
        </div>
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