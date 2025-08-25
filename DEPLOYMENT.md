# 🚀 Deployment Guide for Cinekinetic API

## Prerequisites
- Node.js 18+ installed
- NPM or Yarn package manager
- SQLite (comes with most systems)
- ComfyUI server (optional, for AI features)

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/TheVoodooSoul/CinaKZ.git
cd CinaKZ
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# IMPORTANT: Change NEXTAUTH_SECRET to a secure random string
```

### 4. Initialize the database
```bash
npm run db:push
npm run db:generate
```

### 5. Run the development server
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Production Deployment

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## Deployment Platforms

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker
```bash
docker build -t cinekinetic-api .
docker run -p 3000:3000 --env-file .env cinekinetic-api
```

### Railway/Render
- Connect GitHub repository
- Set environment variables
- Deploy automatically

## Important Notes

⚠️ **Security Considerations:**
- Always change `NEXTAUTH_SECRET` in production
- Use strong API keys
- Enable HTTPS in production
- Set appropriate CORS policies

## Troubleshooting

### Database issues
```bash
# Reset database
npm run db:reset

# Regenerate Prisma client
npm run db:generate
```

### Port already in use
Change the port in server.ts or use:
```bash
PORT=3001 npm run dev
```

### Missing dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

- `/api/health` - Health check
- `/api/status` - System status
- `/api/comfyui/framepack` - FramePack generation
- `/api/comfyui/fusionx` - FusionX processing
- `/api/comfyui/wan-retyle` - WAN Restyle
- `/api/style-transfer` - Style transfer
- `/api/storyboard` - Storyboard generation
- `/api/characters/generate` - Character generation
- `/api/nlp/analyze` - NLP analysis

## Support

For issues or questions, please open an issue on GitHub.
