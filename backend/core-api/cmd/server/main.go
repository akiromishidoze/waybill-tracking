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
	"github.com/waybill-tracking/core-api/internal/storage"
	"github.com/waybill-tracking/core-api/internal/webhook"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
	"go.uber.org/zap"
)

type Dependencies struct {
	Cfg          *config.Config
	DB           *pgxpool.Pool
	RDB          *redis.Client
	AuditLogger  *repository.AuditLogger

	WaybillHandler            *handlers.WaybillHandler
	TeamHandler               *handlers.TeamHandler
	EcommerceHandler          *handlers.ECommerceHandler
	WhiteLabelHandler         *handlers.WhiteLabelHandler
	GPSHandler                *handlers.GPSHandler
	AttachmentHandler         *handlers.AttachmentHandler
	AuditLogHandler           *handlers.AuditLogHandler
	DriverHandler             *handlers.DriverHandler
	CarrierHandler            *handlers.CarrierHandler
	WebhookHandler            *handlers.WebhookHandler
	SettingsHandler           *handlers.SettingsHandler
	AnalyticsHandler          *handlers.AnalyticsHandler
	EcommerceWebhookHandler   *handlers.ECommerceWebhookHandler
	ErpHandler                *handlers.ErpHandler
	ScheduledReportHandler    *handlers.ScheduledReportHandler
	DwellAlertHandler         *handlers.DwellAlertHandler
	EscalationHandler         *handlers.EscalationHandler
	GeofenceEventHandler      *handlers.GeofenceEventHandler
	AutoCommunicationHandler  *handlers.AutoCommunicationHandler
	IoTSensorHandler          *handlers.IoTSensorHandler
	WebhookDeliveryHandler    *handlers.WebhookDeliveryHandler
	ReturnHandler             *handlers.ReturnHandler
	CustomsHandler            *handlers.CustomsHandler
	CODHandler                *handlers.CODHandler
	BiIntegrationHandler      *handlers.BiIntegrationHandler
}

func registerCoreAPIRoutes(api *gin.RouterGroup, deps *Dependencies) {
	cfg := deps.Cfg
	db := deps.DB
	rdb := deps.RDB

	api.POST("/auth/login", middleware.RateLimitMiddleware(rdb, 10, 1*time.Minute), handlers.LoginHandler(cfg.JWTSecret, db, rdb, deps.AuditLogger))
	api.POST("/auth/register", middleware.RateLimitMiddleware(rdb, 5, 1*time.Minute), handlers.RegisterHandler(cfg.JWTSecret, db))
	api.POST("/auth/refresh", handlers.RefreshTokenHandler(cfg.JWTSecret, db))
	api.POST("/auth/forgot-password", middleware.RateLimitMiddleware(rdb, 5, 1*time.Hour), handlers.ForgotPasswordHandler(db, cfg))
	api.POST("/auth/reset-password-with-token", handlers.ResetPasswordWithTokenHandler(db))
	api.GET("/features", feature.Handler())

	public := api.Group("")
	public.GET("/track/:trackingNumber", middleware.RateLimitMiddleware(rdb, 100, 1*time.Minute), deps.WaybillHandler.Track)
	public.GET("/exception-codes", deps.WaybillHandler.ListExceptionCodes)
	public.POST("/ecommerce/webhook/:platformId", deps.EcommerceWebhookHandler.ReceiveOrder)
	public.GET("/portal/:slug", middleware.RateLimitMiddleware(rdb, 60, 1*time.Minute), deps.WhiteLabelHandler.GetPublicPortal)
	public.GET("/portal/:slug/track/:trackingNumber", middleware.RateLimitMiddleware(rdb, 60, 1*time.Minute), deps.WhiteLabelHandler.PublicTrack)

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.GET("/auth/me", handlers.MeHandler(db))
		protected.GET("/teams", deps.TeamHandler.List)
		protected.POST("/teams", deps.TeamHandler.Create)
		protected.PATCH("/teams/:id", deps.TeamHandler.Update)
		protected.DELETE("/teams/:id", deps.TeamHandler.Delete)
		protected.GET("/waybills", deps.WaybillHandler.List)
		protected.POST("/waybills", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), deps.WaybillHandler.Create)
		protected.POST("/waybills/import", middleware.RoleMiddleware("SHIPPER", "OPS", "ADMIN"), deps.WaybillHandler.ImportCSV)
		protected.POST("/waybills/batch-status", middleware.RoleMiddleware("OPS", "ADMIN"), deps.WaybillHandler.BatchUpdateStatus)
		protected.GET("/waybills/map-data", deps.GPSHandler.ListCurrent)
		protected.GET("/waybills/:id", deps.WaybillHandler.Get)
		protected.PATCH("/waybills/:id", deps.WaybillHandler.Update)
		protected.PATCH("/waybills/:id/status", deps.WaybillHandler.UpdateStatus)
		protected.POST("/waybills/:id/scans", deps.WaybillHandler.CreateScan)
		protected.POST("/waybills/:id/initiate-return", deps.ReturnHandler.InitiateReturn)
		protected.PATCH("/waybills/:id/return-status", deps.ReturnHandler.UpdateStatus)
		protected.GET("/returns", deps.ReturnHandler.List)
		protected.GET("/customs-shipments", deps.CustomsHandler.List)
		protected.PATCH("/customs-shipments/:id", deps.CustomsHandler.UpdateStatus)
		protected.POST("/customs-shipments/:id/documents", deps.CustomsHandler.UploadDocument)
		protected.DELETE("/customs-documents/:docId", deps.CustomsHandler.DeleteDocument)
		protected.GET("/cod-payments", deps.CODHandler.List)
		protected.POST("/cod-payments/:id/settle", deps.CODHandler.Settle)
		protected.POST("/cod-payments/:id/dispute", deps.CODHandler.Dispute)
		protected.POST("/cod-payments/:id/refund", deps.CODHandler.Refund)
		protected.PATCH("/waybills/:id/assign-team", deps.TeamHandler.AssignToWaybill)
		protected.DELETE("/waybills/:id", middleware.RoleMiddleware("OPS", "ADMIN"), deps.WaybillHandler.Delete)

		protected.GET("/operations/dwell-alerts", deps.DwellAlertHandler.List)
		protected.POST("/operations/dwell-alerts/:id/resolve", deps.DwellAlertHandler.Resolve)

		protected.GET("/escalations", deps.EscalationHandler.List)
		protected.POST("/escalations", deps.EscalationHandler.Create)
		protected.GET("/escalations/:id", deps.EscalationHandler.Get)
		protected.PATCH("/escalations/:id", deps.EscalationHandler.Update)
		protected.POST("/escalations/:id/resolve", deps.EscalationHandler.Resolve)

		protected.GET("/geofence-events", deps.GeofenceEventHandler.List)
		protected.POST("/geofence-events", deps.GeofenceEventHandler.Create)
		protected.GET("/geofence-zones", deps.GeofenceEventHandler.ListZones)
		protected.POST("/geofence-zones", deps.GeofenceEventHandler.CreateZone)
		protected.PATCH("/geofence-zones/:id", deps.GeofenceEventHandler.UpdateZone)
		protected.DELETE("/geofence-zones/:id", deps.GeofenceEventHandler.DeleteZone)

		protected.GET("/auto-communications", deps.AutoCommunicationHandler.List)
		protected.POST("/auto-communications", deps.AutoCommunicationHandler.Create)
		protected.POST("/auto-communications/:id/sent", deps.AutoCommunicationHandler.MarkSent)
		protected.POST("/auto-communications/:id/failed", deps.AutoCommunicationHandler.MarkFailed)
		protected.GET("/auto-communications/rules", deps.AutoCommunicationHandler.ListRules)
		protected.POST("/auto-communications/rules", deps.AutoCommunicationHandler.CreateRule)
		protected.PATCH("/auto-communications/rules/:id", deps.AutoCommunicationHandler.UpdateRule)
		protected.DELETE("/auto-communications/rules/:id", deps.AutoCommunicationHandler.DeleteRule)

		protected.GET("/iot-sensors", deps.IoTSensorHandler.ListSensors)
		protected.POST("/iot-sensors", deps.IoTSensorHandler.CreateSensor)
		protected.GET("/iot-sensors/readings", deps.IoTSensorHandler.ListReadings)
		protected.POST("/iot-sensors/readings", deps.IoTSensorHandler.CreateReading)
		protected.GET("/iot-sensors/thresholds", deps.IoTSensorHandler.ListThresholds)
		protected.POST("/iot-sensors/thresholds", deps.IoTSensorHandler.CreateThreshold)
		protected.PATCH("/iot-sensors/thresholds/:id", deps.IoTSensorHandler.UpdateThreshold)
		protected.DELETE("/iot-sensors/thresholds/:id", deps.IoTSensorHandler.DeleteThreshold)

		protected.GET("/integrations/ecommerce", deps.EcommerceHandler.Dashboard)
		protected.GET("/integrations/ecommerce/platforms", deps.EcommerceHandler.ListPlatforms)
		protected.POST("/integrations/ecommerce/platforms", deps.EcommerceHandler.CreatePlatform)
		protected.PATCH("/integrations/ecommerce/platforms/:id", deps.EcommerceHandler.UpdatePlatform)
		protected.DELETE("/integrations/ecommerce/platforms/:id", deps.EcommerceHandler.DeletePlatform)
		protected.GET("/integrations/ecommerce/sync-logs", deps.EcommerceHandler.ListSyncLogs)

		protected.GET("/integrations/white-label", deps.WhiteLabelHandler.GetPortal)
		protected.PATCH("/integrations/white-label", deps.WhiteLabelHandler.UpdateConfig)

		protected.POST("/gps/location", deps.GPSHandler.CreateLocation)
		protected.GET("/gps/waybills", deps.GPSHandler.ListCurrent)
		protected.GET("/gps/waybills/:id/history", deps.GPSHandler.GetHistory)
		protected.GET("/gps/waybills/:id/latest", deps.GPSHandler.GetLatest)

		analytics := protected.Group("/analytics")
		analytics.Use(middleware.RateLimitMiddleware(rdb, 60, 1*time.Minute))
		{
			analytics.GET("/stats", deps.AnalyticsHandler.Stats)
			analytics.GET("/sla", deps.AnalyticsHandler.SLAReport)
			analytics.GET("/carrier-performance", deps.AnalyticsHandler.CarrierPerformance)
			analytics.GET("/region-performance", deps.AnalyticsHandler.RegionPerformance)
			analytics.GET("/predict-eta/:waybillId", deps.AnalyticsHandler.PredictETA)
			analytics.GET("/cost-per-shipment", deps.AnalyticsHandler.CostPerShipment)
			analytics.GET("/demand-forecast", deps.AnalyticsHandler.DemandForecast)
			analytics.GET("/carbon-footprint", deps.AnalyticsHandler.CarbonFootprint)
			analytics.GET("/export", middleware.RateLimitMiddleware(rdb, 10, 1*time.Minute), middleware.RoleMiddleware("ADMIN", "OPS"), deps.AnalyticsHandler.ExportExcel)
		}

		protected.GET("/analytics/scheduled-reports", deps.ScheduledReportHandler.List)
		protected.POST("/analytics/scheduled-reports", deps.ScheduledReportHandler.Create)
		protected.PATCH("/analytics/scheduled-reports/:id", deps.ScheduledReportHandler.Update)
		protected.DELETE("/analytics/scheduled-reports/:id", deps.ScheduledReportHandler.Delete)
		protected.POST("/analytics/scheduled-reports/:id/run", deps.ScheduledReportHandler.RunNow)

		protected.GET("/settings", deps.SettingsHandler.Get)
		protected.PUT("/settings", deps.SettingsHandler.Update)
		protected.GET("/settings/dwell-threshold", deps.SettingsHandler.GetDwellThreshold)
		protected.PUT("/settings/dwell-threshold", deps.SettingsHandler.SetDwellThreshold)

		protected.GET("/webhooks", deps.WebhookHandler.List)
		protected.POST("/webhooks", deps.WebhookHandler.Create)
		protected.PATCH("/webhooks/:id", deps.WebhookHandler.Update)
		protected.DELETE("/webhooks/:id", deps.WebhookHandler.Delete)

		protected.GET("/erp-integrations", deps.ErpHandler.List)
		protected.POST("/erp-integrations", deps.ErpHandler.Create)
		protected.PATCH("/erp-integrations/:id", deps.ErpHandler.Update)
		protected.DELETE("/erp-integrations/:id", deps.ErpHandler.Delete)
		protected.POST("/erp-integrations/:id/test", deps.ErpHandler.Test)
		protected.POST("/erp-integrations/:id/sync", deps.ErpHandler.Sync)

		protected.GET("/bi-integrations", deps.BiIntegrationHandler.List)
		protected.POST("/bi-integrations", deps.BiIntegrationHandler.Create)
		protected.PATCH("/bi-integrations/:id", deps.BiIntegrationHandler.Update)
		protected.DELETE("/bi-integrations/:id", deps.BiIntegrationHandler.Delete)
		protected.POST("/bi-integrations/:id/sync", deps.BiIntegrationHandler.Sync)

		protected.GET("/carriers", deps.CarrierHandler.List)
		protected.POST("/carriers", middleware.RoleMiddleware("OPS", "ADMIN"), deps.CarrierHandler.Create)
		protected.PATCH("/carriers/:id", middleware.RoleMiddleware("OPS", "ADMIN"), deps.CarrierHandler.Update)
		protected.DELETE("/carriers/:id", middleware.RoleMiddleware("OPS", "ADMIN"), deps.CarrierHandler.Delete)

		protected.GET("/driver-assignments", deps.DriverHandler.ListAssignments)
		protected.POST("/driver-assignments", middleware.RoleMiddleware("OPS", "ADMIN"), deps.DriverHandler.CreateAssignment)
		protected.GET("/driver-assignments/:id", deps.DriverHandler.GetAssignment)
		protected.POST("/driver-assignments/:id/status", deps.DriverHandler.UpdateAssignmentStatus)
		protected.GET("/driver-scans", deps.DriverHandler.ListScans)

		protected.GET("/waybills/:id/attachments", deps.AttachmentHandler.List)
		protected.POST("/waybills/:id/attachments", deps.AttachmentHandler.Upload)
		protected.GET("/attachments/:attachmentId", deps.AttachmentHandler.Get)
		protected.DELETE("/attachments/:attachmentId", deps.AttachmentHandler.Delete)

		admin := protected.Group("")
		admin.Use(middleware.RoleMiddleware("ADMIN"))
		{
			admin.GET("/users", handlers.ListUsersHandler(db))
			admin.POST("/users", handlers.CreateUserHandler(db))
			admin.DELETE("/users/:id", handlers.DeleteUserHandler(db))
			admin.PATCH("/users/:id/role", handlers.UpdateUserRoleHandler(db))
			admin.POST("/auth/reset-password", handlers.ResetPasswordHandler(db))
			admin.GET("/audit-logs", deps.AuditLogHandler.List)
			admin.GET("/webhook-deliveries", deps.WebhookDeliveryHandler.List)
			admin.POST("/webhook-deliveries/:id/retry", deps.WebhookDeliveryHandler.Retry)
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
	
	// Initialize Elasticsearch index
	if err := esClient.CreateIndex(context.Background()); err != nil {
		log.Warn("failed to create elasticsearch index", zap.Error(err))
	}
	
	webhookRepo := repository.NewWebhookRepository(db)
	webhookDeliveryRepo := repository.NewWebhookDeliveryRepository(db)
	webhookDispatcher := webhook.NewDispatcher(webhookRepo, webhookDeliveryRepo)

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
	webhookDeliveryHandler := handlers.NewWebhookDeliveryHandler(webhookDeliveryRepo, webhookDispatcher)
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
	returnRepo := repository.NewReturnRepository(db)
	returnHandler := handlers.NewReturnHandler(returnRepo)
	customsRepo := repository.NewCustomsRepository(db)
	fileStorage := storage.NewFileStorage("./uploads", "/uploads")
	customsHandler := handlers.NewCustomsHandler(customsRepo, fileStorage)
	codRepo := repository.NewCODRepository(db)
	codHandler := handlers.NewCODHandler(codRepo)
	biRepo := repository.NewBiIntegrationRepository(db)
	biHandler := handlers.NewBiIntegrationHandler(biRepo)
	healthHandler := handlers.NewHealthHandler(db, rdb, cfg.KafkaBrokers, esClient)

	feature.RegisterAll(feature.DefaultFlags)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(middleware.RequestLogger())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))
	r.Use(middleware.Gzip())

	deps := &Dependencies{
		Cfg:          cfg,
		DB:           db,
		RDB:          rdb,
		AuditLogger:  auditLogger,

		WaybillHandler:            waybillHandler,
		TeamHandler:               teamHandler,
		EcommerceHandler:          ecommerceHandler,
		WhiteLabelHandler:         whiteLabelHandler,
		GPSHandler:                gpsHandler,
		AttachmentHandler:         attachmentHandler,
		AuditLogHandler:           auditLogHandler,
		DriverHandler:             driverHandler,
		CarrierHandler:            carrierHandler,
		WebhookHandler:            webhookHandler,
		SettingsHandler:           settingsHandler,
		AnalyticsHandler:          analyticsHandler,
		EcommerceWebhookHandler:   ecommerceWebhookHandler,
		ErpHandler:                erpHandler,
		ScheduledReportHandler:    scheduledReportHandler,
		DwellAlertHandler:         dwellAlertHandler,
		EscalationHandler:         escalationHandler,
		GeofenceEventHandler:      geofenceEventHandler,
		AutoCommunicationHandler:  autoCommunicationHandler,
		IoTSensorHandler:          iotSensorHandler,
		WebhookDeliveryHandler:    webhookDeliveryHandler,
		ReturnHandler:             returnHandler,
		CustomsHandler:            customsHandler,
		CODHandler:                codHandler,
		BiIntegrationHandler:      biHandler,
	}

	registerCoreAPIRoutes(r.Group("/api"), deps)
	registerCoreAPIRoutes(r.Group("/api/v1"), deps)

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
