package models

import "time"

type BiIntegration struct {
	ID              string     `json:"id"`
	Name            string     `json:"name"`
	Platform        string     `json:"platform"`
	Status          string     `json:"status"`
	Endpoint        *string    `json:"endpoint,omitempty"`
	APIKey          *string    `json:"apiKey,omitempty"`
	Datasets        []string   `json:"datasets"`
	RefreshInterval int        `json:"refreshInterval"`
	LastSyncAt      *time.Time `json:"lastSyncAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type CreateBiIntegrationRequest struct {
	Name            string   `json:"name" binding:"required"`
	Platform        string   `json:"platform" binding:"required"`
	Endpoint        *string  `json:"endpoint"`
	APIKey          *string  `json:"apiKey"`
	Datasets        []string `json:"datasets"`
	RefreshInterval *int     `json:"refreshInterval"`
}

type UpdateBiIntegrationRequest struct {
	Name            *string  `json:"name"`
	Platform        *string  `json:"platform"`
	Status          *string  `json:"status"`
	Endpoint        *string  `json:"endpoint"`
	APIKey          *string  `json:"apiKey"`
	Datasets        []string `json:"datasets"`
	RefreshInterval *int     `json:"refreshInterval"`
}
