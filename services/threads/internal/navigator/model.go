package navigator

import (
	"time"
)

type Navigator struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chatId"`
	ChatTitle string    `json:"chatTitle"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type NavEntry struct {
	ID                 string       `json:"id"`
	NavigatorID        string       `json:"navigatorId"`
	ChatID             string       `json:"chatId"`
	AssistantMessageID string       `json:"assistantMessageId"`
	UserMessageID      string       `json:"userMessageId"`
	Label              string       `json:"label"`
	Anchor             string       `json:"anchor,omitempty"`
	OrderIndex         int          `json:"orderIndex,omitempty"`
	CreatedAt          time.Time    `json:"createdAt"`
	UpdatedAt          time.Time    `json:"updatedAt"`
	Sections           []NavSection `json:"sections,omitempty" db:"-"`
}

type NavSection struct {
	ID                 string    `json:"id"`
	NavigatorID        string    `json:"navigatorId"`
	ParentID           *string   `json:"parentId,omitempty"`
	AssistantMessageID string    `json:"assistantMessageId"`
	Label              string    `json:"label"`
	Anchor             string    `json:"anchor"`
	Level              int       `json:"level"`
	OrderIndex         int       `json:"orderIndex"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}
