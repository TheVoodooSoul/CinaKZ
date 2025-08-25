import { NextRequest, NextResponse } from 'next/server'

const FUSIONX_DEPLOYMENT_ID = 'f3a34e84-7d00-4ee0-b3c8-3bb0c2318f1a'
const COMFYUI_API_URL = `https://api.runcomfy.net/prod/v1/deployments/${FUSIONX_DEPLOYMENT_ID}/inference`
const API_KEY = 'YWJiNDMwZTUtNDM2Ni00NDgwLWJiNzYtYzNiODg5NGYyYTkz'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Prepare the request payload for FusionX workflow
    const payload = {
      overrides: {
        prompt: body.prompt,
        negative_prompt: body.negative_prompt || 'blurry, low quality, distorted',
        width: body.width || 1024,
        height: body.height || 576,
        num_frames: body.num_frames || 48,
        fps: body.fps || 24,
        // Add controlnet parameters if provided
        controlnet: body.controlnet || {},
        // Add other FusionX specific parameters
        seed: body.seed || -1,
        steps: body.steps || 25,
        cfg_scale: body.cfg_scale || 7.5,
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
        { error: 'Failed to generate video', details: errorData },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Return the result with job ID for tracking
    return NextResponse.json({
      success: true,
      job_id: result.job_id,
      message: 'Video generation started',
      deployment_id: FUSIONX_DEPLOYMENT_ID
    })

  } catch (error) {
    console.error('FusionX API error:', error)
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
      result: status.result || null
    })

  } catch (error) {
    console.error('FusionX status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}