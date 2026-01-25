package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"threads/internal/navigator"
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

	// fmt.Printf("responseText: %+v\n", bodyReq.ResponseText)

	turn := &navigator.Turn{
		Question: bodyReq.Question,
		Response: bodyReq.Response,
	}

	// fmt.Printf("turn: %+v\n", turn)

	test, err := navigator.ApplyTurn(bodyReq.Response, turn)
	// if err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("OK: %+v", test)))
}
