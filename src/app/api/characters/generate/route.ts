import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Character name and description are required' },
        { status: 400 }
      )
    }

    // Generate image using Z-AI
    const zai = await ZAI.create()
    
    // Create a detailed prompt for character generation
    const prompt = `Create a detailed character portrait of ${body.name}, ${body.description}. 
    Style: cinematic, professional character design, detailed facial features, dramatic lighting, 
    high quality, 8k resolution, realistic, movie character design, professional photography.
    The character should look ready for action scenes with dynamic pose and intense expression.
    Background should be subtle and cinematic.`

    const imageResponse = await zai.images.generations.create({
      prompt: prompt,
      size: '1024x1024'
    })

    if (!imageResponse.data || !imageResponse.data[0]) {
      return NextResponse.json(
        { error: 'Failed to generate character image' },
        { status: 500 }
      )
    }

    const imageBase64 = imageResponse.data[0].base64
    
    return NextResponse.json({
      success: true,
      character: {
        name: body.name,
        description: body.description,
        image_base64: imageBase64,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Character generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}