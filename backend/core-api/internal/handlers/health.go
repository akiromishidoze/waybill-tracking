package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
	es "github.com/waybill-tracking/core-api/internal/elastic"
)

type HealthHandler struct {
	db *pgxpool.Pool
	rdb *redis.Client
	broker string
	es *es.Client
}

func NewHealthHandler(db *pgxpool.Pool, rdb *redis.Client, broker string, ec *es.Client) *HealthHandler {
	return &HealthHandler{db: db, rdb: rdb, broker: broker, es: ec}
}

func (h *HealthHandler) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	status := http.StatusOK
	checks := gin.H{}

	if err := h.db.Ping(ctx); err != nil {
		checks["database"] = gin.H{"status": "down", "error": err.Error()}
		status = http.StatusServiceUnavailable
	} else {
		checks["database"] = gin.H{"status": "up"}
	}

	if err := h.rdb.Ping(ctx).Err(); err != nil {
		checks["redis"] = gin.H{"status": "down", "error": err.Error()}
		status = http.StatusServiceUnavailable
	} else {
		checks["redis"] = gin.H{"status": "up"}
	}

	brokers := strings.Split(h.broker, ",")
	kafkaUp := false
	var lastErr error
	for _, b := range brokers {
		b = strings.TrimSpace(b)
		if b == "" {
			continue
		}

		conn, err := kafka.Dial("tcp", b)
		if err != nil {
			lastErr = err
			continue
		}

		conn.Close()
		kafkaUp = true
		break
	}

	if kafkaUp {
		checks["kafka"] = gin.H{"status": "up"}
	} else {
		checks["kafka"] = gin.H{"status": "down", "error": lastErr.Error()}
		status = http.StatusServiceUnavailable
	}

	if err := h.es.Ping(ctx); err != nil {
		checks["elasticsearch"] = gin.H{"status": "down", "error": err.Error()}
		status = http.StatusServiceUnavailable
	} else {
		checks["elasticsearch"] = gin.H{"status": "up"}
	}

	checks["status"] = "ok"

	if status != http.StatusOK {
		checks["status"] = "degraded"
	}

	c.JSON(status, checks)
}