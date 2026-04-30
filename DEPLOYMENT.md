# Production Deployment Guide

This guide covers deploying the AI Puzzle Game to production.

## Environment Variables

All sensitive configuration and environment-specific settings should be managed via environment variables. **Never commit `.env` files or hardcode secrets.**

### Required Environment Variables

#### Backend (Node.js/NestJS)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | API key for Google Gemini | `AIzaSy...` | Yes |
| `GEMINI_MODEL` | AI model to use | `gemini-1.5-flash` | No (has default) |
| `NODE_ENV` | Environment mode | `production` or `development` | No |
| `PORT` | Backend server port | `3001` | No (defaults to 3001) |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://myapp.com,https://www.myapp.com` | No |

#### Frontend (Vite/React)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://api.myapp.com/api/puzzles` | No (defaults to localhost) |
| `VITE_PORT` | Frontend dev server port | `5173` | No (defaults to 5173) |

## Setup for Production

### 1. Backend Deployment

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Set Environment Variables
Create a `.env` file or set environment variables in your deployment platform:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Step 3: Build the Backend
```bash
npm run build
```

#### Step 4: Start the Server
```bash
npm run start:prod
```

The API will be available at `http://localhost:3001` (or your configured PORT).

### 2. Frontend Deployment

#### Step 1: Build for Production
```bash
npm run dev:build
```

This creates an optimized build in the `dist/` directory.

#### Step 2: Set Backend URL
Before building, set the `VITE_API_BASE_URL` environment variable:

```bash
# On Linux/macOS
export VITE_API_BASE_URL=https://api.yourdomain.com/api/puzzles
npm run dev:build

# On Windows (PowerShell)
$env:VITE_API_BASE_URL='https://api.yourdomain.com/api/puzzles'
npm run dev:build

# On Windows (Command Prompt)
set VITE_API_BASE_URL=https://api.yourdomain.com/api/puzzles
npm run dev:build
```

#### Step 3: Deploy Static Files
Upload the contents of the `dist/` directory to your web hosting (Netlify, Vercel, AWS S3, etc.).

### 3. Docker Deployment (Optional)

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm run dev:build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

Build and run:
```bash
docker build -t puzzle-game .
docker run -p 3001:3001 \
  -e GROQ_API_KEY=your_key \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e NODE_ENV=production \
  puzzle-game
```

## Popular Hosting Platforms

### Vercel (Frontend)
1. Connect your GitHub repository
2. Set environment variables in project settings:
   - `VITE_API_BASE_URL`: Your backend API URL
3. Vercel automatically builds and deploys on push

### Railway (Backend + Frontend)
1. Create a new project and select GitHub
2. Set environment variables in the Variables tab
3. Railway auto-detects and builds both services
4. Use Railway domain for `CORS_ORIGINS`

### Heroku (Backend)
```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
heroku config:set CORS_ORIGINS=https://yourdomain.com
git push heroku main
```

### AWS EC2 + S3
1. **Backend (EC2)**:
   - Launch an EC2 instance (Node.js AMI)
   - SSH into instance, clone repo
   - Set environment variables
   - Run `npm install && npm run build && npm run start:prod`
   - Use security groups to allow port 3001

2. **Frontend (S3 + CloudFront)**:
   - Build with `VITE_API_BASE_URL` set
   - Upload `dist/` contents to S3 bucket
   - Enable static website hosting
   - Create CloudFront distribution for CDN

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Verify `.env` is in `.gitignore`
- [ ] Rotate `GEMINI_API_KEY` regularly
- [ ] Use HTTPS/TLS for all URLs in `CORS_ORIGINS` (production)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict `CORS_ORIGINS` to your domain(s) only
- [ ] Enable CORS only for required origins
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Remove debug logs before production
- [ ] Test the build in staging environment first

## Troubleshooting

### CORS Errors
**Problem**: Frontend cannot reach backend
- Check `CORS_ORIGINS` includes your frontend domain
- Ensure it matches exactly (include https://, www, trailing slash)
- Restart the backend after changing `CORS_ORIGINS`

### API Not Found Errors
**Problem**: Frontend gets 404 when calling API
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is running and accessible
- Confirm `VITE_API_BASE_URL` ends with `/api/puzzles`

### Missing Environment Variables
**Problem**: Application fails to start
- Check all required variables are set
- Use `.env.example` as a template
- Restart application after setting variables

### Gemini API Errors
**Problem**: "Invalid API key" or "Authentication failed"
- Verify `GEMINI_API_KEY` is set correctly in environment variables
- Ensure the key is valid in [Google AI Studio](https://aistudio.google.com/)
- Check that Gemini API is enabled in Google Cloud Console
- Restart the backend after updating the API key

## Health Check

Test the deployment with:

```bash
# Backend health check
curl http://your-backend-domain:3001/api/puzzles/health

# Frontend loads in browser
https://your-frontend-domain
```

## Support

For issues:
1. Check logs: `NODE_ENV=development npm run start:dev`
2. Verify environment variables are set
3. Test API endpoint directly with curl
4. Check .env.example for correct variable names
