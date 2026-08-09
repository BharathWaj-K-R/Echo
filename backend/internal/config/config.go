// internal/config/config.go
package config

import "os"

type Config struct {
    GroqAPIKey  string
    GroqURL     string
    LLMModel    string
    PostgresDSN string
    RedisURL    string
    Port        string
}

func Load() Config {
    return Config{
        GroqAPIKey:  os.Getenv("GROQ_API_KEY"),
        GroqURL:     getEnv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"),
        LLMModel:    getEnv("LLM_MODEL", "mixtral-8x7b-32768"),
        PostgresDSN: os.Getenv("POSTGRES_DSN"),
        RedisURL:    os.Getenv("REDIS_URL"),
        Port:        getEnv("PORT", "8080"),
    }
}

func getEnv(key, fallback string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return fallback
}
