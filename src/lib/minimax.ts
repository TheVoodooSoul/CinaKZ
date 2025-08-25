// Minimax API Integration
import axios from 'axios';

const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimax.chat/v1';
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

// Minimax API client
export const minimaxClient = axios.create({
  baseURL: MINIMAX_API_URL,
  headers: {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Minimax API functions
export const minimax = {
  // Chat completion
  async chat(messages: Array<{ role: string; content: string }>, options = {}) {
    try {
      const response = await minimaxClient.post('/chat/completions', {
        model: 'abab6.5-chat',
        messages,
        stream: false,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax chat error:', error);
      throw error;
    }
  },

  // Text to image generation
  async generateImage(prompt: string, options = {}) {
    try {
      const response = await minimaxClient.post('/text-to-image', {
        prompt,
        model: 'minimax-01',
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax image generation error:', error);
      throw error;
    }
  },

  // Video generation
  async generateVideo(prompt: string, options = {}) {
    try {
      const response = await minimaxClient.post('/video/generation', {
        prompt,
        model: 'video-01',
        duration: 5,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax video generation error:', error);
      throw error;
    }
  },

  // Audio generation
  async generateAudio(text: string, voice = 'default', options = {}) {
    try {
      const response = await minimaxClient.post('/audio/speech', {
        text,
        voice,
        model: 'speech-01',
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax audio generation error:', error);
      throw error;
    }
  },

  // Embeddings
  async createEmbedding(input: string | string[], model = 'embo-01') {
    try {
      const response = await minimaxClient.post('/embeddings', {
        model,
        input,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax embedding error:', error);
      throw error;
    }
  },

  // Function calling
  async functionCall(messages: any[], functions: any[], options = {}) {
    try {
      const response = await minimaxClient.post('/chat/completions', {
        model: 'abab6.5-chat',
        messages,
        functions,
        function_call: 'auto',
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Minimax function call error:', error);
      throw error;
    }
  },

  // Validate API key
  async validateApiKey() {
    try {
      const response = await minimaxClient.get('/models');
      return { valid: true, models: response.data };
    } catch (error) {
      return { valid: false, error };
    }
  },
};

// Webhook handler for Minimax callbacks
export async function handleMinimaxWebhook(req: any) {
  const { type, data } = req.body;

  switch (type) {
    case 'video.completed':
      // Handle video generation completion
      console.log('Video generation completed:', data);
      break;
    case 'image.completed':
      // Handle image generation completion
      console.log('Image generation completed:', data);
      break;
    case 'audio.completed':
      // Handle audio generation completion
      console.log('Audio generation completed:', data);
      break;
    default:
      console.log('Unknown webhook type:', type);
  }

  return { success: true };
}

// Minimax streaming support
export function createMinimaxStream(messages: any[], options = {}) {
  return new ReadableStream({
    async start(controller) {
      try {
        const response = await minimaxClient.post('/chat/completions', {
          model: 'abab6.5-chat',
          messages,
          stream: true,
          ...options,
        }, {
          responseType: 'stream',
        });

        const reader = response.data.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          controller.enqueue(chunk);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export default minimax;
