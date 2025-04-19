// app/page.tsx
import { createClient } from "@/utils/supabase/server"
import { PostForm } from "@/components/post-form"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 0
  const pageSize = 10

  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get the main board
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('name', 'Main')
    .limit(1)
  
  const mainBoard = boards?.[0]
  
  if (!mainBoard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold">Board Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The main board could not be found. Please contact an administrator.
          </p>
        </div>
      </div>
    )
  }
  
  // Get posts for the main board
  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(id, email),
      comment_count:comments(count),
      thumb_count:thumbs(count)
    `)
    .eq('board_id', mainBoard.id)
    .order('updated_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  
  // Get user thumbs for posts
  let userThumbs: { post_id: string }[] = []
  if (user) {
    const { data: thumbsData } = await supabase
      .from('thumbs')
      .select('post_id')
      .eq('user_id', user.id)
      .is('comment_id', null)
    
    userThumbs = thumbsData || []
  }
  
  // Format posts
  const posts = postsData?.map(post => {
    const userHasThumbed = user ? userThumbs.some(thumb => thumb.post_id === post.id) : false
    
    return {
      ...post,
      author: post.profiles,
      profiles: undefined,
      comment_count: post.comment_count[0]?.count || 0,
      thumb_count: post.thumb_count[0]?.count || 0,
      user_has_thumbed: userHasThumbed
    }
  }) || []
  
  // Check if there are more posts
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('board_id', mainBoard.id)
  
  const totalPages = Math.ceil((count || 0) / pageSize)
  const hasMore = page < totalPages - 1
  const hasPrevious = page > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{mainBoard.name}</h1>
      {mainBoard.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {mainBoard.description}
        </p>
      )}
      
      {user ? (
        <PostForm boardId={mainBoard.id} />
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Join the conversation</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to post and interact with other users.
          </p>
          <Link href="/login">
            <Button>Log in or Sign up</Button>
          </Link>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to start a conversation!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={user ? { id: user.id, email: user.email || '' } : null} 
              />
            ))}
          </div>
          
          <div className="flex justify-between mt-8">
            {hasPrevious ? (
              <Link href={`/?page=${page - 1}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Previous
              </Button>
            )}
            
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
            </div>
            
            {hasMore ? (
              <Link href={`/?page=${page + 1}`}>
                <Button variant="outline">Next</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}