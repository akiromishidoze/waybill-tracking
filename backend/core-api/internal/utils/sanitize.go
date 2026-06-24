package utils

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"application/pdf": true,
	"text/plain":      true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
}

var fileNamePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// SanitizeSearchTerm cleans a user-provided search term and escapes PostgreSQL LIKE wildcards.
func SanitizeSearchTerm(term string) string {
	term = strings.TrimSpace(term)
	if len(term) > 100 {
		term = term[:100]
	}
	term = strings.ReplaceAll(term, `%`, `\%`)
	term = strings.ReplaceAll(term, `_`, `\_`)
	return term
}

// ValidateFileName checks that a filename is safe (no path traversal, limited chars, reasonable length).
func ValidateFileName(name string) error {
	base := filepath.Base(name)
	if base == "" || base == "." || base == ".." {
		return fmt.Errorf("invalid file name")
	}
	if base != name {
		return fmt.Errorf("file name cannot contain path separators")
	}
	if len(base) > 255 {
		return fmt.Errorf("file name too long")
	}
	if !fileNamePattern.MatchString(base) {
		return fmt.Errorf("file name contains invalid characters")
	}
	return nil
}

// ValidateFileType checks whether the supplied MIME type is in the allowlist.
func ValidateFileType(fileType string) error {
	if fileType == "" {
		return fmt.Errorf("file type is required")
	}
	if !allowedMimeTypes[strings.ToLower(fileType)] {
		return fmt.Errorf("unsupported file type: %s", fileType)
	}
	return nil
}

// ValidateFileSize checks that the file size is within the allowed limit (maxBytes).
func ValidateFileSize(size, maxBytes int64) error {
	if size <= 0 {
		return fmt.Errorf("file size must be greater than zero")
	}
	if size > maxBytes {
		return fmt.Errorf("file size exceeds maximum allowed size of %d bytes", maxBytes)
	}
	return nil
}
