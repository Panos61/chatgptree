package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"threads/internal/navigator"
)

type NavigatorHandler struct {
	service *navigator.NavigatorService
}

func NewNavigatorHandler(s *navigator.NavigatorService) *NavigatorHandler {
	return &NavigatorHandler{service: s}
}

func (h *NavigatorHandler) GetByChatID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("chatId")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	navigator, entries, err := h.service.GetByChatID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(map[string]any{
		"navigator": navigator,
		"entries":   entries,
	}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (h *NavigatorHandler) Create(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var bodyReq struct {
		ChatID             string `json:"chatId"`
		ChatTitle          string `json:"chatTitle"`
		UserMessageID      string `json:"userMessageId"`
		AssistantMessageID string `json:"assistantMessageId"`
		AssistantMessage   string `json:"assistantMessage"`
	}

	if err := json.Unmarshal(body, &bodyReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = h.service.Create(r.Context(), bodyReq.ChatID, bodyReq.ChatTitle)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	navigatorData, _, err := h.service.GetByChatID(r.Context(), bodyReq.ChatID)
	if err != nil {
		http.Error(w, "Navigator not found", http.StatusNotFound)
		return
	}

	entry := &navigator.NavEntry{
		ChatID:             bodyReq.ChatID,
		NavigatorID:        navigatorData.ID,
		UserMessageID:      bodyReq.UserMessageID,
		AssistantMessageID: bodyReq.AssistantMessageID,
	}

	_, err = h.service.AddNavEntry(r.Context(), entry, bodyReq.AssistantMessage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
}

func (h *NavigatorHandler) AddEntry(w http.ResponseWriter, r *http.Request) {
	chatId := r.PathValue("chatId")
	if chatId == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var bodyReq struct {
		ChatID             string `json:"chatId"`
		AssistantMessageID string `json:"assistantMessageId"`
		UserMessageID      string `json:"userMessageId"`
		AssistantMessage   string `json:"assistantMessage"`
	}

	if err := json.Unmarshal(body, &bodyReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	navigatorData, _, err := h.service.GetByChatID(r.Context(), chatId)
	if err != nil {
		http.Error(w, "Navigator not found", http.StatusNotFound)
		return
	}

	_, err = h.service.AddNavEntry(r.Context(), &navigator.NavEntry{
		ChatID:             bodyReq.ChatID,
		NavigatorID:        navigatorData.ID,
		AssistantMessageID: bodyReq.AssistantMessageID,
		UserMessageID:      bodyReq.UserMessageID,
	}, bodyReq.AssistantMessage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
}
