package db

import (
	"context"
	"database/sql"
	"time"

	"github.com/lib/pq"
)

type Entry struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Transcript     string    `json:"transcript"`
	SentimentScore int       `json:"sentiment_score"`
	MoodTags       []string  `json:"mood_tags"`
	CreatedAt      time.Time `json:"created_at"`
}

// FindSimilar returns entries that share at least one mood tag with the given entry.
func FindSimilar(c context.Context, db *sql.DB, entryID string, limit int) ([]Entry, error) {
	rows, err := db.QueryContext(c, `
		SELECT id, user_id, transcript, sentiment_score, mood_tags, created_at
		FROM entries
		WHERE id != $1
		  AND mood_tags && (SELECT mood_tags FROM entries WHERE id = $1)
		ORDER BY created_at DESC
		LIMIT $2`, entryID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Entry
	for rows.Next() {
		var e Entry
		var tags pq.StringArray
		if err := rows.Scan(&e.ID, &e.UserID, &e.Transcript, &e.SentimentScore, &tags, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.MoodTags = tags
		results = append(results, e)
	}
	if results == nil {
		results = []Entry{}
	}
	return results, nil
}
