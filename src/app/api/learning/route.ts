import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for learning data (in production, use a database)
let userPreferences: {
  user_id?: string
  camera_preferences: Record<string, number>
  lighting_preferences: Record<string, number>
  action_patterns: Array<{
    pattern: string
    success_count: number
    usage_count: number
    avg_duration: number
  }>
  scene_complexity_preference: 'simple' | 'medium' | 'complex'
  preferred_genres: string[]
  learning_history: Array<{
    timestamp: string
    action: string
    context: any
    outcome: 'success' | 'failure' | 'neutral'
  }>
} = {
  camera_preferences: {
    'Static': 1,
    'Pan': 1,
    'Track': 1,
    'Dolly': 1,
    'Handheld': 1
  },
  lighting_preferences: {
    'Daylight': 1,
    'Night': 1,
    'Dramatic': 1,
    'Neon': 1,
    'Firelight': 1
  },
  action_patterns: [],
  scene_complexity_preference: 'medium',
  preferred_genres: [],
  learning_history: []
}

interface LearningUpdate {
  type: 'camera_usage' | 'lighting_usage' | 'action_pattern' | 'scene_render' | 'user_feedback'
  data: any
  context?: any
  outcome?: 'success' | 'failure' | 'neutral'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, context, outcome } = body as LearningUpdate

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      )
    }

    // Update learning data based on type
    switch (type) {
      case 'camera_usage':
        if (data.camera && userPreferences.camera_preferences[data.camera] !== undefined) {
          userPreferences.camera_preferences[data.camera] += 1
        }
        break

      case 'lighting_usage':
        if (data.lighting && userPreferences.lighting_preferences[data.lighting] !== undefined) {
          userPreferences.lighting_preferences[data.lighting] += 1
        }
        break

      case 'action_pattern':
        const existingPattern = userPreferences.action_patterns.find(
          p => p.pattern === data.pattern
        )
        
        if (existingPattern) {
          existingPattern.usage_count += 1
          if (outcome === 'success') {
            existingPattern.success_count += 1
          }
          existingPattern.avg_duration = (existingPattern.avg_duration + (data.duration || 2)) / 2
        } else {
          userPreferences.action_patterns.push({
            pattern: data.pattern,
            success_count: outcome === 'success' ? 1 : 0,
            usage_count: 1,
            avg_duration: data.duration || 2
          })
        }
        break

      case 'scene_render':
        if (data.complexity) {
          userPreferences.scene_complexity_preference = data.complexity
        }
        if (data.genre && !userPreferences.preferred_genres.includes(data.genre)) {
          userPreferences.preferred_genres.push(data.genre)
        }
        break

      case 'user_feedback':
        // Learn from explicit user feedback
        if (data.preferred_camera) {
          userPreferences.camera_preferences[data.preferred_camera] += 2
        }
        if (data.preferred_lighting) {
          userPreferences.lighting_preferences[data.preferred_lighting] += 2
        }
        break
    }

    // Add to learning history
    userPreferences.learning_history.push({
      timestamp: new Date().toISOString(),
      action: type,
      context: context || data,
      outcome: outcome || 'neutral'
    })

    // Keep only last 1000 history entries
    if (userPreferences.learning_history.length > 1000) {
      userPreferences.learning_history = userPreferences.learning_history.slice(-1000)
    }

    return NextResponse.json({
      success: true,
      message: 'Learning data updated successfully',
      updated_preferences: {
        top_camera: getTopPreference(userPreferences.camera_preferences),
        top_lighting: getTopPreference(userPreferences.lighting_preferences),
        successful_patterns: userPreferences.action_patterns
          .filter(p => p.success_count / p.usage_count > 0.7)
          .map(p => p.pattern)
      }
    })

  } catch (error) {
    console.error('Learning update error:', error)
    return NextResponse.json(
      { error: 'Failed to update learning data', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestType = searchParams.get('type')

    if (requestType === 'suggestions') {
      // Generate suggestions based on learning data
      const suggestions = generateSuggestions()
      return NextResponse.json({
        success: true,
        suggestions
      })
    }

    if (requestType === 'preferences') {
      return NextResponse.json({
        success: true,
        preferences: {
          camera: userPreferences.camera_preferences,
          lighting: userPreferences.lighting_preferences,
          complexity: userPreferences.scene_complexity_preference,
          genres: userPreferences.preferred_genres,
          successful_patterns: userPreferences.action_patterns
            .filter(p => p.success_count / p.usage_count > 0.7)
            .sort((a, b) => b.success_count - a.success_count)
            .slice(0, 5)
        }
      })
    }

    // Return general learning stats
    return NextResponse.json({
      success: true,
      stats: {
        total_learning_events: userPreferences.learning_history.length,
        top_camera: getTopPreference(userPreferences.camera_preferences),
        top_lighting: getTopPreference(userPreferences.lighting_preferences),
        preferred_complexity: userPreferences.scene_complexity_preference,
        most_successful_pattern: userPreferences.action_patterns
          .reduce((best, current) => 
            current.success_count / current.usage_count > best.success_count / best.usage_count 
              ? current : best, 
            userPreferences.action_patterns[0] || { pattern: 'N/A' }
          ).pattern,
        learning_progress: calculateLearningProgress()
      }
    })

  } catch (error) {
    console.error('Learning GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve learning data', details: error.message },
      { status: 500 }
    )
  }
}

function getTopPreference(preferences: Record<string, number>): string {
  return Object.entries(preferences)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown'
}

function generateSuggestions() {
  const topCamera = getTopPreference(userPreferences.camera_preferences)
  const topLighting = getTopPreference(userPreferences.lighting_preferences)
  const successfulPatterns = userPreferences.action_patterns
    .filter(p => p.success_count / p.usage_count > 0.7)
    .sort((a, b) => b.success_count - a.success_count)

  return {
    camera_suggestion: topCamera,
    lighting_suggestion: topLighting,
    recommended_patterns: successfulPatterns.slice(0, 3).map(p => p.pattern),
    complexity_suggestion: userPreferences.scene_complexity_preference,
    insight: generateInsight()
  }
}

function generateInsight(): string {
  const insights = [
    "Based on your preferences, you seem to prefer dynamic camera movements with dramatic lighting.",
    "Your successful patterns suggest you enjoy fast-paced action sequences with quick cuts.",
    "I notice you often choose nighttime scenes with handheld camera work for intense moments.",
    "Your learning shows a preference for complex, multi-character action sequences.",
    "Based on your history, you might enjoy experimenting with more dolly shots for smoother movement."
  ]

  // Select insight based on actual preferences
  if (userPreferences.camera_preferences['Handheld'] > 3) {
    return insights[2]
  } else if (userPreferences.lighting_preferences['Dramatic'] > 3) {
    return insights[0]
  } else if (userPreferences.scene_complexity_preference === 'complex') {
    return insights[3]
  } else if (userPreferences.action_patterns.length > 5) {
    return insights[1]
  }
  
  return insights[4]
}

function calculateLearningProgress(): number {
  const totalEvents = userPreferences.learning_history.length
  const successfulEvents = userPreferences.learning_history.filter(
    h => h.outcome === 'success'
  ).length
  
  if (totalEvents === 0) return 0
  
  return Math.min(100, (successfulEvents / totalEvents) * 100 + (totalEvents / 50) * 10)
}