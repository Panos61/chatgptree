package navigator

import (
	"threads/internal/threads"
	"time"
)

type Navigator struct {
	ID        string `json:"id"`
	ChatID    string `json:"chatId"`
	ChatTitle string `json:"chatTitle"`
	// Turns     []Turn    `json:"turns,omitempty"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Turn struct {
	ID        string           `json:"id"`
	Question  string           `json:"userMessage"`
	Response  string           `json:"assistantMessage"`
	Threads   []threads.Thread `json:"threads"`
	Sections  []Section        `json:"sections"`
	UpdatedAt time.Time        `json:"updated_at"`
}

type Section struct {
	ID        string    `json:"id"`
	Label     string    `json:"label"`
	Anchor    string    `json:"anchor"`
	Level     int       `json:"level"`
	Order     int       `json:"order"`
	ParentID  *string   `json:"parent_id"`
	UpdatedAt time.Time `json:"updated_at"`
}
