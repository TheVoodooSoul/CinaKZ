import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { video_url, reference_style, style_prompt, overrides = {} } = await request.json()
    
    // Validate required fields
    if (!video_url) {
      return NextResponse.json(
        { error: 'Video URL is required for style transfer' },
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
    const deploymentId = process.env.STYLE_TRANSFER_DEPLOYMENT_ID || 'af4087d5-1813-453e-bdf6-8accda9474d6'
    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
    const apiUrl = `${baseUrl}/deployments/${deploymentId}/inference`

    console.log('Calling Style Transfer API:', apiUrl)

    // Prepare the request payload for style transfer workflow
    const payload = {
      overrides: {
        // Video input
        input_video: video_url,
        // Style reference (either URL or prompt)
        reference_style: reference_style,
        style_prompt: style_prompt || 'cinematic, dramatic lighting, professional color grading',
        // Style transfer specific parameters
        style_intensity: overrides.style_intensity || 0.8,
        preserve_motion: overrides.preserve_motion !== false,
        color_palette: overrides.color_palette || 'enhanced',
        lighting_style: overrides.lighting_style || 'dramatic',
        texture_detail: overrides.texture_detail || 'high',
        // Output settings
        output_resolution: overrides.output_resolution || '1920x1080',
        quality: overrides.quality || 'high',
        // Advanced style transfer options
        temporal_consistency: overrides.temporal_consistency !== false,
        edge_preservation: overrides.edge_preservation !== false,
        skin_tone_preservation: overrides.skin_tone_preservation !== false,
        // Additional creative controls
        artistic_effects: overrides.artistic_effects || {},
        color_grading: overrides.color_grading || 'cinematic'
      }
    }

    console.log('Style transfer payload:', JSON.stringify({
      ...payload,
      video_url: video_url,
      has_reference: !!reference_style,
      style_prompt: style_prompt
    }, null, 2))

    // Make request to Style Transfer API
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
      console.error('Style Transfer API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Failed to perform style transfer', details: errorData },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Style Transfer API response:', result)
    
    // Return the result with job ID for tracking
    return NextResponse.json({
      success: true,
      job_id: result.id || result.job_id || `style-transfer-${Date.now()}`,
      message: 'Video style transfer started successfully',
      deployment_id: deploymentId,
      capabilities: 'Changes whole video style based on reference image or prompt',
      estimated_duration: '2-5 minutes depending on video length'
    })

  } catch (error) {
    console.error('Style Transfer API error:', error)
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

    const deploymentId = process.env.STYLE_TRANSFER_DEPLOYMENT_ID || 'af4087d5-1813-453e-bdf6-8accda9474d6'
    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
    
    // Check job status - try multiple possible endpoint patterns
    const possibleEndpoints = [
      `${baseUrl}/jobs/${jobId}`,
      `${baseUrl}/deployments/${deploymentId}/jobs/${jobId}`,
      `${baseUrl}/deployments/af4087d5-1813-453e-bdf6-8accda9474d6/jobs/${jobId}`
    ]

    let result = null
    let workingEndpoint = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Trying Style Transfer endpoint:', endpoint)
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
        console.log('Style Transfer endpoint failed:', endpoint, error.message)
        continue
      }
    }

    if (!result) {
      throw new Error('Unable to fetch Style Transfer job status from any endpoint')
    }

    console.log('Style Transfer job status response:', result)
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: result.status || 'processing',
      progress: result.progress || 0,
      result: result.result || null,
      style_applied: result.style_applied || false,
      reference_used: result.reference_used || null,
      endpoint: workingEndpoint
    })

  } catch (error) {
    console.error('Style Transfer status check error:', error)
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