// components/post-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface PostFormProps {
  boardId: string
}

export function PostForm({ boardId }: PostFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canPost, setCanPost] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
        setCanPost(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkCanPost()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
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
      
      if (response.ok) {
        setContent("")
        setCanPost(false)
        router.refresh()
      } else {
        alert(data.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
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
        <CardContent className="pt-6">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
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