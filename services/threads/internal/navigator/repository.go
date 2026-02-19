package navigator

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NavigatorRepository interface {
	GetByChatID(ctx context.Context, chatID string) (*Navigator, []NavEntry, error)
	Create(ctx context.Context, navigator *Navigator) (*Navigator, error)
	AddNavEntry(ctx context.Context, navigatorID string, entry *NavEntry) (*NavEntry, error)
	AddNavSections(ctx context.Context, sections []NavSection) ([]NavSection, error)
}

type PostgresNavigatorRepository struct {
	db *pgxpool.Pool
}

func NewPostgresNavigatorRepository(db *pgxpool.Pool) *PostgresNavigatorRepository {
	return &PostgresNavigatorRepository{db: db}
}

func (r *PostgresNavigatorRepository) GetByChatID(ctx context.Context, chatID string) (*Navigator, []NavEntry, error) {
	navQuery := `
		SELECT id, chat_id, chat_title, updated_at
		FROM navigator
		WHERE chat_id = $1
		LIMIT 1
	`

	navRows, err := r.db.Query(ctx, navQuery, chatID)
	if err != nil {
		return nil, nil, err
	}
	defer navRows.Close()

	navigatorSlice, err := pgx.CollectRows(navRows, pgx.RowToStructByName[Navigator])
	if err != nil {
		return nil, nil, err
	}

	if len(navigatorSlice) == 0 {
		return nil, nil, fmt.Errorf("navigator not found for chatId: %s", chatID)
	}
	navigator := navigatorSlice[0]

	entriesQuery := `
		SELECT id, navigator_id, chat_id, assistant_message_id, user_message_id,
		       label, anchor, order_index, created_at, updated_at
		FROM navigator_entries
		WHERE navigator_id = $1
		ORDER BY order_index
	`

	entryRows, err := r.db.Query(ctx, entriesQuery, navigator.ID)
	if err != nil {
		return nil, nil, err
	}
	defer entryRows.Close()

	entries, err := pgx.CollectRows(entryRows, pgx.RowToStructByName[NavEntry])
	if err != nil {
		return nil, nil, err
	}

	sectionsQuery := `
		SELECT id, navigator_id, parent_id, assistant_message_id, label, anchor, level, order_index, created_at, updated_at
		FROM navigator_sections
		WHERE navigator_id = $1
		ORDER BY assistant_message_id, order_index
	`

	sectionRows, err := r.db.Query(ctx, sectionsQuery, navigator.ID)
	if err != nil {
		return nil, nil, err
	}
	defer sectionRows.Close()

	sections, err := pgx.CollectRows(sectionRows, pgx.RowToStructByName[NavSection])
	if err != nil {
		return nil, nil, err
	}

	sectionsByMessageID := make(map[string][]NavSection)
	for _, section := range sections {
		sectionsByMessageID[section.AssistantMessageID] = append(
			sectionsByMessageID[section.AssistantMessageID],
			section,
		)
	}

	for i := range entries {
		if sections, ok := sectionsByMessageID[entries[i].AssistantMessageID]; ok {
			entries[i].Sections = sections
		} else {
			entries[i].Sections = []NavSection{}
		}
	}

	return &navigator, entries, nil
}

func (r *PostgresNavigatorRepository) Create(ctx context.Context, navigator *Navigator) (*Navigator, error) {
	query := `INSERT INTO navigator (id, chat_id, chat_title, updated_at) VALUES ($1, $2, $3, $4) RETURNING *`
	_, err := r.db.Exec(ctx, query, navigator.ID, navigator.ChatID, navigator.ChatTitle, navigator.UpdatedAt)
	if err != nil {
		fmt.Println("error creating navigator:", err)
		return nil, err
	}

	return navigator, nil
}

func (r *PostgresNavigatorRepository) AddNavEntry(ctx context.Context, navigatorID string, entry *NavEntry) (*NavEntry, error) {
	query := `INSERT INTO navigator_entries (id, navigator_id, chat_id, assistant_message_id, user_message_id, label, anchor, order_index, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`

	_, err := r.db.Exec(ctx, query, entry.ID, navigatorID, entry.ChatID, entry.AssistantMessageID, entry.UserMessageID, entry.Label, entry.Anchor, entry.OrderIndex, entry.CreatedAt, entry.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return entry, nil
}

func (r *PostgresNavigatorRepository) AddNavSections(ctx context.Context, sections []NavSection) ([]NavSection, error) {
	batch := &pgx.Batch{}
	query := `INSERT INTO navigator_sections (id, navigator_id, parent_id, assistant_message_id, label, anchor, level, order_index, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`

	for _, section := range sections {
		batch.Queue(query, section.ID, section.NavigatorID, section.ParentID, section.AssistantMessageID, section.Label, section.Anchor, section.Level, section.OrderIndex, section.CreatedAt, section.UpdatedAt)
	}

	br := r.db.SendBatch(ctx, batch)
	defer br.Close()

	for range sections {
		_, err := br.Exec()
		if err != nil {
			return nil, err
		}
	}

	return sections, nil
}
