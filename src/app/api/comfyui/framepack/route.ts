import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.video_clips || !Array.isArray(body.video_clips) || body.video_clips.length === 0) {
      return NextResponse.json(
        { error: 'Video clips array is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    const apiKey = process.env.RUNCOMFY_API_KEY
    if (!apiKey || apiKey === 'your_runcomfy_api_key_here') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key not configured. Please set RUNCOMFY_API_KEY environment variable.',
          setup_required: true
        },
        { status: 503 }
      )
    }

    // Use environment variables for configuration
    const deploymentId = process.env.FRAMEPACK_DEPLOYMENT_ID || '70c87128-d68d-4a9a-a2a8-512637c84228'
    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
    const apiUrl = `${baseUrl}/deployments/${deploymentId}/inference`

    console.log('Calling Framepack API:', apiUrl)

    // Prepare the request payload for Framepack workflow
    const payload = {
      overrides: {
        video_clips: body.video_clips,
        // Framepack specific parameters for stitching multiple scenes
        output_duration: Math.min(body.output_duration || 60, 60), // Max 60 seconds as specified
        transition_style: body.transition_style || 'smooth',
        quality: body.quality || 'high',
        fps: body.fps || 24,
        resolution: body.resolution || '1920x1080',
        // Audio settings
        audio_enabled: body.audio_enabled || false,
        background_music: body.background_music || null,
        // Additional effects for cinematic quality
        effects: {
          color_grading: body.color_grading || 'cinematic',
          motion_smoothing: true,
          scene_transitions: true,
          auto_crop: true
        },
        // Framepack-specific stitching options
        stitching_options: {
          enable_smart_cutting: true,
          scene_detection: true,
          auto_timing: true,
          crossfade_duration: 0.5
        }
      }
    }

    console.log('Framepack payload for stitching:', JSON.stringify({
      ...payload,
      clips_count: body.video_clips.length,
      total_duration: body.output_duration || 60
    }, null, 2))

    // Make request to ComfyUI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Framepack API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Failed to stitch video clips', details: errorData },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Framepack API response:', result)
    
    // Return the result with job ID for tracking
    return NextResponse.json({
      success: true,
      job_id: result.id || result.job_id || `framepack-${Date.now()}`,
      message: 'Video stitching started',
      deployment_id: deploymentId,
      estimated_duration: body.output_duration || 60
    })

  } catch (error) {
    console.error('Framepack API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        setup_required: error.message.includes('API key not configured')
      },
      { status: error.message.includes('API key not configured') ? 503 : 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    const apiKey = process.env.RUNCOMFY_API_KEY
    if (!apiKey || apiKey === 'your_runcomfy_api_key_here') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key not configured. Please set RUNCOMFY_API_KEY environment variable.',
          setup_required: true
        },
        { status: 503 }
      )
    }

    const deploymentId = process.env.FRAMEPACK_DEPLOYMENT_ID || '70c87128-d68d-4a9a-a2a8-512637c84228'
    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
    
    // Check job status - try multiple possible endpoint patterns
    const possibleEndpoints = [
      `${baseUrl}/jobs/${jobId}`,
      `${baseUrl}/deployments/${deploymentId}/jobs/${jobId}`,
      `${baseUrl}/deployments/70c87128-d68d-4a9a-a2a8-512637c84228/jobs/${jobId}`
    ]

    let result = null
    let workingEndpoint = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Trying Framepack endpoint:', endpoint)
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': apiKey,
          }
        })

        if (response.ok) {
          result = await response.json()
          workingEndpoint = endpoint
          break
        }
      } catch (error) {
        console.log('Framepack endpoint failed:', endpoint, error.message)
        continue
      }
    }

    if (!result) {
      throw new Error('Unable to fetch Framepack job status from any endpoint')
    }

    console.log('Framepack job status response:', result)
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: result.status || 'processing',
      progress: result.progress || 0,
      result: result.result || null,
      clips_processed: result.clips_processed || 0,
      total_clips: result.total_clips || 0,
      endpoint: workingEndpoint
    })

  } catch (error) {
    console.error('Framepack status check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        setup_required: error.message.includes('API key not configured')
      },
      { status: error.message.includes('API key not configured') ? 503 : 500 }
    )
  }
}