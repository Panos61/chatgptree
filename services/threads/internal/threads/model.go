package threads

import "time"

type Thread struct {
	ID             string    `json:"id"`
	ParentThreadID string    `json:"parent_thread_id"`
	Question       string    `json:"question"`
	Answer         string    `json:"answer"`
	UpdatedAt      time.Time `json:"updated_at"`
}
