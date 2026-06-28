package models

import "time"

type IoTSensor struct {
	ID             string     `json:"id"`
	SensorID       string     `json:"sensorId"`
	SensorType     string     `json:"sensorType"`
	Location       *string    `json:"location,omitempty"`
	Status         string     `json:"status"`
	LastReadingAt  *time.Time `json:"lastReadingAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type IoTSensorReading struct {
	ID          string    `json:"id"`
	SensorID    string    `json:"sensorId"`
	ReadingType string    `json:"readingType"`
	Value       float64   `json:"value"`
	Unit        *string   `json:"unit,omitempty"`
	RecordedAt  time.Time `json:"recordedAt"`
}

type CreateSensorRequest struct {
	SensorID   string  `json:"sensorId" binding:"required"`
	SensorType string  `json:"sensorType" binding:"required"`
	Location   *string `json:"location"`
}

type CreateReadingRequest struct {
	SensorID    string  `json:"sensorId" binding:"required"`
	ReadingType string  `json:"readingType" binding:"required"`
	Value       float64 `json:"value" binding:"required"`
	Unit        *string `json:"unit"`
}
