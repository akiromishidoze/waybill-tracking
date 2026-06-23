package main

import (
	"context"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	"github.com/waybill-tracking/core-api/internal/feature"
	"github.com/waybill-tracking/core-api/internal/handlers"
	kafkaprod "github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/middleware"
	"github.com/waybill-tracking/core-api/internal/migrator"
	"github.com/waybill-tracking/core-api/internal/repository"
	ws "github.com/waybill-tracking/core-api/internal/websocket"
)

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

	waybillRepo := repository.NewWaybillRepository(db, rdb)
	waybillHandler := handlers.NewWaybillHandler(waybillRepo)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo)
	attachmentHandler := handlers.NewAttachmentHandler(db)

	feature.RegisterAll(feature.DefaultFlags)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.LoginHandler(cfg.JWTSecret, db))
		api.POST("/auth/register", handlers.RegisterHandler(cfg.JWTSecret, db))
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
			protected.PATCH("/waybills/:id/status", waybillHandler.UpdateStatus)
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
			}
		}
	}

	r.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleWebSocket(c.Writer, c.Request)
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("Core API starting on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}
