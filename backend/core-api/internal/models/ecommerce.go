package models

import "time"

type ECommercePlatform struct {
	ID           string     `json:"id"`
	Platform     string     `json:"platform"`
	StoreName    string     `json:"storeName"`
	StoreURL     *string    `json:"storeUrl,omitempty"`
	WebhookURL   *string    `json:"webhookUrl,omitempty"`
	APIKey       *string    `json:"apiKey,omitempty"`
	APISecret    *string    `json:"apiSecret,omitempty"`
	Connected    bool       `json:"connected"`
	TotalOrders  int        `json:"totalOrders"`
	SyncedOrders int        `json:"syncedOrders"`
	LastSync     *time.Time `json:"lastSync,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type ECommerceSyncLog struct {
	ID           string    `json:"id"`
	PlatformID   string    `json:"platformId"`
	Platform     string    `json:"platform"`
	StoreName    string    `json:"storeName"`
	Status       string    `json:"status"`
	OrdersSynced int       `json:"ordersSynced"`
	ErrorsCount  int       `json:"errorsCount"`
	SyncedAt     time.Time `json:"syncedAt"`
}

type ECommerceDashboard struct {
	Platforms   []ECommercePlatform `json:"platforms"`
	RecentSyncs []ECommerceSyncLog  `json:"recentSyncs"`
	Summary     ECommerceSummary    `json:"summary"`
}

type ECommerceSummary struct {
	TotalConnected    int        `json:"totalConnected"`
	TotalDisconnected int        `json:"totalDisconnected"`
	TotalOrdersSynced int        `json:"totalOrdersSynced"`
	LastSyncAt        *time.Time `json:"lastSyncAt,omitempty"`
}

type CreateECommercePlatformRequest struct {
	Platform   string  `json:"platform" binding:"required"`
	StoreName  string  `json:"storeName" binding:"required"`
	StoreURL   *string `json:"storeUrl,omitempty"`
	WebhookURL *string `json:"webhookUrl,omitempty"`
	APIKey     *string `json:"apiKey,omitempty"`
	APISecret  *string `json:"apiSecret,omitempty"`
}

type UpdateECommercePlatformRequest struct {
	Platform   string  `json:"platform"`
	StoreName  string  `json:"storeName"`
	StoreURL   *string `json:"storeUrl,omitempty"`
	WebhookURL *string `json:"webhookUrl,omitempty"`
	APIKey     *string `json:"apiKey,omitempty"`
	APISecret  *string `json:"apiSecret,omitempty"`
	Connected  *bool   `json:"connected,omitempty"`
}
