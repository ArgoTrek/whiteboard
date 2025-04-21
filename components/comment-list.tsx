"use client"

import { Comment } from "@/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ThumbsUp, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface CommentListProps {
  comments: Comment[]
  currentUser?: { id: string; email: string } | null
  onCommentsChange: (comments: Comment[]) => void
}

export function CommentList({ comments, currentUser, onCommentsChange }: CommentListProps) {
  const [loadingCommentId, setLoadingCommentId] = useState<string | null>(null)
  const supabase = createClient()

  const handleThumbUp = async (comment: Comment) => {
    if (!currentUser || loadingCommentId === comment.id) return

    setLoadingCommentId(comment.id)
    try {
      const response = await fetch("/api/thumbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: comment.id,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        const updatedComments = comments.map((c) => {
          if (c.id === comment.id) {
            return {
              ...c,
              thumb_count:
                data.action === "added"
                  ? (c.thumb_count || 0) + 1
                  : (c.thumb_count || 0) - 1,
              user_has_thumbed: data.action === "added",
            }
          }
          return c
        })
        onCommentsChange(updatedComments)
        
        if (data.action === "added") {
          toast.success("You liked this comment")
        } else {
          toast.success("You unliked this comment")
        }
      }
    } catch (error) {
      console.error("Error toggling thumb:", error)
      toast.error("Failed to update like status")
    } finally {
      setLoadingCommentId(null)
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    if (!currentUser || currentUser.id !== comment.user_id) return
    
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', comment.id)
        
        if (error) {
          throw error
        }
        
        const updatedComments = comments.filter(c => c.id !== comment.id)
        onCommentsChange(updatedComments)
        toast.success("Comment deleted successfully")
      } catch (error) {
        console.error("Error deleting comment:", error)
        toast.error("Failed to delete comment")
      }
    }
  }

  if (comments.length === 0) {
    return <p className="text-center text-gray-500 py-2">No comments yet.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-md border p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.author?.avatar_url || ""} />
                <AvatarFallback>
                  {(comment.author?.username || comment.author?.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {comment.author?.username || comment.author?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            </div>
            {currentUser && currentUser.id === comment.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDeleteComment(comment)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-2 text-sm whitespace-pre-line">{comment.content}</p>
          <div className="mt-2 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`flex h-6 items-center space-x-1 text-xs px-2 ${
                comment.user_has_thumbed ? "text-blue-500" : ""
              }`}
              onClick={() => handleThumbUp(comment)}
              disabled={!currentUser || loadingCommentId === comment.id}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              <span>{comment.thumb_count || 0}</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}