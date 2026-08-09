-- seed.sql: Insert 5 demo entries with mock embeddings
-- The embeddings are deterministic mock vectors (first few values shown, rest zeros)

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '11111111-1111-1111-1111-111111111111',
    'Today was an amazing day! I got promoted at work and celebrated with friends over dinner. Feeling on top of the world.',
    92,
    ARRAY['happy', 'excited', 'grateful'],
    ('[' || array_to_string(array_agg(x)::text[], ',') || ']')::vector FROM (SELECT 0.8 AS x FROM generate_series(1,1536)) sub,
    'A joyful entry about career success and social celebration.',
    '2024-01-15T10:30:00Z'
  );

-- Simpler approach: use a helper function
-- For seed data, we'll insert with a direct vector literal

DELETE FROM entries;

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Today was an amazing day! I got promoted at work and celebrated with friends over dinner. Feeling on top of the world.',
  92,
  ARRAY['happy', 'excited', 'grateful'],
  (SELECT array_agg(0.8)::vector(1536) FROM generate_series(1,1536)),
  'A joyful entry about career success and social celebration.',
  '2024-01-15T10:30:00Z'::timestamptz;

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
SELECT
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Feeling quite down today. The rain has not stopped and I could not focus on anything. Just want to curl up and sleep.',
  25,
  ARRAY['sad', 'tired', 'unmotivated'],
  (SELECT array_agg(0.3)::vector(1536) FROM generate_series(1,1536)),
  'A melancholic entry reflecting low energy and poor weather.',
  '2024-01-20T14:45:00Z'::timestamptz;

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
SELECT
  'c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Had a productive morning workout and then spent the afternoon reading a great book. Feeling balanced and content.',
  75,
  ARRAY['calm', 'content', 'productive'],
  (SELECT array_agg(0.6)::vector(1536) FROM generate_series(1,1536)),
  'A balanced entry about physical activity and intellectual leisure.',
  '2024-02-01T09:15:00Z'::timestamptz;

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
SELECT
  'd4e5f6a7-b8c9-0123-defa-234567890123'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Got into a heated argument with my roommate about chores. I am frustrated and feel like nobody listens to me.',
  30,
  ARRAY['angry', 'frustrated', 'annoyed'],
  (SELECT array_agg(0.35)::vector(1536) FROM generate_series(1,1536)),
  'A frustrated entry about interpersonal conflict at home.',
  '2024-02-10T19:00:00Z'::timestamptz;

INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, embedding, groq_summary, created_at)
SELECT
  'e5f6a7b8-c9d0-1234-efab-345678901234'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Spent the weekend hiking in the mountains with my dog. The views were breathtaking and I feel so recharged and alive!',
  88,
  ARRAY['happy', 'energized', 'peaceful'],
  (SELECT array_agg(0.75)::vector(1536) FROM generate_series(1,1536)),
  'An uplifting entry about nature and outdoor recreation.',
  '2024-02-18T17:30:00Z'::timestamptz;
