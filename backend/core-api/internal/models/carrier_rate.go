package models

import "time"

type CarrierRate struct {
	ID              string    `json:"id"`
	CarrierID       string    `json:"carrierId"`
	CarrierName     string    `json:"carrierName,omitempty"`
	ServiceType     string    `json:"serviceType"`
	OriginZone      string    `json:"originZone"`
	DestinationZone string    `json:"destinationZone"`
	WeightMinKg     float64   `json:"weightMinKg"`
	WeightMaxKg     float64   `json:"weightMaxKg"`
	BaseRate        float64   `json:"baseRate"`
	PerKgRate       float64   `json:"perKgRate"`
	Currency        string    `json:"currency"`
	TransitDaysMin  int       `json:"transitDaysMin"`
	TransitDaysMax  int       `json:"transitDaysMax"`
	IsActive        bool      `json:"isActive"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type CreateCarrierRateRequest struct {
	ServiceType     string  `json:"serviceType" binding:"required"`
	OriginZone      string  `json:"originZone"`
	DestinationZone string  `json:"destinationZone"`
	WeightMinKg     float64 `json:"weightMinKg"`
	WeightMaxKg     float64 `json:"weightMaxKg"`
	BaseRate        float64 `json:"baseRate" binding:"required"`
	PerKgRate       float64 `json:"perKgRate"`
	Currency        string  `json:"currency"`
	TransitDaysMin  int     `json:"transitDaysMin"`
	TransitDaysMax  int     `json:"transitDaysMax"`
	IsActive        *bool   `json:"isActive"`
	Notes           string  `json:"notes"`
}

type UpdateCarrierRateRequest struct {
	ServiceType     string  `json:"serviceType"`
	OriginZone      string  `json:"originZone"`
	DestinationZone string  `json:"destinationZone"`
	WeightMinKg     *float64 `json:"weightMinKg"`
	WeightMaxKg     *float64 `json:"weightMaxKg"`
	BaseRate        *float64 `json:"baseRate"`
	PerKgRate       *float64 `json:"perKgRate"`
	Currency        string  `json:"currency"`
	TransitDaysMin  *int    `json:"transitDaysMin"`
	TransitDaysMax  *int    `json:"transitDaysMax"`
	IsActive        *bool   `json:"isActive"`
	Notes           string  `json:"notes"`
}

type RateQuote struct {
	CarrierID       string  `json:"carrierId"`
	CarrierName     string  `json:"carrierName"`
	RateID          string  `json:"rateId"`
	ServiceType     string  `json:"serviceType"`
	TotalRate       float64 `json:"totalRate"`
	BaseRate        float64 `json:"baseRate"`
	WeightCharge    float64 `json:"weightCharge"`
	Currency        string  `json:"currency"`
	TransitDaysMin  int     `json:"transitDaysMin"`
	TransitDaysMax  int     `json:"transitDaysMax"`
}
