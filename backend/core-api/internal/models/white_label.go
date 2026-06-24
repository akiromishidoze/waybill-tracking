package models

import "time"

type WhiteLabelConfig struct {
	ID           string    `json:"id"`
	BrandName    string    `json:"brandName"`
	LogoURL      *string   `json:"logoUrl,omitempty"`
	CustomDomain *string   `json:"customDomain,omitempty"`
	PrimaryColor string    `json:"primaryColor"`
	SupportEmail string    `json:"supportEmail"`
	SupportPhone string    `json:"supportPhone"`
	Enabled      bool      `json:"enabled"`
	PortalURL    string    `json:"portalUrl"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type WhiteLabelPortalData struct {
	Config         WhiteLabelConfig `json:"config"`
	Stats          WhiteLabelStats  `json:"stats"`
	RecentTracking []TrackingEvent  `json:"recentTracking"`
}

type WhiteLabelStats struct {
	ActiveSessions           int     `json:"activeSessions"`
	TrackingQueriesToday     int     `json:"trackingQueriesToday"`
	TotalRegisteredCustomers int     `json:"totalRegisteredCustomers"`
	AverageSatisfaction      float64 `json:"averageSatisfaction"`
}

type TrackingEvent struct {
	ID             string    `json:"id"`
	TrackingNumber string    `json:"trackingNumber"`
	CustomerName   string    `json:"customerName"`
	Status         string    `json:"status"`
	Carrier        string    `json:"carrier"`
	Timestamp      time.Time `json:"timestamp"`
}

type UpdateWhiteLabelConfigRequest struct {
	BrandName    *string `json:"brandName,omitempty"`
	LogoURL      *string `json:"logoUrl,omitempty"`
	CustomDomain *string `json:"customDomain,omitempty"`
	PrimaryColor *string `json:"primaryColor,omitempty"`
	SupportEmail *string `json:"supportEmail,omitempty"`
	SupportPhone *string `json:"supportPhone,omitempty"`
	Enabled      *bool   `json:"enabled,omitempty"`
	PortalURL    *string `json:"portalUrl,omitempty"`
}
