# 🚀 Minimax Deployment Guide

## Quick Launch for Minimax

### One-Command Launch
```bash
# Clone and launch
git clone https://github.com/TheVoodooSoul/CinaKZ.git
cd CinaKZ
chmod +x minimax-launch.sh
./minimax-launch.sh
```

## Minimax Integration Features

This Cinekinetic API is fully configured for Minimax with:

### ✅ Pre-configured Minimax APIs
- Chat completions (abab6.5-chat model)
- Text-to-image generation
- Video generation
- Audio/speech synthesis
- Embeddings (embo-01 model)
- Function calling support
- Streaming responses

### ✅ Ready-to-use Endpoints
All endpoints are configured and ready for Minimax:

```javascript
// Example: Using Minimax chat
POST /api/minimax/chat
{
  "messages": [
    {"role": "user", "content": "Generate a movie scene"}
  ]
}

// Example: Generate image
POST /api/minimax/image
{
  "prompt": "cinematic shot of a futuristic city"
}

// Example: Generate video
POST /api/minimax/video
{
  "prompt": "drone shot over mountains",
  "duration": 5
}
```

## Deployment Options for Minimax

### Option 1: Docker (Recommended)
```bash
# Build and run with Docker
docker build -t cinekinetic-minimax .
docker run -p 3000:3000 \
  -e MINIMAX_API_KEY=your-key \
  -e DATABASE_URL=your-db-url \
  cinekinetic-minimax
```

### Option 2: Docker Compose
```bash
# Set your Minimax API key in .env
echo "MINIMAX_API_KEY=your-minimax-key" >> .env

# Launch with docker-compose
docker-compose up -d
```

### Option 3: Direct Deployment
```bash
# Install dependencies
npm install

# Set environment variables
export MINIMAX_API_KEY=your-minimax-key
export DATABASE_URL=your-database-url

# Build and start
npm run build
npm start
```

### Option 4: Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cinekinetic-minimax
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: cinekinetic-minimax:latest
        ports:
        - containerPort: 3000
        env:
        - name: MINIMAX_API_KEY
          valueFrom:
            secretKeyRef:
              name: minimax-secret
              key: api-key
```

## Environment Variables for Minimax

```env
# Required for Minimax
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_API_URL=https://api.minimax.chat/v1

# Database (choose one)
DATABASE_URL=postgresql://...  # For Supabase/PostgreSQL
# OR
DATABASE_URL=file:./db/custom.db  # For SQLite

# Authentication
NEXTAUTH_SECRET=generate-secure-secret
NEXTAUTH_URL=https://your-domain.com

# Optional: ComfyUI Integration
COMFYUI_API_URL=http://comfyui:8188
COMFYUI_WS_URL=ws://comfyui:8188
```

## API Usage Examples

### 1. Chat Completion
```bash
curl -X POST http://localhost:3000/api/minimax/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant"},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 2. Image Generation
```bash
curl -X POST http://localhost:3000/api/minimax/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "size": "1024x1024"
  }'
```

### 3. Video Generation
```bash
curl -X POST http://localhost:3000/api/minimax/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A spaceship flying through space",
    "duration": 5
  }'
```

### 4. ComfyUI Integration
```bash
curl -X POST http://localhost:3000/api/comfyui/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "cinematic scene",
    "style": "photorealistic"
  }'
```

## Scaling for Production

### Auto-scaling Configuration
```json
{
  "scaling": {
    "minInstances": 1,
    "maxInstances": 10,
    "targetCPU": 70,
    "targetMemory": 80
  }
}
```

### Load Balancing
```nginx
upstream cinekinetic {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://cinekinetic;
    }
}
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
GET /api/health
# Returns: {"status": "healthy", "timestamp": "..."}
```

### Status Endpoint
```bash
GET /api/status
# Returns detailed system status
```

### Metrics
- Request rate
- Response time
- Error rate
- API usage by endpoint
- Minimax API consumption

## Security Considerations

1. **API Key Security**
   - Store MINIMAX_API_KEY in environment variables
   - Never commit keys to git
   - Use secrets management in production

2. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Monitor Minimax API usage limits

3. **Authentication**
   - Use NextAuth for user authentication
   - Implement API key authentication for B2B

## Troubleshooting

### Common Issues

1. **Minimax API Key Invalid**
```bash
# Validate your API key
curl http://localhost:3000/api/minimax/validate
```

2. **Database Connection Failed**
```bash
# Check database connection
npx prisma db pull
```

3. **Port Already in Use**
```bash
# Change port in .env
PORT=3001 npm start
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## Support

- **GitHub Issues**: https://github.com/TheVoodooSoul/CinaKZ/issues
- **Minimax Docs**: https://api.minimax.chat/docs
- **API Status**: Check /api/health endpoint

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/health | GET | Health check |
| /api/status | GET | System status |
| /api/minimax/chat | POST | Chat completion |
| /api/minimax/image | POST | Image generation |
| /api/minimax/video | POST | Video generation |
| /api/minimax/audio | POST | Audio generation |
| /api/comfyui/framepack | POST | FramePack generation |
| /api/comfyui/fusionx | POST | FusionX processing |
| /api/style-transfer | POST | Style transfer |
| /api/storyboard | POST | Storyboard generation |

## 🎉 Ready for Minimax!

Your Cinekinetic API is fully configured and ready to be launched by Minimax. Just run:

```bash
./minimax-launch.sh
```

And select your preferred deployment option!
