package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"

	"echo/internal/api"
	"echo/internal/config"
	"echo/internal/poller"
)

func runMigrations(db *sql.DB) {
	schema, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Fatalf("failed to read schema.sql: %v", err)
	}
	if _, err := db.Exec(string(schema)); err != nil {
		log.Fatalf("schema migration failed: %v", err)
	}
	log.Println("schema migration complete")
}

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("db connection error: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("db ping error: %v", err)
	}

	runMigrations(db)

	// Parse Redis URL properly (handles redis://host:port format)
	var redisClient *redis.Client
	if strings.HasPrefix(cfg.RedisURL, "redis://") {
		opts, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			log.Fatalf("redis url parse error: %v", err)
		}
		redisClient = redis.NewClient(opts)
	} else {
		redisClient = redis.NewClient(&redis.Options{Addr: cfg.RedisURL})
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	router.POST("/entries", func(c *gin.Context) { api.CreateEntry(c, db) })
	router.GET("/entries", func(c *gin.Context) { api.ListEntries(c, db) })
	router.GET("/entries/:id/similar", func(c *gin.Context) { api.GetSimilar(c, db, redisClient) })
	router.GET("/health", api.Health)

	// Serve all static files from frontend/dist
	router.Static("/assets", "./frontend/dist/assets")
	router.StaticFile("/favicon.svg", "./frontend/dist/favicon.svg")
	router.StaticFile("/favicon.ico", "./frontend/dist/favicon.svg") // redirect .ico requests to svg
	router.StaticFile("/robots.txt", "./frontend/dist/robots.txt")

	// SPA router fallback — everything else gets index.html except API routes
	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		// Never serve index.html for API or asset paths
		if strings.HasPrefix(path, "/entries") ||
			strings.HasPrefix(path, "/assets") ||
			path == "/health" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not Found"})
			return
		}
		c.File("./frontend/dist/index.html")
	})

	go poller.StartPoller(context.Background(), db)

	log.Printf("Echo server starting on :%s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
