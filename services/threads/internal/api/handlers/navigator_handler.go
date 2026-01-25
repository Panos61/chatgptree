package handlers

import (
	"encoding/json"
	"fmt"
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

func (h *NavigatorHandler) Create(w http.ResponseWriter, r *http.Request) {
	fmt.Println("CreateNavigator handler called")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var bodyReq struct {
		ChatID    string `json:"chatId"`
		ChatTitle string `json:"chatTitle"`
	}

	if err := json.Unmarshal(body, &bodyReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// fmt.Printf("bodyReq: %+v\n", bodyReq)

	_, err = h.service.Create(r.Context(), bodyReq.ChatID, bodyReq.ChatTitle)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// fmt.Printf("navigator: %+v\n", newNavigator)

	w.WriteHeader(http.StatusOK)
}

func (h *NavigatorHandler) GetByChatID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	navigator, err := h.service.GetByChatID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(navigator); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Println("navigator GetByChatID", navigator)
}
