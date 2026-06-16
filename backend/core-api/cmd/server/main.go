package main

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	es "github.com/waybill-tracking/core-api/internal/elastic"
	"github.com/waybill-tracking/core-api/internal/migrator"
	"github.com/waybill-tracking/core-api/internal/handlers"
	kafkaprod "github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/middleware"
	"github.com/waybill-tracking/core-api/internal/repository"
	wh "github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

func main() {
	cfg := config.Load()

	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	m := migrator.New(db, cfg.MigrationsDir)
	if err := m.Run(context.Background()); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("failed to parse redis url: %v", err)
	}
	rdb := redis.NewClient(redisOpts)

	redisCtx, redisCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer redisCancel()
	if err := rdb.Ping(redisCtx).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	esClient := es.NewClient(cfg.ElasticsearchURL)
	if err := esClient.Ping(context.Background()); err != nil {
		log.Printf("elasticsearch not reachable: %v", err)
	}

	kafkaProducer := kafkaprod.NewProducer(cfg.KafkaBrokers, cfg.KafkaTopic)
	defer kafkaProducer.Close()

	wsHub := ws.NewHub()

	waybillRepo := repository.NewWaybillRepository(db, rdb)
	webhookRepo := repository.NewWebhookRepository(db)
	webhookDispatcher := wh.NewDispatcher(webhookRepo)
	waybillHandler := handlers.NewWaybillHandler(waybillRepo, kafkaProducer, wsHub, esClient, webhookDispatcher)
	courierHandler := handlers.NewCourierHandler(waybillRepo)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo)
	webhookHandler := handlers.NewWebhookHandler(webhookRepo)
	healthHandler := handlers.NewHealthHandler(db, rdb, cfg.KafkaBrokers, esClient)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowed := false
		for _, o := range cfg.AllowedOrigins {
			if o == origin || o == "*" {
				allowed = true
				break
			}
		}
		if allowed && origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	authLimit := middleware.RateLimitMiddleware(rdb, 20, time.Minute)

	api := r.Group("/api")
	{
		api.POST("/auth/login", authLimit, handlers.LoginHandler(cfg.JWTSecret, db))
		api.POST("/auth/register", authLimit, handlers.RegisterHandler(cfg.JWTSecret, db))

		public := api.Group("")
		public.GET("/track/:trackingNumber", waybillHandler.Track)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret, cfg.JWTSecretOld))
		{
			protected.GET("/auth/me", handlers.MeHandler(db))
			protected.GET("/waybills", waybillHandler.List)
			protected.GET("/waybills/:id", waybillHandler.Get)
			protected.POST("/waybills", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), waybillHandler.Create)
			protected.PATCH("/waybills/:id/status", waybillHandler.UpdateStatus)

			courier := protected.Group("/courier")
			courier.Use(middleware.RoleMiddleware("COURIER", "ADMIN"))
			{
				courier.GET("/assignments", courierHandler.GetAssignments)
				courier.POST("/scan", courierHandler.Scan)
			}

			protected.GET("/webhooks", webhookHandler.List)
			protected.POST("/webhooks", webhookHandler.Create)
			protected.PATCH("/webhooks/:id", webhookHandler.Update)
			protected.DELETE("/webhooks/:id", webhookHandler.Delete)
		}
	}

	r.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleWebSocket(c.Writer, c.Request)
	})

	r.GET("/health", healthHandler.Check)

	log.Printf("Core API starting on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}