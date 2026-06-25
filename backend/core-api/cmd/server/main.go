package main

import (
	"context"
	"log"
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

func registerCoreAPIRoutes(api *gin.RouterGroup, cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, waybillHandler *handlers.WaybillHandler, teamHandler *handlers.TeamHandler, ecommerceHandler *handlers.ECommerceHandler, whiteLabelHandler *handlers.WhiteLabelHandler, gpsHandler *handlers.GPSHandler, attachmentHandler *handlers.AttachmentHandler, auditLogHandler *handlers.AuditLogHandler, auditLogger *repository.AuditLogger, driverHandler *handlers.DriverHandler, carrierHandler *handlers.CarrierHandler, webhookHandler *handlers.WebhookHandler, settingsHandler *handlers.SettingsHandler) {
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
		protected.GET("/teams", teamHandler.List)
		protected.POST("/teams", teamHandler.Create)
		protected.PATCH("/teams/:id", teamHandler.Update)
		protected.DELETE("/teams/:id", teamHandler.Delete)
		protected.GET("/waybills", waybillHandler.List)
		protected.POST("/waybills", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), waybillHandler.Create)
		protected.POST("/waybills/import", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), waybillHandler.ImportCSV)
		protected.POST("/waybills/batch-status", middleware.RoleMiddleware("OPS", "ADMIN"), waybillHandler.BatchUpdateStatus)
		protected.GET("/waybills/:id", waybillHandler.Get)
		protected.PATCH("/waybills/:id", waybillHandler.Update)
		protected.PATCH("/waybills/:id/status", waybillHandler.UpdateStatus)
		protected.POST("/waybills/:id/scans", waybillHandler.CreateScan)
		protected.PATCH("/waybills/:id/assign-team", teamHandler.AssignToWaybill)
		protected.DELETE("/waybills/:id", middleware.RoleMiddleware("OPS", "ADMIN"), waybillHandler.Delete)

		protected.GET("/integrations/ecommerce", ecommerceHandler.Dashboard)
		protected.GET("/integrations/ecommerce/platforms", ecommerceHandler.ListPlatforms)
		protected.POST("/integrations/ecommerce/platforms", ecommerceHandler.CreatePlatform)
		protected.PATCH("/integrations/ecommerce/platforms/:id", ecommerceHandler.UpdatePlatform)
		protected.DELETE("/integrations/ecommerce/platforms/:id", ecommerceHandler.DeletePlatform)
		protected.GET("/integrations/ecommerce/sync-logs", ecommerceHandler.ListSyncLogs)

		protected.GET("/integrations/white-label", whiteLabelHandler.GetPortal)
		protected.PATCH("/integrations/white-label", whiteLabelHandler.UpdateConfig)

		protected.POST("/gps/location", gpsHandler.CreateLocation)
		protected.GET("/gps/waybills", gpsHandler.ListCurrent)
		protected.GET("/gps/waybills/:id/history", gpsHandler.GetHistory)
		protected.GET("/gps/waybills/:id/latest", gpsHandler.GetLatest)

		protected.GET("/settings", settingsHandler.Get)
		protected.PUT("/settings", settingsHandler.Update)
		protected.GET("/settings/dwell-threshold", settingsHandler.GetDwellThreshold)
		protected.PUT("/settings/dwell-threshold", settingsHandler.SetDwellThreshold)

		protected.GET("/webhooks", webhookHandler.List)
		protected.POST("/webhooks", webhookHandler.Create)
		protected.PATCH("/webhooks/:id", webhookHandler.Update)
		protected.DELETE("/webhooks/:id", webhookHandler.Delete)

		protected.GET("/carriers", carrierHandler.List)
		protected.POST("/carriers", middleware.RoleMiddleware("OPS", "ADMIN"), carrierHandler.Create)
		protected.PATCH("/carriers/:id", middleware.RoleMiddleware("OPS", "ADMIN"), carrierHandler.Update)
		protected.DELETE("/carriers/:id", middleware.RoleMiddleware("OPS", "ADMIN"), carrierHandler.Delete)

		protected.GET("/driver-assignments", driverHandler.ListAssignments)
		protected.POST("/driver-assignments", middleware.RoleMiddleware("OPS", "ADMIN"), driverHandler.CreateAssignment)
		protected.GET("/driver-assignments/:id", driverHandler.GetAssignment)
		protected.POST("/driver-assignments/:id/status", driverHandler.UpdateAssignmentStatus)
		protected.GET("/driver-scans", driverHandler.ListScans)

		protected.GET("/waybills/:id/attachments", attachmentHandler.List)
		protected.POST("/waybills/:id/attachments", attachmentHandler.Upload)
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

	rdbOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("failed to parse redis url: %v", err)
	}
	rdb := redis.NewClient(rdbOpts)

	kafkaProducer := kafkaprod.NewProducer(cfg.KafkaBrokers, cfg.KafkaTopic)
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
	teamRepo := repository.NewTeamRepository(db)
	teamHandler := handlers.NewTeamHandler(teamRepo, waybillRepo)
	ecommerceRepo := repository.NewECommerceRepository(db)
	ecommerceHandler := handlers.NewECommerceHandler(ecommerceRepo)
	whiteLabelRepo := repository.NewWhiteLabelRepository(db)
	whiteLabelHandler := handlers.NewWhiteLabelHandler(whiteLabelRepo)
	gpsRepo := repository.NewGPSRepository(db)
	gpsHandler := handlers.NewGPSHandler(gpsRepo, wsHub)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo, cfg.JWTSecret)
	attachmentHandler := handlers.NewAttachmentHandler(db)
	driverRepo := repository.NewDriverRepository(db)
	driverHandler := handlers.NewDriverHandler(driverRepo)
	carrierRepo := repository.NewCarrierRepository(db)
	carrierHandler := handlers.NewCarrierHandler(carrierRepo)
	webhookHandler := handlers.NewWebhookHandler(webhookRepo)
	settingsHandler := handlers.NewSettingsHandler(db)
	healthHandler := handlers.NewHealthHandler(db, rdb, cfg.KafkaBrokers, esClient)

	feature.RegisterAll(feature.DefaultFlags)

	r := gin.Default()

	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))
	r.Use(middleware.Gzip())

	registerCoreAPIRoutes(r.Group("/api"), cfg, db, rdb, waybillHandler, teamHandler, ecommerceHandler, whiteLabelHandler, gpsHandler, attachmentHandler, auditLogHandler, auditLogger, driverHandler, carrierHandler, webhookHandler, settingsHandler)
	registerCoreAPIRoutes(r.Group("/api/v1"), cfg, db, rdb, waybillHandler, teamHandler, ecommerceHandler, whiteLabelHandler, gpsHandler, attachmentHandler, auditLogHandler, auditLogger, driverHandler, carrierHandler, webhookHandler, settingsHandler)

	r.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleWebSocket(c.Writer, c.Request)
	})

	r.GET("/health", healthHandler.Check)

	log.Printf("Core API starting on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}
