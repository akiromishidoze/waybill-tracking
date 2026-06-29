package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	"github.com/waybill-tracking/core-api/internal/analytics"
	"github.com/waybill-tracking/core-api/internal/elastic"
	"github.com/waybill-tracking/core-api/internal/feature"
	"github.com/waybill-tracking/core-api/internal/handlers"
	kafkaprod "github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/logger"
	"github.com/waybill-tracking/core-api/internal/middleware"
	"github.com/waybill-tracking/core-api/internal/migrator"
	"github.com/waybill-tracking/core-api/internal/notifications"
	"github.com/waybill-tracking/core-api/internal/repository"
	"github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
	"go.uber.org/zap"
)

func registerCoreAPIRoutes(api *gin.RouterGroup, cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, waybillHandler *handlers.WaybillHandler, teamHandler *handlers.TeamHandler, ecommerceHandler *handlers.ECommerceHandler, whiteLabelHandler *handlers.WhiteLabelHandler, gpsHandler *handlers.GPSHandler, attachmentHandler *handlers.AttachmentHandler, auditLogHandler *handlers.AuditLogHandler, auditLogger *repository.AuditLogger, driverHandler *handlers.DriverHandler, carrierHandler *handlers.CarrierHandler, webhookHandler *handlers.WebhookHandler, settingsHandler *handlers.SettingsHandler, analyticsHandler *handlers.AnalyticsHandler, ecommerceWebhookHandler *handlers.ECommerceWebhookHandler, erpHandler *handlers.ErpHandler, scheduledReportHandler *handlers.ScheduledReportHandler, dwellAlertHandler *handlers.DwellAlertHandler, escalationHandler *handlers.EscalationHandler, geofenceEventHandler *handlers.GeofenceEventHandler, autoCommunicationHandler *handlers.AutoCommunicationHandler, iotSensorHandler *handlers.IoTSensorHandler) {
	api.POST("/auth/login", middleware.RateLimitMiddleware(rdb, 10, 1*time.Minute), handlers.LoginHandler(cfg.JWTSecret, db, rdb, auditLogger))
	api.POST("/auth/register", middleware.RateLimitMiddleware(rdb, 5, 1*time.Minute), handlers.RegisterHandler(cfg.JWTSecret, db))
	api.POST("/auth/refresh", handlers.RefreshTokenHandler(cfg.JWTSecret, db))
	api.POST("/auth/forgot-password", middleware.RateLimitMiddleware(rdb, 5, 1*time.Hour), handlers.ForgotPasswordHandler(db, cfg))
	api.POST("/auth/reset-password-with-token", handlers.ResetPasswordWithTokenHandler(db))
	api.GET("/features", feature.Handler())

	public := api.Group("")
	public.GET("/track/:trackingNumber", middleware.RateLimitMiddleware(rdb, 100, 1*time.Minute), waybillHandler.Track)
	public.GET("/exception-codes", waybillHandler.ListExceptionCodes)
	public.POST("/ecommerce/webhook/:platformId", ecommerceWebhookHandler.ReceiveOrder)

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
		protected.GET("/waybills/map-data", gpsHandler.ListCurrent)
		protected.GET("/waybills/:id", waybillHandler.Get)
		protected.PATCH("/waybills/:id", waybillHandler.Update)
		protected.PATCH("/waybills/:id/status", waybillHandler.UpdateStatus)
		protected.POST("/waybills/:id/scans", waybillHandler.CreateScan)
		protected.PATCH("/waybills/:id/assign-team", teamHandler.AssignToWaybill)
		protected.DELETE("/waybills/:id", middleware.RoleMiddleware("OPS", "ADMIN"), waybillHandler.Delete)

		protected.GET("/operations/dwell-alerts", dwellAlertHandler.List)
		protected.POST("/operations/dwell-alerts/:id/resolve", dwellAlertHandler.Resolve)

		protected.GET("/escalations", escalationHandler.List)
		protected.POST("/escalations", escalationHandler.Create)
		protected.GET("/escalations/:id", escalationHandler.Get)
		protected.PATCH("/escalations/:id", escalationHandler.Update)
		protected.POST("/escalations/:id/resolve", escalationHandler.Resolve)

		protected.GET("/geofence-events", geofenceEventHandler.List)
		protected.POST("/geofence-events", geofenceEventHandler.Create)

		protected.GET("/auto-communications", autoCommunicationHandler.List)
		protected.POST("/auto-communications", autoCommunicationHandler.Create)
		protected.POST("/auto-communications/:id/sent", autoCommunicationHandler.MarkSent)
		protected.POST("/auto-communications/:id/failed", autoCommunicationHandler.MarkFailed)

		protected.GET("/iot-sensors", iotSensorHandler.ListSensors)
		protected.POST("/iot-sensors", iotSensorHandler.CreateSensor)
		protected.GET("/iot-sensors/readings", iotSensorHandler.ListReadings)
		protected.POST("/iot-sensors/readings", iotSensorHandler.CreateReading)

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

		analytics := protected.Group("/analytics")
		analytics.Use(middleware.RateLimitMiddleware(rdb, 60, 1*time.Minute))
		{
			analytics.GET("/stats", analyticsHandler.Stats)
			analytics.GET("/sla", analyticsHandler.SLAReport)
			analytics.GET("/carrier-performance", analyticsHandler.CarrierPerformance)
			analytics.GET("/region-performance", analyticsHandler.RegionPerformance)
			analytics.GET("/predict-eta/:waybillId", analyticsHandler.PredictETA)
			analytics.GET("/cost-per-shipment", analyticsHandler.CostPerShipment)
			analytics.GET("/demand-forecast", analyticsHandler.DemandForecast)
			analytics.GET("/carbon-footprint", analyticsHandler.CarbonFootprint)
			analytics.GET("/export", middleware.RateLimitMiddleware(rdb, 10, 1*time.Minute), middleware.RoleMiddleware("ADMIN", "OPS"), analyticsHandler.ExportExcel)
		}

		protected.GET("/analytics/scheduled-reports", scheduledReportHandler.List)
		protected.POST("/analytics/scheduled-reports", scheduledReportHandler.Create)
		protected.PATCH("/analytics/scheduled-reports/:id", scheduledReportHandler.Update)
		protected.DELETE("/analytics/scheduled-reports/:id", scheduledReportHandler.Delete)
		protected.POST("/analytics/scheduled-reports/:id/run", scheduledReportHandler.RunNow)

		protected.GET("/settings", settingsHandler.Get)
		protected.PUT("/settings", settingsHandler.Update)
		protected.GET("/settings/dwell-threshold", settingsHandler.GetDwellThreshold)
		protected.PUT("/settings/dwell-threshold", settingsHandler.SetDwellThreshold)

		protected.GET("/webhooks", webhookHandler.List)
		protected.POST("/webhooks", webhookHandler.Create)
		protected.PATCH("/webhooks/:id", webhookHandler.Update)
		protected.DELETE("/webhooks/:id", webhookHandler.Delete)

		protected.GET("/erp-integrations", erpHandler.List)
		protected.POST("/erp-integrations", erpHandler.Create)
		protected.PATCH("/erp-integrations/:id", erpHandler.Update)
		protected.DELETE("/erp-integrations/:id", erpHandler.Delete)
		protected.POST("/erp-integrations/:id/test", erpHandler.Test)
		protected.POST("/erp-integrations/:id/sync", erpHandler.Sync)

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
			admin.POST("/users", handlers.CreateUserHandler(db))
			admin.DELETE("/users/:id", handlers.DeleteUserHandler(db))
			admin.PATCH("/users/:id/role", handlers.UpdateUserRoleHandler(db))
			admin.POST("/auth/reset-password", handlers.ResetPasswordHandler(db))
			admin.GET("/audit-logs", auditLogHandler.List)
		}
	}
}

func main() {
	cfg := config.Load()

	log := logger.L()
	defer logger.Sync()

	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal("failed to connect to db", zap.Error(err))
	}

	migrationsDir := filepath.Join("migrations")
	if err := migrator.New(db, migrationsDir).Run(context.Background()); err != nil {
		log.Fatal("migration failed", zap.Error(err))
	}

	rdbOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatal("failed to parse redis url", zap.Error(err))
	}
	rdb := redis.NewClient(rdbOpts)

	kafkaProducer := kafkaprod.NewProducer(cfg.KafkaBrokers, cfg.KafkaTopic)

	wsHub := ws.NewHub()
	esClient := elastic.NewClient(cfg.ElasticsearchURL)
	webhookRepo := repository.NewWebhookRepository(db)
	webhookDispatcher := webhook.NewDispatcher(webhookRepo)

	auditLogRepo := repository.NewAuditLogRepository(db)
	auditLogger := repository.NewAuditLogger(auditLogRepo)
	auditLogHandler := handlers.NewAuditLogHandler(auditLogRepo)

	waybillRepo := repository.NewWaybillRepository(db, rdb)
	notificationDispatcher := notifications.NewDispatcher(cfg.AnalyticsAPIURL, cfg.InternalAPIKey)
	waybillHandler := handlers.NewWaybillHandler(waybillRepo, kafkaProducer, wsHub, esClient, webhookDispatcher, notificationDispatcher, auditLogger)
	teamRepo := repository.NewTeamRepository(db)
	teamHandler := handlers.NewTeamHandler(teamRepo, waybillRepo)
	ecommerceRepo := repository.NewECommerceRepository(db)
	ecommerceHandler := handlers.NewECommerceHandler(ecommerceRepo)
	whiteLabelRepo := repository.NewWhiteLabelRepository(db)
	whiteLabelHandler := handlers.NewWhiteLabelHandler(whiteLabelRepo)
	gpsRepo := repository.NewGPSRepository(db)
	gpsHandler := handlers.NewGPSHandler(gpsRepo, wsHub, kafkaProducer)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo, cfg.JWTSecret)
	attachmentHandler := handlers.NewAttachmentHandler(db)
	driverRepo := repository.NewDriverRepository(db)
	driverHandler := handlers.NewDriverHandler(driverRepo)
	carrierRepo := repository.NewCarrierRepository(db)
	carrierHandler := handlers.NewCarrierHandler(carrierRepo)
	webhookHandler := handlers.NewWebhookHandler(webhookRepo)
	settingsHandler := handlers.NewSettingsHandler(db)
	analyticsAPIClient := analytics.NewClient(cfg)
	analyticsHandler := handlers.NewAnalyticsHandler(db, analyticsAPIClient)
	ecommerceWebhookHandler := handlers.NewECommerceWebhookHandler(waybillRepo, ecommerceRepo, db)
	erpRepo := repository.NewErpRepository(db)
	erpHandler := handlers.NewErpHandler(erpRepo)
	scheduledReportRepo := repository.NewScheduledReportRepository(db)
	scheduledReportHandler := handlers.NewScheduledReportHandler(scheduledReportRepo)
	dwellAlertRepo := repository.NewDwellAlertRepository(db)
	dwellAlertHandler := handlers.NewDwellAlertHandler(dwellAlertRepo)
	escalationRepo := repository.NewEscalationRepository(db)
	escalationHandler := handlers.NewEscalationHandler(escalationRepo)
	geofenceEventRepo := repository.NewGeofenceEventRepository(db)
	geofenceEventHandler := handlers.NewGeofenceEventHandler(geofenceEventRepo)
	autoCommunicationRepo := repository.NewAutoCommunicationRepository(db)
	autoCommunicationHandler := handlers.NewAutoCommunicationHandler(autoCommunicationRepo)
	iotSensorRepo := repository.NewIoTSensorRepository(db)
	iotSensorHandler := handlers.NewIoTSensorHandler(iotSensorRepo)
	healthHandler := handlers.NewHealthHandler(db, rdb, cfg.KafkaBrokers, esClient)

	feature.RegisterAll(feature.DefaultFlags)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(middleware.RequestLogger())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))
	r.Use(middleware.Gzip())

	registerCoreAPIRoutes(r.Group("/api"), cfg, db, rdb, waybillHandler, teamHandler, ecommerceHandler, whiteLabelHandler, gpsHandler, attachmentHandler, auditLogHandler, auditLogger, driverHandler, carrierHandler, webhookHandler, settingsHandler, analyticsHandler, ecommerceWebhookHandler, erpHandler, scheduledReportHandler, dwellAlertHandler, escalationHandler, geofenceEventHandler, autoCommunicationHandler, iotSensorHandler)
	registerCoreAPIRoutes(r.Group("/api/v1"), cfg, db, rdb, waybillHandler, teamHandler, ecommerceHandler, whiteLabelHandler, gpsHandler, attachmentHandler, auditLogHandler, auditLogger, driverHandler, carrierHandler, webhookHandler, settingsHandler, analyticsHandler, ecommerceWebhookHandler, erpHandler, scheduledReportHandler, dwellAlertHandler, escalationHandler, geofenceEventHandler, autoCommunicationHandler, iotSensorHandler)

	r.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleWebSocket(c.Writer, c.Request)
	})

	r.GET("/health", healthHandler.Check)
	r.GET("/docs", handlers.DocsHandler)
	r.GET("/openapi.json", handlers.OpenAPIHandler)
	r.GET("/openapi.yaml", handlers.OpenAPIHandler)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Info("Core API starting", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("HTTP server error", zap.Error(err))
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	<-ctx.Done()
	log.Info("shutdown signal received, gracefully stopping core-api")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("HTTP server shutdown error", zap.Error(err))
	}

	if err := kafkaProducer.Close(); err != nil {
		log.Error("kafka producer close error", zap.Error(err))
	}

	if err := rdb.Close(); err != nil {
		log.Error("redis close error", zap.Error(err))
	}

	db.Close()
	log.Info("core-api stopped")
}
