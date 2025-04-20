// app/api/upload/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to upload images' },
      { status: 401 }
    )
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${postId}/${Date.now()}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('post-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading image:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('post-images')
      .getPublicUrl(fileName)
    
    return NextResponse.json({ url: publicUrl })
    
  } catch (error) {
    console.error('Error handling upload:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}