import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ParsedAction {
  character: string
  action: string
  intent: 'attack' | 'defend' | 'move' | 'interact' | 'emote'
  intensity: 'low' | 'medium' | 'high'
  camera_suggestion?: string
  lighting_suggestion?: string
  duration_estimate: number
}

interface SceneAnalysis {
  overall_tone: 'dramatic' | 'intense' | 'chaotic' | 'tactical' | 'emotional'
  pacing: 'slow' | 'medium' | 'fast' | 'variable'
  suggested_camera_work: string[]
  suggested_lighting: string
  complexity_score: number
  estimated_duration: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, context } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Analyze the action description and extract structured information
    const analysisPrompt = `
    You are an expert action choreographer and fight director. Analyze the following action description and extract structured information:

    Text: "${text}"

    Context: ${context || 'No additional context provided'}

    Please provide a JSON response with the following structure:
    {
      "actions": [
        {
          "character": "character_name",
          "action": "specific_action_description",
          "intent": "attack|defend|move|interact|emote",
          "intensity": "low|medium|high",
          "camera_suggestion": "suggested_camera_movement",
          "lighting_suggestion": "suggested_lighting",
          "duration_estimate": estimated_duration_in_seconds
        }
      ],
      "scene_analysis": {
        "overall_tone": "dramatic|intense|chaotic|tactical|emotional",
        "pacing": "slow|medium|fast|variable",
        "suggested_camera_work": ["camera_suggestion_1", "camera_suggestion_2"],
        "suggested_lighting": "lighting_suggestion",
        "complexity_score": score_1_10,
        "estimated_duration": total_estimated_duration
      },
      "enhanced_description": "enhanced_cinematic_description",
      "storyboard_suggestions": ["suggestion_1", "suggestion_2", "suggestion_3"]
    }

    Focus on:
    1. Identifying specific characters and their actions
    2. Understanding the intent and intensity of each action
    3. Suggesting appropriate camera movements and lighting
    4. Estimating realistic durations for each action
    5. Providing cinematic enhancements to the description
    6. Breaking down complex sequences into individual storyboard nodes

    Return only valid JSON.
    `

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert action choreographer and fight director with deep knowledge of cinematography and visual storytelling.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const analysisText = completion.choices[0]?.message?.content
    
    if (!analysisText) {
      throw new Error('No analysis generated')
    }

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch (error) {
      console.error('Failed to parse analysis JSON:', analysisText)
      throw new Error('Invalid analysis format')
    }

    return NextResponse.json({
      success: true,
      analysis: analysis,
      original_text: text,
      processed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('NLP processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process text', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'NLP processing endpoint is available',
    capabilities: [
      'Action sequence parsing',
      'Character intent analysis',
      'Camera movement suggestions',
      'Lighting recommendations',
      'Duration estimation',
      'Scene complexity assessment',
      'Cinematic enhancement'
    ]
  })
}