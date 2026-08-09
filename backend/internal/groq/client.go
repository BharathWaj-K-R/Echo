// internal/groq/client.go
package groq

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"
)

type SentimentResult struct {
	Score int      `json:"sentiment_score"`
	Tags  []string `json:"mood_tags"`
}

// Transcribe sends audio bytes to Groq Whisper and returns the transcript.
func Transcribe(ctx context.Context, audioData []byte, mimeType string) (string, error) {
	// Determine file extension from mime type
	ext := "webm"
	if strings.Contains(mimeType, "mp4") {
		ext = "mp4"
	} else if strings.Contains(mimeType, "ogg") {
		ext = "ogg"
	} else if strings.Contains(mimeType, "wav") {
		ext = "wav"
	} else if strings.Contains(mimeType, "mp3") || strings.Contains(mimeType, "mpeg") {
		ext = "mp3"
	}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)

	// Add model field
	_ = w.WriteField("model", "whisper-large-v3-turbo")

	// Add audio file
	fw, err := w.CreateFormFile("file", "audio."+ext)
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(fw, bytes.NewReader(audioData)); err != nil {
		return "", fmt.Errorf("copy audio: %w", err)
	}
	w.Close()

	apiURL := "https://api.groq.com/openai/v1/audio/transcriptions"
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, &buf)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
	req.Header.Set("Content-Type", w.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("whisper request: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode whisper response: %w", err)
	}
	if result.Text == "" {
		return "", fmt.Errorf("whisper returned empty transcript")
	}
	return strings.TrimSpace(result.Text), nil
}

// ExtractMood calls the Groq chat API and returns sentiment_score + mood_tags.
func ExtractMood(ctx context.Context, transcript string) (SentimentResult, error) {
	prompt := fmt.Sprintf(`You are a mood analysis assistant. Analyze this journal entry and return ONLY a JSON object with no extra text.

Entry: "%s"

Return exactly this format:
{"sentiment_score": <number 0-100>, "mood_tags": ["<tag1>", "<tag2>"]}

Rules:
- sentiment_score: 0=very negative, 50=neutral, 100=very positive
- mood_tags: 2-4 short lowercase words describing the mood`, transcript)

	payload := map[string]interface{}{
		"model":       os.Getenv("LLM_MODEL"),
		"messages":    []map[string]string{{"role": "user", "content": prompt}},
		"max_tokens":  150,
		"temperature": 0.3,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequestWithContext(ctx, "POST", os.Getenv("GROQ_API_URL"), bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return SentimentResult{Score: 50, Tags: []string{"neutral"}}, nil
	}
	defer resp.Body.Close()

	var apiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return SentimentResult{Score: 50, Tags: []string{"neutral"}}, nil
	}
	if len(apiResp.Choices) == 0 {
		return SentimentResult{Score: 50, Tags: []string{"neutral"}}, nil
	}

	content := apiResp.Choices[0].Message.Content

	// Strip markdown code fences if present
	content = strings.TrimSpace(content)
	if strings.HasPrefix(content, "```") {
		lines := strings.Split(content, "\n")
		var inner []string
		for _, l := range lines {
			if strings.HasPrefix(l, "```") {
				continue
			}
			inner = append(inner, l)
		}
		content = strings.Join(inner, "\n")
	}

	var result SentimentResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return SentimentResult{Score: 50, Tags: []string{"neutral"}}, nil
	}
	if len(result.Tags) == 0 {
		result.Tags = []string{"neutral"}
	}
	return result, nil
}
