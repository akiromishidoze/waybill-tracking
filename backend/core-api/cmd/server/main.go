package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/waybill-tracking/core-api/config"
	"github.com/waybill-tracking/core-api/internal/handlers"
	kafkaprod "github.com/waybill-tracking/core-api/internal/kafka"
	"github.com/waybill-tracking/core-api/internal/middleware"
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

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	kafkaProducer := kafkaprod.NewProducer(cfg.KafkaBrokers)
	defer kafkaProducer.Close()

	wsHub := ws.NewHub()

	waybillRepo := repository.NewWaybillRepository(db, rdb)
	waybillHandler := handlers.NewWaybillHandler(waybillRepo, kafkaProducer, wsHub)
	courierHandler := handlers.NewCourierHandler(waybillRepo)
	wsHandler := handlers.NewWSHandler(wsHub, waybillRepo)

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

		public := api.Group("")
		public.GET("/track/:trackingNumber", waybillHandler.Track)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
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
