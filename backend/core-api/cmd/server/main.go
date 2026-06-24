package main

import (
	"context"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	"github.com/waybill-tracking/core-api/internal/elastic"
	"github.com/waybill-tracking/core-api/internal/feature"
	"github.com/waybill-tracking/core-api/internal/handlers"
	kafkaprod "github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/middleware"
	"github.com/waybill-tracking/core-api/internal/migrator"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

func registerCoreAPIRoutes(api *gin.RouterGroup, cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, waybillHandler *handlers.WaybillHandler, attachmentHandler *handlers.AttachmentHandler, auditLogHandler *handlers.AuditLogHandler, auditLogger *repository.AuditLogger) {
	api.POST("/auth/login", middleware.RateLimitMiddleware(rdb, 10, 1*time.Minute), handlers.LoginHandler(cfg.JWTSecret, db, auditLogger))
	api.POST("/auth/register", middleware.RateLimitMiddleware(rdb, 5, 1*time.Minute), handlers.RegisterHandler(cfg.JWTSecret, db))
	api.POST("/auth/refresh", handlers.RefreshTokenHandler(cfg.JWTSecret, db))
	api.GET("/features", feature.Handler())

	public := api.Group("")
	public.GET("/track/:trackingNumber", waybillHandler.Track)
	public.GET("/exception-codes", waybillHandler.ListExceptionCodes)

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.GET("/auth/me", handlers.MeHandler(db))
		protected.GET("/waybills", waybillHandler.List)
		protected.GET("/waybills/:id", waybillHandler.Get)
		protected.POST("/waybills", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), waybillHandler.Create)
		protected.PATCH("/waybills/:id", waybillHandler.Update)
		protected.PATCH("/waybills/:id/status", waybillHandler.UpdateStatus)
		protected.DELETE("/waybills/:id", middleware.RoleMiddleware("OPS", "ADMIN"), waybillHandler.Delete)
		protected.GET("/waybills/:waybillId/attachments", attachmentHandler.List)
		protected.POST("/waybills/:waybillId/attachments", attachmentHandler.Upload)
		protected.GET("/attachments/:attachmentId", attachmentHandler.Get)
		protected.DELETE("/attachments/:attachmentId", attachmentHandler.Delete)

		admin := protected.Group("")
		admin.Use(middleware.RoleMiddleware("ADMIN"))
		{
			admin.GET("/users", handlers.ListUsersHandler(db))
			admin.PATCH("/users/:id/role", handlers.UpdateUserRoleHandler(db))
			admin.POST("/auth/reset-password", handlers.ResetPasswordHandler(db))
			admin.GET("/audit-logs", auditLogHandler.List)
		}
	}
}

func main() {
	cfg := config.Load()

	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	migrationsDir := filepath.Join("migrations")
	if err := migrator.New(db, migrationsDir).Run(context.Background()); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	kafkaProducer := kafkaprod.NewProducer(cfg.KafkaBrokers)
	defer kafkaProducer.Close()

	wsHub := ws.NewHub()
	esClient := elastic.NewClient(cfg.ElasticsearchURL)
	webhookRepo := repository.NewWebhookRepository(db)
	webhookDispatcher := webhook.NewDispatcher(webhookRepo)

	auditLogRepo := repository.NewAuditLogRepository(db)
	auditLogger := repository.NewAuditLogger(auditLogRepo)
	auditLogHandler := handlers.NewAuditLogHandler(auditLogRepo)

	waybillRepo := repository.NewWaybillRepository(db, rdb)
	waybillHandler := handlers.NewWaybillHandler(waybillRepo, kafkaProducer, wsHub, esClient, webhookDispatcher, auditLogger)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo, cfg.JWTSecret)
	attachmentHandler := handlers.NewAttachmentHandler(db)
	healthHandler := handlers.NewHealthHandler(db, rdb, cfg.KafkaBrokers, esClient)

	feature.RegisterAll(feature.DefaultFlags)

	r := gin.Default()

	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))
	r.Use(middleware.Gzip())

	registerCoreAPIRoutes(r.Group("/api"), cfg, db, rdb, waybillHandler, attachmentHandler, auditLogHandler, auditLogger)
	registerCoreAPIRoutes(r.Group("/api/v1"), cfg, db, rdb, waybillHandler, attachmentHandler, auditLogHandler, auditLogger)

	r.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleWebSocket(c.Writer, c.Request)
	})

	r.GET("/health", healthHandler.Check)

	log.Printf("Core API starting on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}
