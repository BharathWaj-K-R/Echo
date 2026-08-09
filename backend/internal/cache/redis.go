package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

// GetCached retrieves raw JSON bytes from Redis cache for the given entry ID.
func GetCached(entryID string, client *redis.Client) ([]byte, bool) {
	ctx := context.Background()
	data, err := client.Get(ctx, cacheKey(entryID)).Bytes()
	if err != nil {
		return nil, false
	}
	return data, true
}

// SetCached stores any value as JSON in Redis with a 1-hour TTL.
func SetCached(entryID string, client *redis.Client, value interface{}) error {
	ctx := context.Background()
	payload, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return client.Set(ctx, cacheKey(entryID), payload, time.Hour).Err()
}

func cacheKey(entryID string) string {
	return "similar:" + entryID
}
