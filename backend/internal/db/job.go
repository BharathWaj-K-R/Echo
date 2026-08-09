package db

import (
	"database/sql"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// EnqueueJob inserts a new row into the job_queue table.
func EnqueueJob(db *sql.DB, userID uuid.UUID, transcript string) (uuid.UUID, error) {
	jobID := uuid.New()
	_, err := db.Exec("INSERT INTO job_queue (id, user_id, transcript) VALUES ($1, $2, $3)", jobID, userID, transcript)
	if err != nil {
		return uuid.Nil, err
	}
	return jobID, nil
}

// MarkJobDone updates the job row with the processed data.
func MarkJobDone(db *sql.DB, jobID uuid.UUID, sentiment int, tags []string) error {
	_, err := db.Exec(
		"UPDATE job_queue SET status=$1, sentiment_score=$2, mood_tags=$3 WHERE id=$4",
		"done", sentiment, pq.Array(tags), jobID,
	)
	return err
}

// InsertEntry stores a fully processed journal entry into the entries table.
func InsertEntry(db *sql.DB, id, userID uuid.UUID, transcript string, sentiment int, tags []string, summary string) error {
	_, err := db.Exec(
		"INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, groq_summary) VALUES ($1, $2, $3, $4, $5, $6)",
		id, userID, transcript, sentiment, pq.Array(tags), summary,
	)
	return err
}
