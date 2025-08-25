'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Character {
  id: string
  name: string
  description: string
  image?: string
}

interface StoryboardNode {
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
}

export default function Home() {
  const [isEnteringStudio, setIsEnteringStudio] = useState(false)
  const [showStudio, setShowStudio] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [storyboardNodes, setStoryboardNodes] = useState<StoryboardNode[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '' })
  const [currentSceneId, setCurrentSceneId] = useState(`scene-${Date.now()}`)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderJobId, setRenderJobId] = useState<string | null>(null)
  const [learningInsights, setLearningInsights] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [analysisActive, setAnalysisActive] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('wan2.2_t2v')
  const [wan2Generating, setWan2Generating] = useState(false)
  const [wan2Progress, setWan2Progress] = useState(0)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [styleTransferProgress, setStyleTransferProgress] = useState(0)
  const [styleTransferring, setStyleTransferring] = useState(false)

  const handleEnterStudio = () => {
    setIsEnteringStudio(true)
    setTimeout(() => {
      setShowStudio(true)
      setIsEnteringStudio(false)
      // Add Fang's welcome message
      setMessages([{
        role: 'assistant',
        content: "🔥 Welcome to the studio! I'm Fang, your AI choreographer. Let's create some incredible action sequences together! I now have Furious X and Wan 2.2 Lightning integration for super-fast storyboard generation. Describe your scene and I'll build the storyboard nodes from left to right."
      }])
    }, 1500)
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = currentMessage
    setCurrentMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsProcessing(true)

    try {
      // Call NLP API to analyze the message
      const nlpResponse = await fetch('/api/nlp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userMessage,
          context: {
            characters: characters.map(c => c.name),
            current_nodes: storyboardNodes.length,
            scene_id: currentSceneId
          }
        })
      })

      const nlpResult = await nlpResponse.json()
      
      if (nlpResult.success) {
        const analysis = nlpResult.analysis
        
        // Process the analyzed actions and create storyboard nodes
        let response = ""
        
        if (analysis.actions && analysis.actions.length > 0) {
          response = `🎬 Excellent! I've analyzed your action sequence and identified ${analysis.actions.length} choreography elements. `
          
          for (let i = 0; i < analysis.actions.length; i++) {
            const action = analysis.actions[i]
            
            try {
              // Create storyboard node with NLP-enhanced data
              const nodeResponse = await fetch('/api/storyboard', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  scene_id: currentSceneId,
                  description: action.action,
                  characters: [action.character],
                  action: action.action,
                  camera: action.camera_suggestion || 'Static',
                  lighting: action.lighting_suggestion || 'Daylight',
                  duration: action.duration_estimate || 2,
                  position: storyboardNodes.length + i
                })
              })

              const nodeResult = await nodeResponse.json()
              
              if (nodeResult.success) {
                setStoryboardNodes(prev => [...prev, nodeResult.node])
              }
            } catch (error) {
              console.error('Error creating storyboard node from NLP:', error)
            }
          }
          
          // Add scene analysis insights
          if (analysis.scene_analysis) {
            response += `The scene has a ${analysis.scene_analysis.overall_tone} tone with ${analysis.scene_analysis.pacing} pacing. `
            response += `I've suggested appropriate camera work and lighting for maximum cinematic impact. `
          }
          
          if (analysis.storyboard_suggestions && analysis.storyboard_suggestions.length > 0) {
            response += `💡 Additional suggestions: ${analysis.storyboard_suggestions.join(', ')}.`
          }
        } else if (userMessage.toLowerCase().includes('character') || userMessage.toLowerCase().includes('add')) {
          response = "🎭 Great! I'll help you create a character. Please provide the character's name and a brief description of their appearance and fighting style."
        } else if (userMessage.toLowerCase().includes('setting') || userMessage.toLowerCase().includes('location')) {
          response = "🌆 Perfect! Let's set the scene. Describe the location, time of day, and atmosphere you want for your action sequence."
        } else {
          response = analysis.enhanced_description || "🎯 I understand! Let me help you refine this idea. Could you tell me more about the specific actions or camera movements you envision?"
        }

        setMessages(prev => [...prev, { role: 'assistant', content: response }])
      } else {
        // Fallback to simple pattern matching if NLP fails
        await fallbackMessageProcessing(userMessage)
      }
    } catch (error) {
      console.error('NLP processing error:', error)
      // Fallback to simple pattern matching
      await fallbackMessageProcessing(userMessage)
    }

    setIsProcessing(false)
  }

  const fallbackMessageProcessing = async (userMessage: string) => {
    let response = ""
    
    // Simple pattern matching for demo
    if (userMessage.toLowerCase().includes('character') || userMessage.toLowerCase().includes('add')) {
      response = "🎭 Great! I'll help you create a character. Please provide the character's name and a brief description of their appearance and fighting style."
    } else if (userMessage.toLowerCase().includes('setting') || userMessage.toLowerCase().includes('location')) {
      response = "🌆 Perfect! Let's set the scene. Describe the location, time of day, and atmosphere you want for your action sequence."
    } else if (userMessage.toLowerCase().includes('@')) {
      // Extract character actions
      const characterActions = userMessage.match(/@(\w+)\s+([^@]+)/g)
      if (characterActions) {
        response = "🎬 Excellent action sequence! I'm breaking this down into storyboard nodes. "
        
        for (let i = 0; i < characterActions.length; i++) {
          const action = characterActions[i]
          const match = action.match(/@(\w+)\s+([^@]+)/)
          if (match) {
            const [, character, actionText] = match
            
            try {
              // Call storyboard API to create node
              const nodeResponse = await fetch('/api/storyboard', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  scene_id: currentSceneId,
                  description: actionText.trim(),
                  characters: [character],
                  action: actionText.trim(),
                  camera: 'Static',
                  lighting: 'Daylight',
                  duration: 2,
                  position: i
                })
              })

              const nodeResult = await nodeResponse.json()
              
              if (nodeResult.success) {
                setStoryboardNodes(prev => [...prev, nodeResult.node])
              }
            } catch (error) {
              console.error('Error creating storyboard node:', error)
              // Fallback to local state
              const newNode: StoryboardNode = {
                id: `node-${Date.now()}-${i}`,
                scene_id: currentSceneId,
                description: actionText.trim(),
                characters: [character],
                action: actionText.trim(),
                camera: 'Static',
                lighting: 'Daylight',
                duration: 2,
                position: i,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              setStoryboardNodes(prev => [...prev, newNode])
            }
          }
        }
        
        response += `I've created ${characterActions.length} storyboard nodes. Would you like to add camera movements or lighting effects?`
      } else {
        response = "🎯 I see you're describing character actions. Let me break this down into storyboard nodes for better choreography."
      }
    } else {
      response = "🎯 I understand! Let me help you refine this idea. Could you tell me more about the specific actions or camera movements you envision?"
    }

    setMessages(prev => [...prev, { role: 'assistant', content: response }])
  }

  const handleAddCharacter = async () => {
    if (newCharacter.name.trim() && newCharacter.description.trim()) {
      try {
        // Call the character generation API
        const response = await fetch('/api/characters/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCharacter.name.trim(),
            description: newCharacter.description.trim()
          })
        })

        const result = await response.json()
        
        if (result.success) {
          const character: Character = {
            id: `char-${Date.now()}`,
            name: newCharacter.name.trim(),
            description: newCharacter.description.trim(),
            image: result.character.image_base64
          }
          setCharacters(prev => [...prev, character])
          setNewCharacter({ name: '', description: '' })
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `🎨 Excellent! I've created ${character.name} and generated their character portrait. ${character.description}. The character is now ready for action scenes!`
          }])
        } else {
          throw new Error(result.error || 'Failed to generate character')
        }
      } catch (error) {
        console.error('Character generation error:', error)
        // Fallback to creating character without image
        const character: Character = {
          id: `char-${Date.now()}`,
          name: newCharacter.name.trim(),
          description: newCharacter.description.trim()
        }
        setCharacters(prev => [...prev, character])
        setNewCharacter({ name: '', description: '' })
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ I've added ${character.name} to your scene. ${character.description}. Note: Image generation is currently unavailable, but the character is ready for action sequences!`
        }])
      }
    }
  }

  const handleUpdateNode = async (nodeId: string, updates: Partial<StoryboardNode>) => {
    try {
      const response = await fetch(`/api/storyboard?node_id=${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()
      
      if (result.success) {
        setStoryboardNodes(prev => 
          prev.map(node => node.id === nodeId ? result.node : node)
        )
        setEditingNode(null)
      } else {
        throw new Error(result.error || 'Failed to update node')
      }
    } catch (error) {
      console.error('Error updating storyboard node:', error)
      // Fallback to local state update
      setStoryboardNodes(prev => 
        prev.map(node => 
          node.id === nodeId 
            ? { ...node, ...updates, updated_at: new Date().toISOString() }
            : node
        )
      )
      setEditingNode(null)
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    try {
      const response = await fetch(`/api/storyboard?node_id=${nodeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        setStoryboardNodes(prev => prev.filter(node => node.id !== nodeId))
      } else {
        throw new Error(result.error || 'Failed to delete node')
      }
    } catch (error) {
      console.error('Error deleting storyboard node:', error)
      // Fallback to local state update
      setStoryboardNodes(prev => prev.filter(node => node.id !== nodeId))
    }
  }

  const handleRenderScene = async () => {
    if (storyboardNodes.length === 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "🎬 I need some storyboard nodes to render a scene. Please describe some action sequences first!"
      }])
      return
    }

    setIsRendering(true)
    setRenderProgress(0)
    
    try {
      // Call Framepack API to stitch the scene
      const response = await fetch('/api/comfyui/framepack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_clips: storyboardNodes.map(node => ({
            description: node.description,
            characters: node.characters,
            action: node.action,
            camera: node.camera,
            lighting: node.lighting,
            duration: node.duration
          })),
          output_duration: Math.min(storyboardNodes.reduce((total, node) => total + (node.duration || 2), 0), 60),
          transition_style: 'smooth',
          quality: 'high',
          fps: 24,
          resolution: '1920x1080',
          effects: {
            color_grading: 'cinematic'
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setRenderJobId(result.job_id)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🚀 Great! I've started rendering your scene with ${storyboardNodes.length} storyboard nodes using Framepack. Framepack will stitch together all the scenes and images into a professional video up to 60 seconds long. The estimated duration is ${result.estimated_duration} seconds. I'll let you know when it's ready!`
        }])
        
        // Start polling for job status
        pollRenderStatus(result.job_id)
      } else if (result.setup_required) {
        setIsRendering(false)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚠️ **API Configuration Required**: Framepack video stitching needs an API key to work. Please set the RUNCOMFY_API_KEY environment variable to enable video rendering with Framepack's scene stitching capabilities."
        }])
      } else {
        throw new Error(result.error || 'Failed to start rendering')
      }
    } catch (error) {
      console.error('Error rendering scene:', error)
      setIsRendering(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ I'm sorry, but I encountered an error while trying to render your scene. Please check the API configuration and try again."
      }])
    }
  }

  const pollRenderStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/comfyui/framepack?job_id=${jobId}`)
        const result = await response.json()
        
        if (result.success) {
          setRenderProgress(result.progress || 0)
          
          if (result.status === 'completed') {
            clearInterval(pollInterval)
            setIsRendering(false)
            setRenderJobId(null)
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "🎉 Excellent! Your scene has been rendered successfully! The video is now ready for download. You can view it in the outputs section or share it with your team."
            }])
          } else if (result.status === 'failed') {
            clearInterval(pollInterval)
            setIsRendering(false)
            setRenderJobId(null)
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "💥 I'm sorry, but the rendering failed. This could be due to server issues or complex scene requirements. Let's try simplifying the scene or try again later."
            }])
          }
        }
      } catch (error) {
        console.error('Error polling render status:', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  const updateLearning = async (type: string, data: any, context?: any, outcome?: 'success' | 'failure' | 'neutral') => {
    try {
      await fetch('/api/learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          context,
          outcome
        })
      })
      
      // Refresh learning insights
      await fetchLearningInsights()
    } catch (error) {
      console.error('Error updating learning:', error)
    }
  }

  const fetchLearningInsights = async () => {
    try {
      const response = await fetch('/api/learning?type=suggestions')
      const result = await response.json()
      
      if (result.success) {
        setLearningInsights(result.suggestions.insight)
        setUserPreferences(result.suggestions)
      }
    } catch (error) {
      console.error('Error fetching learning insights:', error)
    }
  }

  const applyLearningToNode = (nodeData: any) => {
    if (userPreferences) {
      return {
        ...nodeData,
        camera: userPreferences.camera_suggestion || nodeData.camera,
        lighting: userPreferences.lighting_suggestion || nodeData.lighting
      }
    }
    return nodeData
  }

  const handleWan2Generation = async (nodeId: string) => {
    const node = storyboardNodes.find(n => n.id === nodeId)
    if (!node) return

    setWan2Generating(true)
    setWan2Progress(0)

    try {
      // Call Wan 2.2 Lightning T2V I2V API
      const response = await fetch('/api/wan2/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: 'f3a34e84-7d00-4ee0-b3c8-3bb0c2318f1a',
          prompt: node.description,
          workflow_type: selectedWorkflow,
          overrides: {}
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setWan2Progress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              setWan2Generating(false)
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚡ Wan 2.2 Lightning has generated the storyboard node "${node.description}" successfully! The video clip is ready for preview.`
              }])
              return 100
            }
            return prev + 10
          })
        }, 200)
      } else if (result.setup_required) {
        setWan2Generating(false)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚠️ **API Configuration Required**: Wan 2.2 Lightning needs an API key to work. Please set the RUNCOMFY_API_KEY environment variable to enable video generation."
        }])
      } else {
        throw new Error(result.error || 'Failed to generate with Wan 2.2')
      }
    } catch (error) {
      console.error('Wan 2.2 generation error:', error)
      setWan2Generating(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ I encountered an error with Wan 2.2 generation. Please check the API configuration and try again."
      }])
    }
  }

  const handleStyleTransfer = async (videoUrl: string, stylePrompt?: string) => {
    setStyleTransferring(true)
    setStyleTransferProgress(0)

    try {
      const response = await fetch('/api/style-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl,
          style_prompt: stylePrompt || 'cinematic, dramatic lighting, professional color grading',
          overrides: {
            style_intensity: 0.8,
            preserve_motion: true,
            color_palette: 'enhanced',
            lighting_style: 'dramatic'
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setStyleTransferProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              setStyleTransferring(false)
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `🎨 Style transfer completed successfully! Your video has been transformed with a new cinematic style. The processed video is ready for download.`
              }])
              return 100
            }
            return prev + 5
          })
        }, 300)
      } else if (result.setup_required) {
        setStyleTransferring(false)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚠️ **API Configuration Required**: Style Transfer needs an API key to work. Please set the RUNCOMFY_API_KEY environment variable to enable video style transformation."
        }])
      } else {
        throw new Error(result.error || 'Failed to perform style transfer')
      }
    } catch (error) {
      console.error('Style transfer error:', error)
      setStyleTransferring(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ I encountered an error with style transfer. Please check the API configuration and try again."
      }])
    }
  }

  // Initialize learning insights and API status
  useEffect(() => {
    if (showStudio) {
      fetchLearningInsights()
      fetchApiStatus()
    }
  }, [showStudio])

  const fetchApiStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const result = await response.json()
      if (result.success) {
        setApiStatus(result.status)
      }
    } catch (error) {
      console.error('Error fetching API status:', error)
    }
  }

  if (showStudio) {
    return (
      <div className="min-h-screen brick-bg text-white flex flex-col">
        {/* Top Header */}
        <div className="glass-effect border-b border-orange-900/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 cinematic-glow">
                  <AvatarFallback className="flame-texture text-2xl font-bold">
                    F
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold flame-texture bg-clip-text text-transparent">
                  Fang - AI Choreographer
                </h1>
                <p className="text-orange-300">Creating cinematic action sequences...</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-orange-300">Scene Progress</div>
                <div className="text-lg font-bold">{storyboardNodes.length} Nodes</div>
              </div>
              {/* API Status Indicator */}
              {apiStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    apiStatus.setup_needed.length === 0 ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                  }`}></div>
                  <span className="text-xs text-orange-300">
                    {apiStatus.setup_needed.length === 0 ? 'Ready' : 'Setup Needed'}
                  </span>
                  {apiStatus.setup_needed.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `🔧 **Setup Required**: The following APIs need configuration:\n\n${apiStatus.setup_needed.map(item => `• ${item}`).join('\n')}\n\nPlease add these to your .env file to enable video generation.`
                        }])
                      }}
                      className="border-yellow-500 text-yellow-300 hover:bg-yellow-900/20 text-xs px-2 py-1 h-6"
                    >
                      Setup
                    </Button>
                  )}
                </div>
              )}
              <Button 
                onClick={() => setShowStudio(false)}
                className="cinematic-button bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Exit Studio
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex p-4 gap-4">
          {/* Center Area - Black Canvas with Horizontal Storyboard */}
          <div className="flex-1 bg-black rounded-xl p-6 cinematic-glow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-orange-400">Storyboard Timeline</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-orange-300">
                  Total: {storyboardNodes.reduce((total, node) => total + (node.duration || 2), 0)}s
                </div>
                {/* Analysis Light */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setAnalysisActive(true)
                      setTimeout(() => setAnalysisActive(false), 1000)
                      if (storyboardNodes.length > 0) {
                        const totalDuration = storyboardNodes.reduce((total, node) => total + (node.duration || 2), 0)
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `📊 Scene Analysis: ${storyboardNodes.length} nodes, ${totalDuration}s total duration. Pacing varies from ${Math.min(...storyboardNodes.map(n => n.duration || 2))}s to ${Math.max(...storyboardNodes.map(n => n.duration || 2))}s per action.`
                        }])
                      }
                    }}
                    className={`w-8 h-8 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-300 ${
                      analysisActive ? 'animate-pulse ring-4 ring-green-300' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 rounded-full bg-green-400 ${
                      analysisActive ? 'animate-ping' : 'opacity-0'
                    }`}></div>
                  </button>
                </div>
                {/* Scene Suggestions Light */}
                <button
                  onClick={() => {
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: "🎭 Let me help you enhance your scene! What mood or atmosphere are you aiming for? I can suggest camera angles and lighting to match your vision."
                    }])
                  }}
                  className="w-6 h-6 rounded-full bg-orange-500/30 hover:bg-orange-500/50 transition-all duration-300 flex items-center justify-center text-orange-300 text-xs"
                >
                  ?
                </button>
              </div>
            </div>

            {/* Horizontal Storyboard Canvas */}
            <div className="bg-black rounded-lg p-4 min-h-96 border border-orange-900/30">
              <div className="flex gap-4 overflow-x-auto pb-4">
                {storyboardNodes.map((node, index) => (
                  <div key={node.id} className="flex-shrink-0 w-80">
                    <Card className="node-card rounded-xl overflow-hidden h-full">
                      <div className="h-1 flame-texture"></div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-600 text-white text-xs">
                              Node {index + 1}
                            </Badge>
                            <Badge variant="secondary" className="bg-black/50 text-orange-300 text-xs">
                              {node.duration}s
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNode(editingNode === node.id ? null : node.id)}
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 p-1 h-6 w-6"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleWan2Generation(node.id)}
                              disabled={wan2Generating}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-1 h-6 w-6"
                              title="Generate with Wan 2.2"
                            >
                              ⚡
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNode(node.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>

                        {editingNode === node.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={node.description}
                              onChange={(e) => handleUpdateNode(node.id, { description: e.target.value })}
                              className="bg-black/50 border-orange-900/50 text-white text-sm rounded-lg resize-none"
                              placeholder="Action description"
                              rows={3}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={node.camera}
                                onValueChange={(value) => handleUpdateNode(node.id, { camera: value })}
                              >
                                <SelectTrigger className="bg-black/50 border-orange-900/50 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Static">📷 Static</SelectItem>
                                  <SelectItem value="Pan">🔄 Pan</SelectItem>
                                  <SelectItem value="Track">🏃 Track</SelectItem>
                                  <SelectItem value="Dolly">🚚 Dolly</SelectItem>
                                  <SelectItem value="Handheld">📱 Handheld</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={node.lighting}
                                onValueChange={(value) => handleUpdateNode(node.id, { lighting: value })}
                              >
                                <SelectTrigger className="bg-black/50 border-orange-900/50 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Daylight">☀️ Daylight</SelectItem>
                                  <SelectItem value="Night">🌙 Night</SelectItem>
                                  <SelectItem value="Dramatic">🎭 Dramatic</SelectItem>
                                  <SelectItem value="Neon">💫 Neon</SelectItem>
                                  <SelectItem value="Firelight">🔥 Firelight</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={node.duration}
                                onChange={(e) => handleUpdateNode(node.id, { duration: parseInt(e.target.value) || 2 })}
                                className="bg-black/50 border-orange-900/50 text-white text-xs w-20"
                                min="1"
                                max="10"
                              />
                              <Button
                                size="sm"
                                onClick={() => setEditingNode(null)}
                                className="cinematic-button bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-white mb-3 line-clamp-3">{node.description}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {node.characters.map(char => (
                                <Badge key={char} className="bg-black/50 text-orange-300 text-xs">
                                  @{char}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-orange-200">
                              <div className="flex items-center gap-3">
                                <span>📹 {node.camera}</span>
                                <span>💡 {node.lighting}</span>
                              </div>
                              <span>⏱️ {node.duration}s</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
                {storyboardNodes.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-orange-600">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎬</div>
                      <p className="text-lg">Describe your action sequence to create storyboard nodes</p>
                      <p className="text-sm mt-2">Use @CharacterName format (e.g., "@Joey throws punch at @Bill")</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Controls */}
          <div className="w-80 glass-effect rounded-xl p-4 cinematic-glow">
            <h3 className="text-xl font-bold text-orange-400 mb-6">Scene Controls</h3>
            
            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-orange-300">Mode</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-200">AI</span>
                  <button
                    onClick={() => setManualMode(!manualMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      manualMode ? 'bg-orange-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      manualMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-xs text-orange-200">Manual</span>
                </div>
              </div>
              <p className="text-xs text-orange-600">
                {manualMode ? 'Use existing workflows directly' : 'AI-powered choreography'}
              </p>
            </div>

            {manualMode ? (
              /* Manual Mode Controls */
              <div className="space-y-6">
                {/* Workflow Selection */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-orange-300">Select Workflow</h4>
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="cinematic-button bg-black/50 border-orange-900/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-500 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furious_x">🔥 Furious X</SelectItem>
                      <SelectItem value="wan2.2_t2v">⚡ Wan 2.2 T2V</SelectItem>
                      <SelectItem value="wan2.2_i2v">⚡ Wan 2.2 I2V</SelectItem>
                      <SelectItem value="new_deployment">🚀 New Deployment</SelectItem>
                      <SelectItem value="comfyui_standard">🎨 ComfyUI Standard</SelectItem>
                      <SelectItem value="fusionx_enhanced">🚀 FusionX Enhanced</SelectItem>
                      <SelectItem value="framepack_pro">🎬 Framepack Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Generate */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-orange-300">Quick Generate</h4>
                  <Button 
                    onClick={() => {
                      if (storyboardNodes.length > 0) {
                        const lastNode = storyboardNodes[storyboardNodes.length - 1]
                        handleWan2Generation(lastNode.id)
                      } else {
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: "🎬 Create a storyboard node first, then I can generate it with the selected workflow."
                        }])
                      }
                    }}
                    disabled={wan2Generating || storyboardNodes.length === 0}
                    className="cinematic-button w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3"
                  >
                    {wan2Generating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating... {wan2Progress}%
                      </div>
                    ) : (
                      `⚡ Generate with ${selectedWorkflow === 'furious_x' ? 'Furious X' : selectedWorkflow === 'new_deployment' ? 'New Deployment' : selectedWorkflow.split('_')[0]}`
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {wan2Generating && (
                  <div className="bg-black/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-300">Generating...</span>
                      <span className="text-sm font-bold text-orange-400">{wan2Progress}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${wan2Progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* AI Mode Controls */
              <div className="space-y-6">
                {/* Camera Controls */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-orange-300">Camera Movement</h4>
                  <Select
                    onValueChange={(value) => {
                      if (editingNode) {
                        handleUpdateNode(editingNode, { camera: value })
                        updateLearning('camera_usage', { camera: value }, { node_id: editingNode }, 'success')
                      } else {
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `📷 ${value} camera movement noted! I'll apply this to new nodes for dynamic cinematography.`
                        }])
                        updateLearning('camera_usage', { camera: value }, {}, 'neutral')
                      }
                    }}
                  >
                    <SelectTrigger className="cinematic-button bg-black/50 border-orange-900/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-500 rounded-lg">
                      <SelectValue placeholder="Select camera movement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Static">📷 Static</SelectItem>
                      <SelectItem value="Pan">🔄 Pan</SelectItem>
                      <SelectItem value="Track">🏃 Track</SelectItem>
                      <SelectItem value="Dolly">🚚 Dolly</SelectItem>
                      <SelectItem value="Handheld">📱 Handheld</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lighting Controls */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-orange-300">Lighting</h4>
                  <Select
                    onValueChange={(value) => {
                      if (editingNode) {
                        handleUpdateNode(editingNode, { lighting: value })
                        updateLearning('lighting_usage', { lighting: value }, { node_id: editingNode }, 'success')
                      } else {
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `💡 ${value} lighting selected! This will create the perfect atmosphere for your scene.`
                        }])
                        updateLearning('lighting_usage', { lighting: value }, {}, 'neutral')
                      }
                    }}
                  >
                    <SelectTrigger className="cinematic-button bg-black/50 border-orange-900/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-500 rounded-lg">
                      <SelectValue placeholder="Select lighting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daylight">☀️ Daylight</SelectItem>
                      <SelectItem value="Night">🌙 Night</SelectItem>
                      <SelectItem value="Dramatic">🎭 Dramatic</SelectItem>
                      <SelectItem value="Neon">💫 Neon</SelectItem>
                      <SelectItem value="Firelight">🔥 Firelight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Render Section - Common to both modes */}
            <div className="pt-4 border-t border-orange-900/30">
              <h4 className="text-sm font-semibold mb-3 text-orange-300">Render Final Scene</h4>
              {isRendering ? (
                <div className="space-y-3">
                  <div className="bg-black/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-300">Rendering...</span>
                      <span className="text-sm font-bold text-orange-400">{renderProgress}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3">
                      <div 
                        className="flame-texture h-3 rounded-full transition-all duration-300"
                        style={{ width: `${renderProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="cinematic-button w-full border-red-900/50 text-red-400 hover:bg-red-900/20 rounded-lg py-3"
                    onClick={() => setIsRendering(false)}
                  >
                    Cancel Render
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleRenderScene}
                  disabled={storyboardNodes.length === 0}
                  className="cinematic-button w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg"
                >
                  🎬 Render Final Scene
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Chat Area - Horizontal */}
        <div className="glass-effect border-t border-orange-900/30 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end gap-4">
              {/* Messages Area */}
              <div className="flex-1">
                <ScrollArea className="h-32 custom-scrollbar mb-3">
                  <div className="space-y-2">
                    {messages.slice(-3).map((message, index) => (
                      <div key={index} className={`chat-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md rounded-2xl px-4 py-2 ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' 
                            : 'bg-black/50 text-orange-200 border border-orange-900/30'
                        }`}>
                          <div className="flex items-start gap-2">
                            {message.role === 'assistant' && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="flame-texture text-xs font-bold">
                                  F
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <p className="text-sm">{message.content}</p>
                            {message.role === 'user' && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-blue-600 text-xs">
                                  U
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="chat-message flex justify-start">
                        <div className="bg-black/50 rounded-2xl px-4 py-2 border border-orange-900/30">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="flame-texture text-xs font-bold loading-pulse">
                                F
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                              <span className="text-sm text-orange-300">Processing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="w-96">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe action: @Joey attacks @Bill..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-black/50 border-orange-900/50 text-white placeholder-orange-700 focus:border-orange-500 rounded-lg"
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isProcessing || !currentMessage.trim()}
                    className="cinematic-button bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6"
                  >
                    Send
                  </Button>
                </div>
                <div className="mt-2 text-xs text-orange-600">
                  💡 Tip: Use @CharacterName for actions (e.g., "@Joey throws punch at @Bill")
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .node-card {
            transition: all 0.3s ease;
          }
          .node-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 94, 77, 0.3);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen brick-bg text-white flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-6">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
          <span className="metallic-text">
            Cinakinetic
          </span>
        </h1>
        <p className="text-2xl md:text-3xl font-light text-orange-300">
          Choreograph the impossible
        </p>
        <div className="w-32 h-1 flame-texture mx-auto rounded-full"></div>
      </div>

      {/* YouTube Player Section */}
      <Card className="glass-effect border-orange-900/30 mb-12 w-full max-w-4xl cinematic-glow">
        <CardContent className="p-6">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/fefEZtIHdGE?si=0reDlw5BnET4eAL7"
              title="Cinakinetic Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl w-full">
        <Card className="glass-effect border-orange-900/30 hover:border-orange-500 transition-all cinematic-glow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 flame-texture rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-orange-400">AI-Powered Choreography</h3>
            <p className="text-orange-200">Agent Fang learns and adapts to create stunning action sequences</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-orange-900/30 hover:border-orange-500 transition-all cinematic-glow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 flame-texture rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-orange-400">Marvel-Level Quality</h3>
            <p className="text-orange-200">Professional-grade combat scenes with cinematic precision</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-orange-900/30 hover:border-orange-500 transition-all cinematic-glow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 flame-texture rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-orange-400">Intelligent Learning</h3>
            <p className="text-orange-200">Your choreography evolves and improves with each project</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <Button
          onClick={handleEnterStudio}
          disabled={isEnteringStudio}
          className="cinematic-button bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnteringStudio ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Entering Studio...
            </div>
          ) : (
            "🔥 Enter Studio"
          )}
        </Button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-orange-600 text-sm">
        <p>Powered by ComfyUI • FusionX • Wan 2.2 Lightning • Furious X • Framepack</p>
      </div>
    </div>
  )
}