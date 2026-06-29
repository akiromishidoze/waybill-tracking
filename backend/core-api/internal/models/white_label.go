package models

import "time"

type WhiteLabelConfig struct {
	ID           string    `json:"id"`
	Slug         string    `json:"slug"`
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

// PublicPortalResponse is the unauthenticated portal landing response.
type PublicPortalResponse struct {
	Slug         string  `json:"slug"`
	BrandName    string  `json:"brandName"`
	LogoURL      *string `json:"logoUrl,omitempty"`
	PrimaryColor string  `json:"primaryColor"`
	SupportEmail string  `json:"supportEmail"`
	SupportPhone string  `json:"supportPhone"`
	PortalURL    string  `json:"portalUrl"`
}

// PublicTrackingResult is the branded tracking page response.
type PublicTrackingResult struct {
	Portal         PublicPortalResponse `json:"portal"`
	TrackingNumber string               `json:"trackingNumber"`
	Status         string               `json:"status"`
	Origin         string               `json:"origin"`
	Destination    string               `json:"destination"`
	ServiceType    string               `json:"serviceType"`
	CarrierName    string               `json:"carrierName"`
	Events         []PublicScanEvent    `json:"events"`
	EstimatedDelivery *time.Time        `json:"estimatedDelivery,omitempty"`
}

type PublicScanEvent struct {
	Status    string    `json:"status"`
	Location  string    `json:"location"`
	Note      string    `json:"note,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
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
	Slug         *string `json:"slug,omitempty"`
	BrandName    *string `json:"brandName,omitempty"`
	LogoURL      *string `json:"logoUrl,omitempty"`
	CustomDomain *string `json:"customDomain,omitempty"`
	PrimaryColor *string `json:"primaryColor,omitempty"`
	SupportEmail *string `json:"supportEmail,omitempty"`
	SupportPhone *string `json:"supportPhone,omitempty"`
	Enabled      *bool   `json:"enabled,omitempty"`
	PortalURL    *string `json:"portalUrl,omitempty"`
}
