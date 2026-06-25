package models

import "time"

type Carrier struct {
	ID                  string    `json:"id"`
	Name                string    `json:"name"`
	APIEndpoint         string    `json:"apiEndpoint"`
	APIKey              string    `json:"apiKey"`
	IsActive            bool      `json:"isActive"`
	TrackingURLTemplate string    `json:"trackingUrlTemplate"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

type CreateCarrierRequest struct {
	Name                string `json:"name" binding:"required"`
	APIEndpoint         string `json:"apiEndpoint"`
	APIKey              string `json:"apiKey"`
	IsActive            *bool  `json:"isActive"`
	TrackingURLTemplate string `json:"trackingUrlTemplate"`
}

type UpdateCarrierRequest struct {
	Name                string `json:"name"`
	APIEndpoint         string `json:"apiEndpoint"`
	APIKey              string `json:"apiKey"`
	IsActive            *bool  `json:"isActive"`
	TrackingURLTemplate string `json:"trackingUrlTemplate"`
}
