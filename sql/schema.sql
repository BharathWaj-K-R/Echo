CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  transcript TEXT NOT NULL,
  sentiment_score INTEGER CHECK (sentiment_score BETWEEN 0 AND 100),
  mood_tags TEXT[] NOT NULL,
  embedding TEXT NOT NULL DEFAULT '',
  groq_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_mood ON entries USING GIN (mood_tags);

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  transcript TEXT NOT NULL,
  sentiment_score INTEGER,
  mood_tags TEXT[],
  embedding TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
