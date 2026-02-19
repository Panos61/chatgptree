package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func AppendResponse(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var bodyReq struct {
		Question string `json:"userMessage"`
		Response string `json:"assistantMessage"`
	}

	if err := json.Unmarshal(body, &bodyReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("OK: %+v", "test")))
}
