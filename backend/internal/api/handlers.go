package api

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"

	"echo/internal/cache"
	"echo/internal/db"
)

// CreateEntry receives a base64 audio payload, decodes (placeholder), and enqueues a job.
func CreateEntry(c *gin.Context, database *sql.DB) {
	var req struct {
		Audio string `json:"audio"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Placeholder: in a real app you would transcribe the audio here.
	transcript := "Demo transcript from audio"
	if req.Audio != "" && len(req.Audio) < 500 {
		// If the "audio" field looks like plain text, use it as the transcript directly
		transcript = req.Audio
	}
	jobID := uuid.New()
	userID := uuid.New()

	_, err := database.Exec(
		"INSERT INTO job_queue (id, user_id, transcript) VALUES ($1, $2, $3)",
		jobID, userID, transcript,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"job_id": jobID})
}

// ListEntries returns all entries for the timeline view.
func ListEntries(c *gin.Context, database *sql.DB) {
	rows, err := database.Query(`SELECT id, transcript, sentiment_score, mood_tags, created_at FROM entries ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []map[string]interface{}
	for rows.Next() {
		var id, transcript string
		var score int
		var tags pq.StringArray
		var createdAt string
		if err := rows.Scan(&id, &transcript, &score, &tags, &createdAt); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"id": id, "transcript": transcript, "sentiment_score": score,
			"mood_tags": []string(tags), "created_at": createdAt,
		})
	}
	if results == nil {
		results = []map[string]interface{}{}
	}
	c.JSON(http.StatusOK, results)
}

// GetSimilar returns top N similar entries using pgvector and caches the result.
func GetSimilar(c *gin.Context, database *sql.DB, redisClient *redis.Client) {
	entryID := c.Param("id")

	// Check Redis cache first.
	if cached, ok := cache.GetCached(entryID, redisClient); ok {
		c.Data(http.StatusOK, "application/json", cached)
		return
	}

	sims, err := db.FindSimilar(c, database, entryID, 3)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	cache.SetCached(entryID, redisClient, sims)
	c.JSON(http.StatusOK, sims)
}

// Health returns a simple OK status.
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
