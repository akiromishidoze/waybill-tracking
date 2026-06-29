package utils

import (
	"regexp"
	"unicode"
)

// ValidatePassword checks that a password meets the security policy.
func ValidatePassword(password string) string {
	if len(password) < 8 {
		return "password must be at least 8 characters long"
	}

	hasUpper := false
	hasLower := false
	hasDigit := false
	for _, r := range password {
		if unicode.IsUpper(r) {
			hasUpper = true
		}
		if unicode.IsLower(r) {
			hasLower = true
		}
		if unicode.IsDigit(r) {
			hasDigit = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit {
		return "password must contain at least one uppercase letter, one lowercase letter, and one digit"
	}

	return ""
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func IsValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}
