// internal/groq/client.go
package groq

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

type SentimentResult struct {
    Score int      `json:"sentiment_score"`
    Tags  []string `json:"mood_tags"`
}

// ExtractMood calls the Groq API with a prompt that asks for a JSON response
// containing a sentiment_score (0‑100) and an array of mood_tags.
func ExtractMood(ctx context.Context, transcript string) (SentimentResult, error) {
    prompt := fmt.Sprintf(`Extract mood from journal entry. Return JSON only.
Entry: "%s"
{"sentiment_score": 0-100, "mood_tags": ["tag1", "tag2"]}`, transcript)

    payload := map[string]interface{}{
        "model": os.Getenv("LLM_MODEL"),
        "messages": []map[string]string{{"role": "user", "content": prompt}},
        "max_tokens": 150,
        "temperature": 0.3,
    }

    body, _ := json.Marshal(payload)
    req, _ := http.NewRequestWithContext(ctx, "POST", os.Getenv("GROQ_API_URL"), bytes.NewReader(body))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        // On any transport error fall back to a neutral mood.
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

    var result SentimentResult
    if err := json.Unmarshal([]byte(apiResp.Choices[0].Message.Content), &result); err != nil {
        return SentimentResult{Score: 50, Tags: []string{"neutral"}}, nil
    }
    return result, nil
}
