// app/api/test/add-flairs/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// This is a test endpoint to add one of each flair type to the user's inventory
export async function GET() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be logged in to use this test endpoint' },
      { status: 401 }
    )
  }
  
  try {
    // Get one of each flair type from the flair_items table
    const flairTypes = ['border', 'background', 'effect', 'badge', 'trim']
    const addedFlairs = []
    const errors = []
    
    // For each flair type, get one flair and add it to the user's inventory
    for (const type of flairTypes) {
      // Get one flair of this type - prioritize common rarity
      const { data: flairs, error: flairError } = await supabase
        .from('flair_items')
        .select('*')
        .eq('type', type)
        .eq('rarity', 'common')
        .limit(1)
      
      if (flairError) {
        errors.push(`Error fetching ${type} flair: ${flairError.message}`)
        continue
      }
      
      // If no common flairs, try to get any flair of this type
      if (!flairs.length) {
        const { data: anyFlairs, error: anyFlairError } = await supabase
          .from('flair_items')
          .select('*')
          .eq('type', type)
          .limit(1)
        
        if (anyFlairError) {
          errors.push(`Error fetching any ${type} flair: ${anyFlairError.message}`)
          continue
        }
        
        if (anyFlairs.length) {
          flairs.push(anyFlairs[0])
        }
      }
      
      if (flairs.length === 0) {
        errors.push(`No flairs found for type: ${type}`)
        continue
      }
      
      const flair = flairs[0]
      
      // Check if user already has this flair
      const { data: existingInventory, error: existingError } = await supabase
        .from('user_inventory')
        .select('id')
        .eq('user_id', user.id)
        .eq('flair_id', flair.id)
        .maybeSingle()
      
      if (existingError) {
        errors.push(`Error checking inventory for ${type} flair: ${existingError.message}`)
        continue
      }
      
      // Skip if user already has this flair
      if (existingInventory) {
        addedFlairs.push({
          id: flair.id,
          type: flair.type,
          name: flair.name,
          status: 'already_exists'
        })
        continue
      }
      
      // Add to user's inventory
      const { data: inventoryItem, error: addError } = await supabase
        .from('user_inventory')
        .insert([
          {
            user_id: user.id,
            flair_id: flair.id,
            acquired_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (addError) {
        errors.push(`Error adding ${type} flair to inventory: ${addError.message}`)
        continue
      }
      
      addedFlairs.push({
        id: flair.id,
        type: flair.type,
        name: flair.name,
        rarity: flair.rarity,
        inventory_id: inventoryItem[0].id,
        status: 'added'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Added flairs to your inventory`,
      user_id: user.id,
      added_flairs: addedFlairs,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Error adding test flairs:', error)
    return NextResponse.json(
      { error: 'Failed to add test flairs to inventory' },
      { status: 500 }
    )
  }
}