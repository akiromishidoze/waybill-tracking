package models

import "time"

type ErpIntegration struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	System         string     `json:"system"`
	Endpoint       string     `json:"endpoint"`
	AuthType       string     `json:"authType"`
	APIKey         *string    `json:"apiKey,omitempty"`
	APISecret      *string    `json:"apiSecret,omitempty"`
	SyncDirection  string     `json:"syncDirection"`
	LastSyncAt     *time.Time `json:"lastSyncAt,omitempty"`
	LastSyncStatus *string    `json:"lastSyncStatus,omitempty"`
	IsActive       bool       `json:"isActive"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type CreateErpIntegrationRequest struct {
	Name          string  `json:"name" binding:"required"`
	System        string  `json:"system" binding:"required"`
	Endpoint      string  `json:"endpoint" binding:"required"`
	AuthType      string  `json:"authType"`
	APIKey        *string `json:"apiKey"`
	APISecret     *string `json:"apiSecret"`
	SyncDirection string  `json:"syncDirection"`
}

type UpdateErpIntegrationRequest struct {
	Name          *string `json:"name"`
	System        *string `json:"system"`
	Endpoint      *string `json:"endpoint"`
	AuthType      *string `json:"authType"`
	APIKey        *string `json:"apiKey"`
	APISecret     *string `json:"apiSecret"`
	SyncDirection *string `json:"syncDirection"`
	IsActive      *bool   `json:"isActive"`
}
