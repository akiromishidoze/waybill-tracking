package config

import (
	"os"
	"strings"
)

type Config struct {
	Port            string
	DatabaseURL     string
	RedisURL        string
	KafkaBrokers    string
	JWTSecret       string
	TwilioSID       string
	TwilioAuthToken string
	SendGridKey     string
	AllowedOrigins  []string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/waybill?sslmode=disable"),
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379/0"),
		KafkaBrokers:    getEnv("KAFKA_BROKERS", "localhost:9092"),
		JWTSecret:       getEnv("JWT_SECRET", "change-me-in-production"),
		TwilioSID:       getEnv("TWILIO_SID", ""),
		TwilioAuthToken: getEnv("TWILIO_AUTH_TOKEN", ""),
		SendGridKey:     getEnv("SENDGRID_KEY", ""),
		AllowedOrigins:  getEnvSlice("ALLOWED_ORIGINS", "http://localhost:3010"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvSlice(key, fallback string) []string {
	v := os.Getenv(key)
	if v == "" {
		return []string{fallback}
	}
	return strings.Split(v, ",")
}
