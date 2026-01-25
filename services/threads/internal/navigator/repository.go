package navigator

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NavigatorRepository interface {
	Create(ctx context.Context, navigator *Navigator) (*Navigator, error)
	GetByChatID(ctx context.Context, chatID string) (*Navigator, error)
}

type PostgresNavigatorRepository struct {
	db *pgxpool.Pool
}

func NewPostgresNavigatorRepository(db *pgxpool.Pool) *PostgresNavigatorRepository {
	return &PostgresNavigatorRepository{db: db}
}

func (r *PostgresNavigatorRepository) Create(ctx context.Context, navigator *Navigator) (*Navigator, error) {
	query := `INSERT INTO "Navigator" (id, "chatId", "chatTitle", "updatedAt") VALUES ($1, $2, $3, $4) RETURNING *`
	_, err := r.db.Exec(ctx, query, navigator.ID, navigator.ChatID, navigator.ChatTitle, navigator.UpdatedAt)
	if err != nil {
		fmt.Println("error creating navigator:", err)
		return nil, err
	}

	fmt.Println("navigator created:", navigator)
	return navigator, nil
}

func (r *PostgresNavigatorRepository) GetByChatID(ctx context.Context, chatID string) (*Navigator, error) {
	query := `SELECT * FROM "Navigator" WHERE "chatId" = $1 LIMIT 1`
	rows, err := r.db.Query(ctx, query, chatID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	navigator, err := pgx.CollectRows(rows, pgx.RowToStructByName[Navigator])
	if err != nil {
		return nil, err
	}

	// Check if any rows were returned
	if len(navigator) == 0 {
		return nil, fmt.Errorf("navigator not found for chatId: %s", chatID)
	}

	return &navigator[0], nil
}

func (r *PostgresNavigatorRepository) CreateTurn(ctx context.Context, navigatorID string, turn *Turn) (*Turn, error) {
	query := `INSERT INTO turns (id, navigator_id, question, response, sections, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
	_, err := r.db.Exec(ctx, query, turn.ID, navigatorID, turn.Question, turn.Response, turn.Sections, turn.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return turn, nil
}
