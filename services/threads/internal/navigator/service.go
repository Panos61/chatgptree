package navigator

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type NavigatorService struct {
	navigatorRepo NavigatorRepository
}

func NewNavigatorService(navigatorRepo NavigatorRepository) *NavigatorService {
	return &NavigatorService{navigatorRepo: navigatorRepo}
}

func (s *NavigatorService) Create(ctx context.Context, chatID string, chatTitle string) (*Navigator, error) {
	// navigator, err := s.navigatorRepo.GetByChatID(ctx, chatID)
	// if err != nil {
	// 	return nil, err
	// }

	// if navigator != nil {
	// 	return nil, errors.New("navigator already exists")
	// }

	newNavigator := &Navigator{
		ID:        uuid.New().String(),
		ChatTitle: chatTitle,
		ChatID:    chatID,
		// Turns:     []Turn{},
		UpdatedAt: time.Now(),
	}

	return s.navigatorRepo.Create(ctx, newNavigator)
}

func (s *NavigatorService) GetByChatID(ctx context.Context, chatID string) (*Navigator, error) {
	navigator, err := s.navigatorRepo.GetByChatID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	return navigator, nil
}

func Update(navigator *Navigator) (*Navigator, error) {
	updatedNavigator := &Navigator{
		ID:        navigator.ID,
		ChatTitle: navigator.ChatTitle,
		// Turns:     navigator.Turns,
		UpdatedAt: time.Now(),
	}

	return updatedNavigator, nil
}

func ApplyTurn(response string, turn *Turn) (*Turn, error) {
	extractedSections, err := ExtractSections(response)
	if err != nil {
		fmt.Printf("error extracting sections: %+v\n", err)
		return nil, err
	}

	if len(extractedSections) == 0 {
		return nil, errors.New("no sections applied")
	}

	turn = &Turn{
		ID:        uuid.New().String(),
		Sections:  extractedSections,
		UpdatedAt: time.Now(),
		Question:  turn.Question,
		Response:  turn.Response,
		Threads:   turn.Threads,
	}

	return turn, nil
}
