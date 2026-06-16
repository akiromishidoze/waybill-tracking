package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	ElasticsearchURL string
	KafkaBrokers     string
	KafkaTopic       string
	JWTSecret        string
	JWTSecretOld     string
	TwilioSID        string
	TwilioAuthToken  string
	SendGridKey      string
	AllowedOrigins   []string
}

func Load() *Config {
	jwtSecret := resolveJWTSecret()

	cfg := &Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/waybill?sslmode=disable"),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379/0"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		KafkaBrokers:     getEnv("KAFKA_BROKERS", "localhost:9092"),
		KafkaTopic:       getEnv("KAFKA_TOPIC", "waybill-events"),
		JWTSecret:        jwtSecret,
		JWTSecretOld:     getEnv("JWT_SECRET_OLD", ""),
		TwilioSID:        getEnv("TWILIO_SID", ""),
		TwilioAuthToken:  getEnv("TWILIO_AUTH_TOKEN", ""),
		SendGridKey:      getEnv("SENDGRID_KEY", ""),
		AllowedOrigins:   getEnvSlice("ALLOWED_ORIGINS", "http://localhost:3010"),
	}

	if cfg.JWTSecret == "change-me-in-production" {
		log.Println("WARNING: JWT_SECRET is set to the default placeholder. Change it in production.")
	}

	return cfg
}

func resolveJWTSecret() string {
	if file := os.Getenv("JWT_SECRET_FILE"); file != "" {
		data, err := os.ReadFile(file)
		if err != nil {
			log.Fatalf("failed to read JWT_SECRET_FILE %s: %v", file, err)
		}
		return strings.TrimSpace(string(data))
	}
	return getEnv("JWT_SECRET", "change-me-in-production")
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
