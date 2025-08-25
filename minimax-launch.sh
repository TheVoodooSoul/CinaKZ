#!/bin/bash

# Cinekinetic API - Minimax Launch Script
# This script automates the deployment process for Minimax

set -e  # Exit on error

echo "🚀 Cinekinetic API - Minimax Launch Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
print_status "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi
print_status "Docker Compose is installed"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f .env.supabase.example ]; then
        cp .env.supabase.example .env
        print_status "Created .env file from template"
        echo ""
        print_warning "Please edit .env file with your credentials:"
        echo "  - Supabase credentials"
        echo "  - Minimax API key"
        echo "  - Other API keys as needed"
        echo ""
        read -p "Press Enter after updating .env file to continue..."
    else
        print_error "No .env template found. Please create .env file manually."
        exit 1
    fi
fi

# Validate required environment variables
echo ""
echo "Validating environment variables..."
source .env

required_vars=(
    "DATABASE_URL"
    "MINIMAX_API_KEY"
    "NEXTAUTH_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=($var)
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi
print_status "All required environment variables are set"

# Launch mode selection
echo ""
echo "Select launch mode:"
echo "1) Production (with Supabase)"
echo "2) Development (with local PostgreSQL)"
echo "3) Full stack (with ComfyUI)"
echo "4) Docker build only"
echo "5) Direct Node.js (no Docker)"
read -p "Enter choice [1-5]: " launch_mode

case $launch_mode in
    1)
        echo ""
        echo "Launching in Production mode with Supabase..."
        $DOCKER_COMPOSE up -d cinekinetic-api
        ;;
    2)
        echo ""
        echo "Launching in Development mode with local PostgreSQL..."
        $DOCKER_COMPOSE --profile with-postgres up -d
        ;;
    3)
        echo ""
        echo "Launching Full stack with ComfyUI..."
        $DOCKER_COMPOSE --profile with-comfyui --profile with-postgres up -d
        ;;
    4)
        echo ""
        echo "Building Docker image only..."
        docker build -t cinekinetic-api:latest .
        print_status "Docker image built successfully"
        echo "Run with: docker run -p 3000:3000 --env-file .env cinekinetic-api:latest"
        exit 0
        ;;
    5)
        echo ""
        echo "Launching with Node.js directly..."
        
        # Check Node.js
        if ! command -v node &> /dev/null; then
            print_error "Node.js is not installed"
            exit 1
        fi
        
        # Install dependencies
        print_status "Installing dependencies..."
        npm install
        
        # Generate Prisma client
        print_status "Generating Prisma client..."
        npx prisma generate
        
        # Push database schema
        print_status "Pushing database schema..."
        npx prisma db push
        
        # Build application
        print_status "Building application..."
        npm run build
        
        # Start application
        print_status "Starting application..."
        npm start
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Wait for services to be ready
echo ""
echo "Waiting for services to start..."
sleep 5

# Check service health
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_status "API is healthy and running!"
else
    print_warning "API might still be starting up..."
fi

# Display service information
echo ""
echo "=========================================="
echo "🎉 Cinekinetic API is now running!"
echo "=========================================="
echo ""
echo "Access points:"
echo "  - API: http://localhost:3000"
echo "  - Health: http://localhost:3000/api/health"
echo "  - Status: http://localhost:3000/api/status"

if [ "$launch_mode" = "3" ]; then
    echo "  - ComfyUI: http://localhost:8188"
fi

echo ""
echo "API Endpoints:"
echo "  - POST /api/comfyui/framepack"
echo "  - POST /api/comfyui/fusionx"
echo "  - POST /api/comfyui/wan-retyle"
echo "  - POST /api/style-transfer"
echo "  - POST /api/storyboard"
echo "  - POST /api/characters/generate"
echo "  - POST /api/nlp/analyze"
echo "  - POST /api/wan2/generate"

echo ""
echo "Management commands:"
echo "  - View logs: $DOCKER_COMPOSE logs -f cinekinetic-api"
echo "  - Stop services: $DOCKER_COMPOSE down"
echo "  - Restart services: $DOCKER_COMPOSE restart"
echo "  - View status: $DOCKER_COMPOSE ps"

echo ""
echo "📚 Documentation: https://github.com/TheVoodooSoul/CinaKZ"
echo "🚀 Ready for Minimax integration!"
