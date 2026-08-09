# Echo — Voice Journal & Mood Timeline

Record short voice notes. Echo transcribes them via Groq Whisper, extracts mood and sentiment with an LLM, and builds a personal mood timeline.

## Stack

- **Frontend:** React 19, TanStack Router, Tailwind CSS, shadcn/ui
- **Backend:** Go (Gin), PostgreSQL, Redis
- **AI:** Groq Whisper (transcription) + Mixtral (mood analysis)

## Local development

Requires Docker Desktop.

```bash
# Copy env and add your Groq API key
cp .env.example .env

# Build and start everything
docker build -t echo-app:latest -f backend/Dockerfile .
docker compose --env-file .env up -d
```

App runs at **http://localhost:8080**

## Deploy

Render free tier — see `render.yaml` at the repo root.
