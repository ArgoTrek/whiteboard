"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus, X } from "lucide-react"

interface PostFormProps {
  boardId: string
}

export function PostForm({ boardId }: PostFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canPost, setCanPost] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkCanPost() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/user/can-post")
        const data = await response.json()
        setCanPost(data.can_post)
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