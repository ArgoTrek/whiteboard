"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus, X, PaintBucket, Sparkles } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PostFormProps {
  boardId: string
}

interface Flair {
  id: string
  name: string
  type: string
  rarity: string
  css_class: string
}

export function PostForm({ boardId }: PostFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canPost, setCanPost] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedFlair, setSelectedFlair] = useState<Flair | null>(null)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkCanPost() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/user/can-post")
        const data = await response.json()
        setCanPost(data.can_post)
        
        // If user can post, also load their flair inventory
        if (data.can_post) {
          fetchInventory()
        }
      } catch (error) {
        console.error("Error checking if user can post:", error)
        toast.error("Couldn't verify if you can post today")
        setCanPost(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkCanPost()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoadingInventory(true)
      const response = await fetch('/api/engagement/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      
      const data = await response.json()
      setInventory(data.inventory)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load your flair inventory')
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setImage(null)
      setImagePreview(null)
      return
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are allowed")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle click on upload button
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  // Handle image removal
  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (postId: string): Promise<string | null> => {
    if (!image) return null

    const formData = new FormData()
    formData.append('file', image)
    formData.append('postId', postId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    }
  }

  // Get rarity color for flair display
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

  // Group inventory by type for dropdown
  const groupedInventory = inventory.reduce((acc, item) => {
    const type = item.flair.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(item)
    return acc
  }, {} as Record<string, any[]>)

  // Select a flair to apply to the post
  const handleSelectFlair = (flair: Flair) => {
    setSelectedFlair(flair)
    toast.success(`Selected flair: ${flair.name}`)
  }

  // Remove selected flair
  const handleRemoveFlair = () => {
    setSelectedFlair(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // First create the post
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board_id: boardId,
          content,
          flair_id: selectedFlair?.id // Include the selected flair ID
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create post")
      }

      // Now upload the image if there is one
      if (image) {
        const imageUrl = await uploadImage(data.post.id)
        
        if (imageUrl) {
          // Update the post with the image URL
          const updateResponse = await fetch(`/api/posts/${data.post.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: imageUrl,
            }),
          })
          
          if (!updateResponse.ok) {
            console.error("Failed to update post with image URL")
          }
        }
      }

      setContent("")
      setImage(null)
      setImagePreview(null)
      setSelectedFlair(null)
      setCanPost(false)
      toast.success("Post created successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error(error instanceof Error ? error.message : "There was an error creating your post")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  if (!canPost) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-center py-4 text-gray-500">
            You have already created a post today. You can post again tomorrow.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />

          {/* Image upload area */}
          <div 
            className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-48 max-w-full mx-auto rounded-md" 
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <ImagePlus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Drag and drop an image here, or{" "}
                  <button
                    type="button"
                    className="text-blue-500 hover:underline focus:outline-none"
                    onClick={handleUploadClick}
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </div>
          
          {/* Flair Selection */}
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Post Flair (Optional)</h3>
              {
                loadingInventory ? (
                  <div className="text-xs text-gray-500">Loading flairs...</div>
                ) : inventory.length === 0 ? (
                  <div className="text-xs text-gray-500">You don't have any flairs yet</div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <PaintBucket className="h-3 w-3 mr-1" />
                        <span>Select Flair</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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
                              onClick={() => handleSelectFlair(item.flair)}
                              className={getRarityColor(item.flair.rarity)}
                            >
                              <FlairIcon type={item.flair.type} />
                              <span className="ml-1">{item.flair.name}</span>
                            </DropdownMenuItem>
                          ))}
                          
                          <DropdownMenuSeparator />
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            </div>
            
            {/* Selected Flair Display */}
            {selectedFlair && (
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                <div className="flex items-center">
                  <FlairIcon type={selectedFlair.type} />
                  <span className={`ml-2 text-sm ${getRarityColor(selectedFlair.rarity)}`}>
                    {selectedFlair.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFlair}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {!selectedFlair && (
              <p className="text-xs text-gray-500">
                Select a flair to apply to your post. Flairs can only be applied when creating a post.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-gray-500">
            You can create one post per day.
          </p>
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// Helper component to render appropriate icon for flair type
function FlairIcon({ type }: { type: string }) {
  switch (type) {
    case 'border':
      return <PaintBucket className="h-3 w-3" />
    case 'background':
      return <div className="h-3 w-3 bg-blue-200 dark:bg-blue-800 rounded-sm" />
    case 'effect':
      return <Sparkles className="h-3 w-3" />
    case 'badge':
      return <div className="h-3 w-3 rounded-full bg-amber-200 dark:bg-amber-800" />
    case 'trim':
      return <div className="h-3 w-3 border border-gray-400 dark:border-gray-600" />
    default:
      return <Sparkles className="h-3 w-3" />
  }
}