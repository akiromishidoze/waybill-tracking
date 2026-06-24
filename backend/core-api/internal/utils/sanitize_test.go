package utils

import (
	"strings"
	"testing"
)

func TestSanitizeSearchTerm(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"  hello  ", "hello"},
		{"%wildcard", "\\%wildcard"},
		{"_underscore", "\\_underscore"},
		{"mixed%_term", "mixed\\%\\_term"},
		{strings.Repeat("a", 120), strings.Repeat("a", 100)},
	}

	for _, c := range cases {
		got := SanitizeSearchTerm(c.input)
		if got != c.expected {
			t.Errorf("SanitizeSearchTerm(%q) = %q, want %q", c.input, got, c.expected)
		}
	}
}

func TestValidateFileName(t *testing.T) {
	cases := []struct {
		name  string
		valid bool
	}{
		{"document.pdf", true},
		{"image_2.png", true},
		{"archive.zip", true},
		{"../etc/passwd", false},
		{"", false},
		{"a/b/c.txt", false},
		{strings.Repeat("a", 260), false},
		{"file@name.txt", false},
	}

	for _, c := range cases {
		err := ValidateFileName(c.name)
		if c.valid && err != nil {
			t.Errorf("ValidateFileName(%q) expected valid, got error: %v", c.name, err)
		}
		if !c.valid && err == nil {
			t.Errorf("ValidateFileName(%q) expected invalid, got nil", c.name)
		}
	}
}

func TestValidateFileType(t *testing.T) {
	cases := []struct {
		fileType string
		valid    bool
	}{
		{"image/png", true},
		{"application/pdf", true},
		{"text/plain", true},
		{"application/x-msdownload", false},
		{"", false},
		{"IMAGE/JPEG", true},
	}

	for _, c := range cases {
		err := ValidateFileType(c.fileType)
		if c.valid && err != nil {
			t.Errorf("ValidateFileType(%q) expected valid, got error: %v", c.fileType, err)
		}
		if !c.valid && err == nil {
			t.Errorf("ValidateFileType(%q) expected invalid, got nil", c.fileType)
		}
	}
}

func TestValidateFileSize(t *testing.T) {
	if err := ValidateFileSize(1024, 10*1024*1024); err != nil {
		t.Errorf("expected valid size, got error: %v", err)
	}
	if err := ValidateFileSize(0, 10*1024*1024); err == nil {
		t.Errorf("expected error for zero size")
	}
	if err := ValidateFileSize(10*1024*1024+1, 10*1024*1024); err == nil {
		t.Errorf("expected error for oversized file")
	}
}
