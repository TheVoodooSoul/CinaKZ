import { NextRequest, NextResponse } from 'next/server'

const WAN_RETYLE_DEPLOYMENT_ID = 'af4087d5-1813-453e-bdf6-8accda9474d6'
const COMFYUI_API_URL = `https://api.runcomfy.net/prod/v1/deployments/${WAN_RETYLE_DEPLOYMENT_ID}/inference`
const API_KEY = 'YWJiNDMwZTUtNDM2Ni00NDgwLWJiNzYtYzNiODg5NGYyYTkz'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.input_video_url && !body.input_video_base64) {
      return NextResponse.json(
        { error: 'Either input_video_url or input_video_base64 is required' },
        { status: 400 }
      )
    }

    if (!body.style_prompt) {
      return NextResponse.json(
        { error: 'Style prompt is required' },
        { status: 400 }
      )
    }

    // Prepare the request payload for Wan retyle workflow
    const payload = {
      overrides: {
        // Input video
        input_video_url: body.input_video_url || null,
        input_video_base64: body.input_video_base64 || null,
        
        // Style configuration
        style_prompt: body.style_prompt,
        negative_prompt: body.negative_prompt || 'blurry, low quality, distorted',
        
        // Video processing parameters
        strength: body.strength || 0.75,
        guidance_scale: body.guidance_scale || 7.5,
        num_inference_steps: body.num_inference_steps || 25,
        
        // Frame processing
        first_frame_style: body.first_frame_style || true,
        consistent_style: body.consistent_style || true,
        
        // Output settings
        fps: body.fps || 24,
        quality: body.quality || 'high',
        
        // Advanced parameters
        seed: body.seed || -1,
        temporal_consistency: body.temporal_consistency || 0.8,
        
        // Optional: reference image for style transfer
        reference_image_url: body.reference_image_url || null,
        reference_image_base64: body.reference_image_base64 || null
      }
    }

    // Make request to ComfyUI API
    const response = await fetch(COMFYUI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: 'Failed to retyle video', details: errorData },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Return the result with job ID for tracking
    return NextResponse.json({
      success: true,
      job_id: result.job_id,
      message: 'Video retyling started',
      deployment_id: WAN_RETYLE_DEPLOYMENT_ID,
      style_prompt: body.style_prompt
    })

  } catch (error) {
    console.error('Wan retyle API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
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

    // Check job status
    const statusUrl = `${COMFYUI_API_URL}/${jobId}/status`
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': API_KEY,
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to check job status' },
        { status: response.status }
      )
    }

    const status = await response.json()
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: status.status,
      progress: status.progress || 0,
      result: status.result || null,
      frames_processed: status.frames_processed || 0,
      total_frames: status.total_frames || 0
    })

  } catch (error) {
    console.error('Wan retyle status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}