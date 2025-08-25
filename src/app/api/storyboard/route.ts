import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for storyboard nodes (in production, use a database)
let storyboardNodes: Array<{
  id: string
  scene_id: string
  description: string
  characters: string[]
  action: string
  camera?: string
  lighting?: string
  duration?: number
  position: number
  created_at: string
  updated_at: string
}> = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sceneId = searchParams.get('scene_id')

    if (sceneId) {
      // Get nodes for specific scene
      const nodes = storyboardNodes
        .filter(node => node.scene_id === sceneId)
        .sort((a, b) => a.position - b.position)
      
      return NextResponse.json({
        success: true,
        nodes: nodes
      })
    }

    // Get all nodes
    return NextResponse.json({
      success: true,
      nodes: storyboardNodes.sort((a, b) => a.position - b.position)
    })

  } catch (error) {
    console.error('Storyboard GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.scene_id || !body.description || !body.characters || !body.action) {
      return NextResponse.json(
        { error: 'scene_id, description, characters, and action are required' },
        { status: 400 }
      )
    }

    // Create new storyboard node
    const newNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scene_id: body.scene_id,
      description: body.description,
      characters: Array.isArray(body.characters) ? body.characters : [body.characters],
      action: body.action,
      camera: body.camera || 'Static',
      lighting: body.lighting || 'Daylight',
      duration: body.duration || 2,
      position: body.position || (storyboardNodes.filter(n => n.scene_id === body.scene_id).length),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    storyboardNodes.push(newNode)
    
    return NextResponse.json({
      success: true,
      node: newNode,
      message: 'Storyboard node created successfully'
    })

  } catch (error) {
    console.error('Storyboard POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('node_id')

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      )
    }

    const nodeIndex = storyboardNodes.findIndex(node => node.id === nodeId)
    
    if (nodeIndex === -1) {
      return NextResponse.json(
        { error: 'Storyboard node not found' },
        { status: 404 }
      )
    }

    // Update node
    const updatedNode = {
      ...storyboardNodes[nodeIndex],
      description: body.description || storyboardNodes[nodeIndex].description,
      characters: body.characters || storyboardNodes[nodeIndex].characters,
      action: body.action || storyboardNodes[nodeIndex].action,
      camera: body.camera || storyboardNodes[nodeIndex].camera,
      lighting: body.lighting || storyboardNodes[nodeIndex].lighting,
      duration: body.duration || storyboardNodes[nodeIndex].duration,
      position: body.position !== undefined ? body.position : storyboardNodes[nodeIndex].position,
      updated_at: new Date().toISOString()
    }

    storyboardNodes[nodeIndex] = updatedNode
    
    return NextResponse.json({
      success: true,
      node: updatedNode,
      message: 'Storyboard node updated successfully'
    })

  } catch (error) {
    console.error('Storyboard PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('node_id')

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      )
    }

    const nodeIndex = storyboardNodes.findIndex(node => node.id === nodeId)
    
    if (nodeIndex === -1) {
      return NextResponse.json(
        { error: 'Storyboard node not found' },
        { status: 404 }
      )
    }

    storyboardNodes.splice(nodeIndex, 1)
    
    return NextResponse.json({
      success: true,
      message: 'Storyboard node deleted successfully'
    })

  } catch (error) {
    console.error('Storyboard DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}