package api

import (
	"threads/internal/api/handlers"
	"threads/internal/navigator"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	NavigatorHandler *handlers.NavigatorHandler
}

func NewApp(db *pgxpool.Pool) *App {
	navRepo := navigator.NewPostgresNavigatorRepository(db)
	navService := navigator.NewNavigatorService(navRepo)
	navHandler := handlers.NewNavigatorHandler(navService)

	return &App{
		NavigatorHandler: navHandler,
	}
}
