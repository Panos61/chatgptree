package api

import (
	"net/http"
	"threads/internal/api/middleware"
)

func InitializeRoutes(app *App) *http.ServeMux {
	mux := http.NewServeMux()

	mux.Handle("/navigator", middleware.CorsMiddleware(http.HandlerFunc(app.NavigatorHandler.Create)))
	mux.Handle("/navigator/by-chat/{chatId}", middleware.CorsMiddleware(http.HandlerFunc(app.NavigatorHandler.GetByChatID)))
	mux.Handle("/navigator/id/{chatId}/entries", middleware.CorsMiddleware(http.HandlerFunc(app.NavigatorHandler.AddEntry)))

	return mux
}
