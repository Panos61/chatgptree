package main

import (
	"context"
	"log"
	"net/http"
	"threads/internal/api"
	"threads/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	config := config.LoadEnv()

	db, err := pgxpool.New(context.Background(), config.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to create database pool: %v", err)
	}
	defer db.Close()

	app := api.NewApp(db)
	mux := api.InitializeRoutes(app)

	log.Printf("Server listening on %s", config.Addr)
	log.Fatal(http.ListenAndServe(config.Addr, mux))
}
