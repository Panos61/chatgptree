package api

import (
	"net/http"
	"threads/internal/api/handlers"
	"threads/internal/api/middleware"
)

func InitializeRoutes(app *App) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/threads/append", handlers.AppendResponse)
	mux.Handle("/navigator", middleware.CorsMiddleware(http.HandlerFunc(app.NavigatorHandler.Create)))
	mux.Handle("/navigator/{id}", middleware.CorsMiddleware(http.HandlerFunc(app.NavigatorHandler.GetByChatID)))

	return mux
}
