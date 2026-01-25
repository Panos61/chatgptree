package navigator

import (
	"bytes"
	"regexp"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/text"
)

func ExtractSections(response string) ([]Section, error) {
	mdParser := goldmark.New(goldmark.WithParserOptions(parser.WithAutoHeadingID()))
	reader := text.NewReader([]byte(response))
	doc := mdParser.Parser().Parse(reader)

	var sections []Section

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

		text := extractText(response, heading)

		sections = append(sections, Section{
			Label: cleanHeaderTitle(text),
			Level: heading.Level,
		})

		return ast.WalkContinue, nil
	})

	return sections, nil
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
