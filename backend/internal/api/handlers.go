package api

import (
	"database/sql"
	"encoding/base64"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"

	"echo/internal/cache"
	"echo/internal/db"
	"echo/internal/groq"
)

// CreateEntry accepts a base64-encoded audio blob, transcribes it via Groq Whisper,
// extracts mood, persists the entry, and returns the full entry synchronously.
func CreateEntry(c *gin.Context, database *sql.DB) {
	var req struct {
		Audio    string `json:"audio"`     // base64-encoded audio data
		MimeType string `json:"mime_type"` // e.g. "audio/webm"
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if req.Audio == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "audio field is required"})
		return
	}

	// Decode base64 audio
	audioData, err := base64.StdEncoding.DecodeString(req.Audio)
	if err != nil {
		// Try URL-safe base64
		audioData, err = base64.URLEncoding.DecodeString(req.Audio)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "audio must be base64-encoded"})
			return
		}
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "audio/webm"
	}

	// Step 1: Transcribe audio via Groq Whisper
	transcript, err := groq.Transcribe(c.Request.Context(), audioData, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transcription failed: " + err.Error()})
		return
	}
	if strings.TrimSpace(transcript) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no speech detected in audio"})
		return
	}

	// Step 2: Extract mood via Groq chat
	mood, err := groq.ExtractMood(c.Request.Context(), transcript)
	if err != nil {
		mood.Score = 50
		mood.Tags = []string{"neutral"}
	}

	// Step 3: Persist entry directly (skip job queue for synchronous response)
	entryID := uuid.New()
	userID := uuid.New()
	now := time.Now()

	_, err = database.ExecContext(c.Request.Context(),
		`INSERT INTO entries (id, user_id, transcript, sentiment_score, mood_tags, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		entryID, userID, transcript, mood.Score, pq.Array(mood.Tags), now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":              entryID.String(),
		"transcript":      transcript,
		"sentiment_score": mood.Score,
		"mood_tags":       mood.Tags,
		"created_at":      now.Format(time.RFC3339),
	})
}

// ListEntries returns all entries for the timeline view.
func ListEntries(c *gin.Context, database *sql.DB) {
	rows, err := database.Query(
		`SELECT id, transcript, sentiment_score, mood_tags, created_at FROM entries ORDER BY created_at DESC`)
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
		var createdAt time.Time
		if err := rows.Scan(&id, &transcript, &score, &tags, &createdAt); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"id":              id,
			"transcript":      transcript,
			"sentiment_score": score,
			"mood_tags":       []string(tags),
			"created_at":      createdAt.Format(time.RFC3339),
		})
	}
	if results == nil {
		results = []map[string]interface{}{}
	}
	c.JSON(http.StatusOK, results)
}

// GetSimilar returns top N similar entries by mood-tag overlap, with Redis caching.
func GetSimilar(c *gin.Context, database *sql.DB, redisClient *redis.Client) {
	entryID := c.Param("id")

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
