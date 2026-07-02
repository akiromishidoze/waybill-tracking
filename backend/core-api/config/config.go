package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	ElasticsearchURL      string
	ElasticsearchUsername string
	ElasticsearchPassword string
	KafkaBrokers     string
	KafkaTopic       string
	JWTSecret        string
	JWTSecretOld     string
	TwilioSID        string
	TwilioAuthToken  string
	SendGridKey      string
	AnalyticsAPIURL  string
	InternalAPIKey   string
	FrontendURL      string
	MigrationsDir    string
	AllowedOrigins   []string
	AdminEmail       string
	AdminPassword    string
	AdminName        string
}

func Load() *Config {
	jwtSecret := resolveJWTSecret()
	ginMode := getEnv("GIN_MODE", "debug")

	cfg := &Config{
		Port: getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/waybill?sslmode=disable"),
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379/0"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		ElasticsearchUsername: getEnv("ELASTICSEARCH_USERNAME", ""),
		ElasticsearchPassword: getEnv("ELASTICSEARCH_PASSWORD", ""),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "kafka:29092"),
		KafkaTopic: getEnv("KAFKA_TOPIC", "waybill-events"),
		JWTSecret: jwtSecret,
		JWTSecretOld: getEnv("JWT_SECRET_OLD", ""),
		MigrationsDir: getEnv("MIGRATIONS_DIR", "migrations"),
		TwilioSID: getEnv("TWILIO_SID", ""),
		TwilioAuthToken: getEnv("TWILIO_AUTH_TOKEN", ""),
		SendGridKey: getEnv("SENDGRID_KEY", ""),
		AnalyticsAPIURL: getEnv("ANALYTICS_API_URL", "http://localhost:8000"),
		InternalAPIKey: getEnv("INTERNAL_API_KEY", ""),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3010"),
		AllowedOrigins: getEnvSliceTrimmed("ALLOWED_ORIGINS", "http://localhost:3010"),
		AdminEmail: getEnv("ADMIN_EMAIL", "admin@waybilltrack.com"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "teccadmin00"),
		AdminName: getEnv("ADMIN_NAME", "Admin"),
	}

	if cfg.JWTSecret == "change-me-in-production" {
		fmt.Fprintln(os.Stderr, "FATAL: JWT_SECRET is set to the default placeholder. Set a strong secret before starting.")
		os.Exit(1)
	}

	if len(cfg.JWTSecret) < 32 {
		fmt.Fprintln(os.Stderr, "FATAL: JWT_SECRET must be at least 32 characters long.")
		os.Exit(1)
	}

	if ginMode == "release" {
		for _, o := range cfg.AllowedOrigins {
			if o == "*" {
				fmt.Fprintln(os.Stderr, "FATAL: ALLOWED_ORIGINS contains '*' which is forbidden in production (GIN_MODE=release). Set explicit trusted origins.")
				os.Exit(1)
			}
			if strings.HasPrefix(o, "http://localhost") {
				fmt.Fprintf(os.Stderr, "WARNING: ALLOWED_ORIGINS contains a localhost origin (%s) in production mode.\n", o)
			}
		}
	}

	return cfg
}

func resolveJWTSecret() string {
	if file := os.Getenv("JWT_SECRET_FILE"); file != "" {
		data, err := os.ReadFile(file)
		if err != nil {
			fmt.Fprintf(os.Stderr, "FATAL: failed to read JWT_SECRET_FILE %s: %v\n", file, err)
			os.Exit(1)
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

func getEnvSliceTrimmed(key, fallback string) []string {
	v := os.Getenv(key)
	if v == "" {
		return []string{fallback}
	}
	parts := strings.Split(v, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			result = append(result, t)
		}
	}
	return result
}