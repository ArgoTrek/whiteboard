// scripts/initialize-storage.ts
const { createClient } = require('@supabase/supabase-js');

async function initializeStorage() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables for Supabase')
    process.exit(1)
  }

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check if the bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === 'post-images')

    if (!bucketExists) {
      // Create the post-images bucket
      const { data, error } = await supabase.storage.createBucket('post-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })

      if (error) {
        throw error
      }

      console.log('Created post-images bucket:', data)
    } else {
      console.log('post-images bucket already exists')
    }

    // Set the bucket policy to allow public access to files
    await supabase.storage.from('post-images').getPublicUrl('')

    console.log('Storage initialization complete')
  } catch (error) {
    console.error('Error initializing storage:', error)
    process.exit(1)
  }
}

initializeStorage()