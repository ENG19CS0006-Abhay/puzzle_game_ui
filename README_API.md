# AI Puzzle Game - Nest.js Backend API

A modern Nest.js REST API backend for generating AI-powered logic puzzles using the Groq/Anthropic API.

## 🚀 Features

- **AI-Powered Puzzle Generation**: Uses Groq API to generate unique logic puzzles
- **Multiple Difficulty Levels**: Easy, Medium, and Hard puzzles
- **Smart Hints System**: AI-generated hints based on puzzle state
- **Solution Validation**: Verify player solutions against AI-generated answers
- **CORS Enabled**: Ready for frontend integration
- **Type-Safe**: Full TypeScript support

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API Key (provided in .env)

## 🔧 Installation

```bash
# Install dependencies
npm install

# or
yarn install
```

## 🌍 Environment Setup

Create a `.env` file in the root directory:

```env
GROQ_API_KEY*=YOUR_GROQ_API_KEY
NODE_ENV=development
PORT=3001
```

## 🚀 Running the API

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`

## 📚 API Endpoints

### 1. **Generate Puzzle**
```
POST /api/puzzles/generate
Content-Type: application/json

Body:
{
  "difficulty": "easy" | "medium" | "hard"
}

Response (201 Created):
{
  "id": "puzzle_1234567890_abc123",
  "title": "The Garden Party",
  "description": "Three guests attended a garden party...",
  "difficulty": "easy",
  "categories": [
    {
      "name": "People",
      "items": ["Alice", "Bob", "Charlie"]
    },
    {
      "name": "Colors",
      "items": ["Red", "Blue", "Green"]
    },
    {
      "name": "Hobbies",
      "items": ["Reading", "Painting", "Gardening"]
    }
  ],
  "clues": [
    {
      "text": "Alice wore red and loves painting",
      "difficulty": "easy"
    },
    {
      "text": "The gardening enthusiast wore blue",
      "difficulty": "medium"
    }
  ],
  "createdAt": "2024-04-29T10:30:00.000Z"
}
```

### 2. **Get Hint**
```
GET /api/puzzles/{puzzleId}/hint?solvedCells={"cell1":true,"cell2":false}

Response (200 OK):
{
  "hint": "Think about who could have worn the blue outfit based on the other clues..."
}
```

### 3. **Validate Solution**
```
POST /api/puzzles/{puzzleId}/validate
Content-Type: application/json

Body:
{
  "solution": {
    "People": ["Alice", "Bob", "Charlie"],
    "Colors": ["Red", "Blue", "Green"],
    "Hobbies": ["Painting", "Reading", "Gardening"]
  }
}

Response (200 OK):
{
  "isCorrect": true,
  "message": "Congratulations! You solved the puzzle!"
}
```

### 4. **Health Check**
```
GET /api/puzzles/health

Response (200 OK):
{
  "status": "ok",
  "message": "Puzzle API is running"
}
```

## 🎮 Frontend Integration

Update your React frontend to use the API:

```javascript
// Fetch a puzzle
const response = await fetch('http://localhost:3001/api/puzzles/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ difficulty: 'easy' })
});
const puzzle = await response.json();

// Get a hint
const hintResponse = await fetch(
  `http://localhost:3001/api/puzzles/${puzzle.id}/hint?solvedCells=${JSON.stringify({})}`
);
const { hint } = await hintResponse.json();

// Validate solution
const validationResponse = await fetch(
  `http://localhost:3001/api/puzzles/${puzzle.id}/validate`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ solution: userSolution })
  }
);
const result = await validationResponse.json();
```

## 📝 Prompt Engineering

The AI prompts are designed to generate well-structured logic puzzles:

### Puzzle Generation Prompt Template
- **Difficulty Customization**: Adjusts puzzle complexity
- **Category Generation**: Creates meaningful item groupings
- **Clue Generation**: Produces solvable puzzle clues
- **JSON Validation**: Ensures structured output

### Hint Generation Prompt Template
- **Contextual Hints**: Based on currently solved cells
- **Progressive Difficulty**: Hints guide without spoiling
- **Deduction-Based**: Teaches logic puzzle strategies

## 🏗️ Project Structure

```
src/
├── controllers/
│   └── puzzle.controller.ts      # API endpoints
├── services/
│   ├── puzzle.service.ts         # Puzzle business logic
│   └── groq.service.ts           # Groq API integration
├── app.module.ts                 # Main module
└── main.ts                        # Application entry point
```

## 🔐 Security Notes

- API key is stored in `.env` (never commit this)
- CORS is configured for development only
- Validate user input in production
- Rate limiting recommended for production

## 🧪 Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

## 📦 Building for Production

```bash
npm run build
npm run start:prod
```

## 🤝 Contributing

Feel free to enhance the puzzle generation logic or add new features!

## 📄 License

MIT

---

**API Version**: 1.0.0  
**Last Updated**: April 29, 2024
