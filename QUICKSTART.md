# 🚀 Quick Start Guide

## Project Structure

```
puzzle_game/
├── src/
│   ├── controllers/
│   │   └── puzzle.controller.ts          # REST API endpoints
│   ├── services/
│   │   ├── groq.service.ts               # Groq/Claude API integration
│   │   └── puzzle.service.ts             # Puzzle generation logic
│   ├── app.module.ts                     # Nest.js module configuration
│   └── main.ts                           # Application entry point
├── index.js                              # Original React component
├── AIModernPuzzleGame.jsx                # AI-powered React component (NEW)
├── package.json                          # Node dependencies
├── tsconfig.json                         # TypeScript config
├── nest-cli.json                         # Nest.js CLI config
├── .env                                  # Environment variables
├── .env.example                          # Example env file
├── .gitignore                            # Git ignore rules
├── README.md                             # Original README
└── README_API.md                         # API documentation

```

## 📦 Installation & Setup

### Step 1: Install Dependencies
```bash
npm install
```

This installs:
- NestJS framework
- TypeScript support
- Anthropic SDK (for Groq API)
- All required dependencies

### Step 2: Verify Environment Variables
Check that `.env` file contains:
```env
GROQ_API_KEY=YOUR_GROQ_API_KEY
NODE_ENV=development
PORT=3001
```

### Step 3: Start the Backend
```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Expected output:
```
🚀 Puzzle Game API running on http://localhost:3001
📝 API Documentation at http://localhost:3001/api/puzzles/health
```

### Step 4: Start the Frontend (in a new terminal)
```bash
# If using React dev server (Vite or CRA)
npm start
# or
npm run dev
```

The frontend should connect to `http://localhost:3001`

## 🎮 How It Works

### 1. **User selects difficulty** → 
   POST `/api/puzzles/generate` → 
   **AI generates puzzle** using Groq API

### 2. **User reads clues** and **clicks items** to mark them:
   - ✓ = Correct (green)
   - ✗ = Wrong (red)
   - Blank = Unknown (gray)

### 3. **User gets hints** → 
   GET `/api/puzzles/{id}/hint` → 
   **AI provides contextual hint**

### 4. **User submits solution** → 
   POST `/api/puzzles/{id}/validate` → 
   **API validates against stored solution**

## 🧠 AI Prompt Strategy

The system uses intelligent prompts for:

### **Puzzle Generation**
- Generates N×N logic puzzles (3×3 easy, 4×4 medium, 5×5 hard)
- Creates meaningful categories and items
- Generates logical clues that form a solvable puzzle
- Returns structured JSON for easy parsing

### **Hint Generation**
- Analyzes current puzzle state
- Generates contextual hints based on solved cells
- Provides clues without spoiling the solution
- Teaches deductive reasoning

## 🔑 Key Features

✅ **AI-Powered**: Uses Groq/Claude API for intelligent puzzle generation  
✅ **Responsive UI**: Modern dark/light mode with Tailwind CSS  
✅ **Type-Safe**: Full TypeScript support  
✅ **REST API**: Clean, documented endpoints  
✅ **Solution Validation**: Server-side puzzle verification  
✅ **Smart Hints**: Context-aware AI hints  
✅ **CORS Enabled**: Ready for frontend integration  

## 🧪 Testing the API with cURL

### Generate a Puzzle
```bash
curl -X POST http://localhost:3001/api/puzzles/generate \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "easy"}'
```

### Get Health Status
```bash
curl http://localhost:3001/api/puzzles/health
```

### Get a Hint
```bash
curl "http://localhost:3001/api/puzzles/puzzle_123/hint?solvedCells=%7B%7D"
```

## 🔧 Configuration Options

### Difficulty Levels
| Level | Size | Complexity | Time |
|-------|------|-----------|------|
| Easy | 3×3 | Simple deductions | 5-10 min |
| Medium | 4×4 | Moderate logic | 15-20 min |
| Hard | 5×5 | Complex reasoning | 30+ min |

### Prompt Customization
Edit `src/services/groq.service.ts`:
- Line 14-25: Puzzle generation prompt
- Line 41-48: Hint generation prompt

## 📝 Example Response

### Generate Puzzle Response (201 Created)
```json
{
  "id": "puzzle_1234567890_abc123",
  "title": "The Dinner Party",
  "description": "Three friends gathered for dinner...",
  "difficulty": "easy",
  "categories": [
    {
      "name": "People",
      "items": ["Alice", "Bob", "Charlie"]
    },
    {
      "name": "Foods",
      "items": ["Pizza", "Pasta", "Salad"]
    },
    {
      "name": "Drinks",
      "items": ["Water", "Wine", "Beer"]
    }
  ],
  "clues": [
    {
      "text": "The person who had pizza also drank water",
      "difficulty": "easy"
    },
    {
      "text": "Alice didn't have wine",
      "difficulty": "easy"
    }
  ],
  "createdAt": "2024-04-29T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY not found"
**Solution**: Check `.env` file exists and contains the API key

### Issue: "Port 3001 already in use"
**Solution**: Change PORT in `.env` or kill the process:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Issue: "Module not found"
**Solution**: Install dependencies:
```bash
npm install
```

### Issue: Frontend can't connect to API
**Solution**: 
- Ensure backend is running on port 3001
- Check CORS is enabled in `main.ts`
- Verify API_BASE_URL in frontend component

## 📚 Next Steps

1. **Customize Prompts**: Edit prompts in `groq.service.ts` for different puzzle types
2. **Add Database**: Store puzzles in MongoDB/PostgreSQL for persistence
3. **User Accounts**: Add authentication and puzzle history
4. **Leaderboard**: Track scores and completion times
5. **Multiplayer**: Real-time puzzle collaboration

## 🤝 Support

For issues or questions:
1. Check the logs in the terminal
2. Review API response in browser DevTools
3. Test endpoints with cURL
4. Check `.env` configuration

---

**Version**: 1.0.0  
**Last Updated**: April 29, 2024
