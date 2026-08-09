# Echo — Voice Journal + Mood Recall

A voice journal app with Groq-powered mood extraction and pgvector similarity search.
100% free stack.

## Quick Start (Local)

### Prerequisites
- Docker Desktop
- Go 1.21+
- Node.js 18+

### 1. Start services
```bash
docker compose up -d
```

### 2. Set environment variables
Copy `.env.example` to `.env` and add your free Groq API key from [groq.com](https://groq.com).

### 3. Run backend
```bash
set -a && source .env && set +a
go mod tidy
go run ./cmd/server
```

### 4. Run frontend
```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Render (Free)
1. Push to GitHub
2. Create Render account
3. New → Blueprint → connect repo
4. Add `GROQ_API_KEY` secret
5. Deploy

## API
- `POST /entries` — submit audio entry
- `GET /entries` — list all entries
- `GET /entries/:id/similar` — find similar entries
- `GET /health` — health check
