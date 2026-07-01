package models

import "time"

type GeofenceEvent struct {
	ID             string    `json:"id"`
	WaybillID      string    `json:"waybillId"`
	TrackingNumber string    `json:"trackingNumber"`
	GeofenceID     string    `json:"geofenceId"`
	GeofenceName   string    `json:"geofenceName"`
	EventType      string    `json:"eventType"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	RecordedAt     time.Time `json:"recordedAt"`
}

type GeofenceZone struct {
	ID            string     `json:"id"`
	ZoneID        string     `json:"zoneId"`
	Name          string     `json:"name"`
	ZoneType      string     `json:"zoneType"`
	CenterLat     *float64   `json:"centerLat,omitempty"`
	CenterLon     *float64   `json:"centerLon,omitempty"`
	RadiusMeters  *float64   `json:"radiusMeters,omitempty"`
	PolygonCoords *string   `json:"polygonCoords,omitempty"`
	IsActive      bool       `json:"isActive"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}
