import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const status = {
      apis: {
        characters: {
          name: 'Character Generation (Z-AI)',
          configured: true,
          working: true,
          endpoint: '/api/characters/generate'
        },
        wan2: {
          name: 'Wan 2.2 Lightning',
          configured: false,
          working: false,
          endpoint: '/api/wan2/generate',
          deployment_id: process.env.FURIOUS_X_DEPLOYMENT_ID || process.env.NEW_DEPLOYMENT_ID || process.env.WAN22_DEPLOYMENT_ID || 'f3a34e84-7d00-4ee0-b3c8-3bb0c2318f1a'
        },
        framepack: {
          name: 'Framepack Video Stitching',
          configured: false,
          working: false,
          endpoint: '/api/comfyui/framepack',
          deployment_id: process.env.FRAMEPACK_DEPLOYMENT_ID || '70c87128-d68d-4a9a-a2a8-512637c84228',
          capability: 'Stitch scenes and images into up to 60-second videos'
        },
        style_transfer: {
          name: 'Video Style Transfer',
          configured: false,
          working: false,
          endpoint: '/api/style-transfer',
          deployment_id: process.env.STYLE_TRANSFER_DEPLOYMENT_ID || 'af4087d5-1813-453e-bdf6-8accda9474d6',
          capability: 'Change whole video style based on reference image or prompt'
        },
        storyboard: {
          name: 'Storyboard Management',
          configured: true,
          working: true,
          endpoint: '/api/storyboard'
        }
      },
      environment: {
        runcomfy_api_key: !!process.env.RUNCOMFY_API_KEY && process.env.RUNCOMFY_API_KEY !== 'your_runcomfy_api_key_here',
        zai_api_key: !!process.env.ZAI_API_KEY && process.env.ZAI_API_KEY !== 'your_zai_api_key_here',
        comfyui_base_url: process.env.COMFYUI_BASE_URL || 'https://api.runcomfy.net/prod/v1'
      },
      setup_needed: []
    }

    // Check which APIs need setup
    if (!status.environment.runcomfy_api_key) {
      status.setup_needed.push('RUNCOMFY_API_KEY - Required for Wan 2.2, Framepack, and Style Transfer')
    }

    // Update API status based on environment
    status.apis.wan2.configured = status.environment.runcomfy_api_key
    status.apis.framepack.configured = status.environment.runcomfy_api_key
    status.apis.style_transfer.configured = status.environment.runcomfy_api_key

    return NextResponse.json({
      success: true,
      status,
      message: status.setup_needed.length > 0 
        ? 'Some APIs need configuration' 
        : 'All APIs are properly configured'
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check API status',
        details: error.message 
      },
      { status: 500 }
    )
  }
}