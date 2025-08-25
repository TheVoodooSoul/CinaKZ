import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { deployment_id, prompt, workflow_type, overrides = {} } = await request.json()

    if (!deployment_id || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
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

    // Use provided deployment_id or fall back to environment variable
    const finalDeploymentId = deployment_id || process.env.FURIOUS_X_DEPLOYMENT_ID || process.env.NEW_DEPLOYMENT_ID || process.env.WAN22_DEPLOYMENT_ID
    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'

    // Call Wan 2.2 Lightning T2V I2V API
    const apiUrl = `${baseUrl}/deployments/${finalDeploymentId}/inference`
    console.log('Calling Wan 2.2 API:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        overrides: {
          ...overrides,
          prompt: prompt,
          workflow_type: workflow_type || 'wan2.2_t2v'
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Wan 2.2 API error:', response.status, errorData)
      throw new Error(`Wan 2.2 API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Wan 2.2 API response:', result)

    return NextResponse.json({
      success: true,
      job_id: result.id || result.job_id || `wan2-${Date.now()}`,
      deployment_id: finalDeploymentId,
      prompt,
      workflow_type,
      estimated_duration: Math.ceil(prompt.split(' ').length * 0.5), // Rough estimate based on word count
      message: 'Wan 2.2 generation started successfully'
    })

  } catch (error) {
    console.error('Wan 2.2 generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate with Wan 2.2',
        setup_required: error.message.includes('API key not configured')
      },
      { status: error.message.includes('API key not configured') ? 503 : 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const job_id = searchParams.get('job_id')

  if (!job_id) {
    return NextResponse.json(
      { success: false, error: 'Missing job_id parameter' },
      { status: 400 }
    )
  }

  try {
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

    const baseUrl = process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
    
    // Check Wan 2.2 job status - try multiple possible endpoint patterns
    const possibleEndpoints = [
      `${baseUrl}/jobs/${job_id}`,
      `${baseUrl}/deployments/${process.env.FURIOUS_X_DEPLOYMENT_ID || process.env.NEW_DEPLOYMENT_ID || process.env.WAN22_DEPLOYMENT_ID}/jobs/${job_id}`,
      `${baseUrl}/deployments/f3a34e84-7d00-4ee0-b3c8-3bb0c2318f1a/jobs/${job_id}`,
      `${baseUrl}/deployments/b6ba7a3e-83b8-4510-be35-8f63486c4e59/jobs/${job_id}`,
      `${baseUrl}/deployments/dcb2812e-64b2-46fe-85fd-30bad1a6090e/jobs/${job_id}`
    ]

    let result = null
    let workingEndpoint = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Trying endpoint:', endpoint)
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
        console.log('Endpoint failed:', endpoint, error.message)
        continue
      }
    }

    if (!result) {
      throw new Error('Unable to fetch job status from any endpoint')
    }

    console.log('Job status response:', result)

    return NextResponse.json({
      success: true,
      status: result.status || 'processing',
      progress: result.progress || 0,
      result: result.result || null,
      job_id,
      endpoint: workingEndpoint
    })

  } catch (error) {
    console.error('Error checking Wan 2.2 job status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check job status',
        setup_required: error.message.includes('API key not configured')
      },
      { status: error.message.includes('API key not configured') ? 503 : 500 }
    )
  }
}