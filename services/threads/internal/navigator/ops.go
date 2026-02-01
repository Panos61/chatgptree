package navigator

import (
	"bytes"
	"regexp"

	"github.com/google/uuid"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

func ExtractSections(response string, navigatorID string, assistantMessageID string) ([]NavSection, string, error) {
	mdParser := goldmark.New()
	reader := text.NewReader([]byte(response))
	doc := mdParser.Parser().Parse(reader)

	var (
		sections   []NavSection
		orderIndex = 0
		lastH2ID   *string
		parentID   *string
		entryLabel string
		gotLabel   bool
	)

	ast.Walk(doc, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		heading, ok := node.(*ast.Heading)
		if !ok {
			return ast.WalkContinue, nil
		}

		if heading.Level < 2 || heading.Level > 3 {
			return ast.WalkContinue, nil
		}

		raw := extractText(response, heading)
		sectionID := uuid.New().String()
		anchor := "a--" + assistantMessageID
		label := cleanHeaderTitle(raw)
		orderIndex++

		if !gotLabel && (heading.Level == 1 || heading.Level == 2) && label != "" {
			entryLabel = label
			gotLabel = true

			if heading.Level == 2 {
				synthetic := uuid.New().String()
				lastH2ID = &synthetic
			}
			return ast.WalkContinue, nil
		}

		if entryLabel != "" {
			switch heading.Level {
			case 2:
				id := sectionID
				lastH2ID = &id
				parentID = nil
			case 3:
				parentID = lastH2ID
			}

			sections = append(sections, NavSection{
				ID:                 sectionID,
				NavigatorID:        navigatorID,
				ParentID:           parentID,
				AssistantMessageID: assistantMessageID,
				Label:              label,
				Anchor:             anchor,
				Level:              heading.Level,
				OrderIndex:         orderIndex,
			})
		}

		return ast.WalkContinue, nil
	})

	return sections, entryLabel, nil
}

func extractText(source string, n ast.Node) string {
	var buf bytes.Buffer
	sourceBytes := []byte(source)

	ast.Walk(n, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering {
			if t, ok := node.(*ast.Text); ok {
				buf.Write(t.Segment.Value(sourceBytes))
			}
		}
		return ast.WalkContinue, nil
	})

	return string(bytes.TrimSpace(buf.Bytes()))
}

var numberPrefix = regexp.MustCompile(`^\d+\.\s*`)

func cleanHeaderTitle(s string) string {
	return numberPrefix.ReplaceAllString(s, "")
}
