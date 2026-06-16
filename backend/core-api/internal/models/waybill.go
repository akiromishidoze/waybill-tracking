package models

import "time"

type WaybillStatus string

const (
	StatusCreated WaybillStatus = "CREATED"
	StatusPickedUp WaybillStatus = "PICKED_UP"
	StatusInTransit WaybillStatus = "IN_TRANSIT"
	StatusAtSortingCenter WaybillStatus = "AT_SORTING_CENTER"
	StatusOutForDelivery WaybillStatus = "OUT_FOR_DELIVERY"
	StatusDelivered WaybillStatus = "DELIVERED"
	StatusFailedDelivery WaybillStatus = "FAILED_DELIVERY"
	StatusReturned WaybillStatus = "RETURNED"
	StatusCancelled WaybillStatus = "CANCELLED"
)

type Waybill struct {
	ID string `json:"id"`
	TrackingNumber string `json:"trackingNumber"`
	ShipperID string `json:"shipperId"`
	ShipperName string `json:"shipperName"`
	RecipientName string `json:"recipientName"`
	RecipientAddress string `json:"recipientAddress"`
	RecipientPhone string `json:"recipientPhone"`
	Origin string `json:"origin"`
	Destination string `json:"destination"`
	Weight float64 `json:"weight"`
	Dimensions string `json:"dimensions"`
	ServiceType string `json:"serviceType"`
	Status WaybillStatus `json:"status"`
	EstimatedDelivery *time.Time `json:"estimatedDelivery,omitempty"`
	ActualDelivery *time.Time `json:"actualDelivery,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Events []ScanEvent `json:"events,omitempty"`
}

type ScanEvent struct {
	ID string `json:"id"`
	WaybillID string `json:"waybillId"`
	Status WaybillStatus `json:"status"`
	Location string `json:"location"`
	CourierID *string `json:"courierId,omitempty"`
	CourierName *string `json:"courierName,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Remark *string `json:"remark,omitempty"`
}

type User struct {
	ID string `json:"id"`
	Email string `json:"email"`
	Name string `json:"name"`
	Password string `json:"-"`
	Role string `json:"role"`
	Company string `json:"company,omitempty"`
}

type CreateWaybillRequest struct {
	RecipientName string `json:"recipientName" binding:"required"`
	RecipientAddress string `json:"recipientAddress" binding:"required"`
	RecipientPhone string `json:"recipientPhone" binding:"required"`
	Origin string `json:"origin" binding:"required"`
	Destination string `json:"destination" binding:"required"`
	Weight float64 `json:"weight" binding:"required"`
	Dimensions string `json:"dimensions"`
	ServiceType string `json:"serviceType"`
}

type StatusUpdateRequest struct {
	Status WaybillStatus `json:"status" binding:"required"`
	Location string `json:"location"`
	Remark *string `json:"remark,omitempty"`
}

var validTransitions = map[WaybillStatus][]WaybillStatus{
	StatusCreated: {StatusPickedUp, StatusCancelled},
	StatusPickedUp: {StatusInTransit, StatusCancelled, StatusReturned},
	StatusInTransit: {StatusAtSortingCenter, StatusOutForDelivery, StatusCancelled, StatusReturned},
	StatusAtSortingCenter: {StatusInTransit, StatusOutForDelivery, StatusCancelled, StatusReturned},
	StatusOutForDelivery: {StatusDelivered, StatusFailedDelivery, StatusCancelled, StatusReturned},
	StatusFailedDelivery: {StatusOutForDelivery, StatusCancelled, StatusReturned},
	StatusDelivered: {},
}

func IsValidTransition(from, to WaybillStatus) bool {
	allowed, ok := validTransitions[from]

	if !ok {
		return false
	}

	for _, s := range allowed {
		if s == to {
			return true
		}
	}

	return false
}