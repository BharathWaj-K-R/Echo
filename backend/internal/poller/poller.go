package poller

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/google/uuid"

	"echo/internal/db"
	"echo/internal/groq"
)

// StartPoller launches a ticker that checks the job_queue every 5 seconds.
func StartPoller(ctx context.Context, database *sql.DB) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			processNextJob(context.Background(), database)
		}
	}
}

func processNextJob(ctx context.Context, database *sql.DB) {
	var jobID, userID uuid.UUID
	var transcript string

	err := database.QueryRowContext(ctx,
		"SELECT id, user_id, transcript FROM job_queue WHERE status='pending' LIMIT 1").
		Scan(&jobID, &userID, &transcript)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Printf("poller query error: %v", err)
		}
		return
	}

	// Call Groq to extract mood.
	mood, err := groq.ExtractMood(ctx, transcript)
	if err != nil {
		log.Printf("groq error: %v", err)
		return
	}

	// Insert processed entry into entries table.
	entryID := uuid.New()
	if err := db.InsertEntry(database, entryID, userID, transcript, mood.Score, mood.Tags, ""); err != nil {
		log.Printf("insert entry error: %v", err)
		return
	}

	// Mark job as done.
	if err := db.MarkJobDone(database, jobID, mood.Score, mood.Tags); err != nil {
		log.Printf("mark job done error: %v", err)
	}
}
