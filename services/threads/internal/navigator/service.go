package navigator

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type NavigatorService struct {
	navigatorRepo NavigatorRepository
}

func NewNavigatorService(navigatorRepo NavigatorRepository) *NavigatorService {
	return &NavigatorService{navigatorRepo: navigatorRepo}
}

func (s *NavigatorService) GetByChatID(ctx context.Context, chatID string) (*Navigator, *[]NavEntry, error) {
	navigator, entries, err := s.navigatorRepo.GetByChatID(ctx, chatID)
	if err != nil {
		return nil, nil, err
	}

	return navigator, &entries, nil
}

func (s *NavigatorService) Create(ctx context.Context, chatID string, chatTitle string) (*Navigator, error) {
	navigator := &Navigator{
		ID:        uuid.New().String(),
		ChatID:    chatID,
		ChatTitle: chatTitle,
		UpdatedAt: time.Now(),
	}

	newNavigator, err := s.navigatorRepo.Create(ctx, navigator)
	if err != nil {
		return nil, err
	}

	return newNavigator, nil
}

func (s *NavigatorService) AddNavEntry(ctx context.Context, entry *NavEntry, assistantMessage string) (*NavEntry, error) {
	extractedSections, entryLabel, err := ExtractSections(assistantMessage, entry.NavigatorID, entry.AssistantMessageID)
	if err != nil {
		return nil, err
	}

	if len(extractedSections) == 0 {
		return nil, errors.New("no sections applied")
	}

	newEntry := &NavEntry{
		ID:                 uuid.New().String(),
		NavigatorID:        entry.NavigatorID,
		ChatID:             entry.ChatID,
		AssistantMessageID: entry.AssistantMessageID,
		UserMessageID:      entry.UserMessageID,
		Label:              entryLabel,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	_, err = s.navigatorRepo.AddNavEntry(ctx, entry.NavigatorID, newEntry)
	if err != nil {
		return nil, err
	}

	_, err = s.navigatorRepo.AddNavSections(ctx, extractedSections)
	if err != nil {
		return nil, err
	}

	return newEntry, nil
}
