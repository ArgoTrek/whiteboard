"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import { Post, Comment } from "@/types/database"
import { ThumbsUp, MessageSquare, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { CommentList } from "@/components/comment-list"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

interface PostCardProps {
  post: Post
  currentUser?: { id: string; email: string } | null
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isThumbsLoading, setIsThumbsLoading] = useState(false)
  const [thumbCount, setThumbCount] = useState(post.thumb_count || 0)
  const [userHasThumbed, setUserHasThumbed] = useState(post.user_has_thumbed || false)

  
  const router = useRouter()
  const supabase = createClient()

  const loadComments = async () => {
    if (!showComments && !comments.length) {
      setIsLoadingComments(true)
      try {
        const response = await fetch(`/api/comments?post_id=${post.id}`)
        const data = await response.json()
        setComments(data.comments)
      } catch (error) {
        console.error("Error loading comments:", error)
        toast.error("Failed to load comments")
      } finally {
        setIsLoadingComments(false)
      }
    }
    setShowComments(!showComments)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: post.id,
          content: newComment,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setComments([...comments, data.comment])
        setNewComment("")
        toast.success("Comment added")
        // Refresh the page to update the post order
        router.refresh()
      } else {
        toast.error(data.error || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("There was an error posting your comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleThumbUp = async () => {
    if (!currentUser || isThumbsLoading) return

    setIsThumbsLoading(true)
    try {
      const response = await fetch("/api/thumbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: post.id,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        if (data.action === "added") {
          setThumbCount(thumbCount + 1)
          setUserHasThumbed(true)
          toast.success("You liked this post")
        } else {
          setThumbCount(thumbCount - 1)
          setUserHasThumbed(false)
          toast.success("You unliked this post")
        }
      }
    } catch (error) {
      console.error("Error toggling thumb:", error)
      toast.error("Failed to update like status")
    } finally {
      setIsThumbsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUser || currentUser.id !== post.user_id) return
    
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id)
        
        if (error) {
          throw error
        }
        
        // If post has an image, delete it from storage
        if (post.image_url) {
          // Extract the filename from the URL
          const url = new URL(post.image_url)
          const pathParts = url.pathname.split('/')
          const bucketName = pathParts[1] // e.g., 'post-images'
          const filePath = pathParts.slice(2).join('/') // e.g., 'postId/123456.jpg'
          
          // Delete the file from storage
          const { error: storageError } = await supabase
            .storage
            .from(bucketName)
            .remove([filePath])
          
          if (storageError) {
            console.error('Error deleting image:', storageError)
          }
        }
        
        toast.success("Post deleted successfully")
        router.refresh()
      } catch (error) {
        console.error("Error deleting post:", error)
        toast.error("Failed to delete post")
      }
    }
  }



  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatar_url || ""} />
              <AvatarFallback>
                {(post.author?.username || post.author?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {post.author?.username || post.author?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              #{post.cosmetic_id}
            </span>
            {currentUser && currentUser.id === post.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="whitespace-pre-line">{post.content}</p>
          
          {/* Display image if available */}
          {post.image_url && (
            <div className="mt-4 flex justify-center">
              <img 
                src={post.image_url} 
                alt="Post attachment" 
                className="max-h-96 max-w-full h-auto object-contain rounded-md"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-4 pb-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 ${
                userHasThumbed ? "text-blue-500" : ""
              }`}
              onClick={handleThumbUp}
              disabled={!currentUser || isThumbsLoading}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{thumbCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={loadComments}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{comments.length || post.comment_count || 0}</span>
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="w-full">
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <p>Loading comments...</p>
              </div>
            ) : (
              <>
                <CommentList 
                  comments={comments} 
                  currentUser={currentUser}
                  onCommentsChange={(updatedComments) => setComments(updatedComments)}
                />
                {currentUser && (
                  <form onSubmit={handleComment} className="mt-4">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}