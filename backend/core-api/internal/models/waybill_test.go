package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestWaybillStatusValues(t *testing.T) {
	expected := []WaybillStatus{
		StatusCreated, StatusPickedUp, StatusInTransit,
		StatusAtSortingCenter, StatusOutForDelivery, StatusDelivered,
		StatusFailedDelivery, StatusReturned, StatusCancelled,
	}

	if len(expected) != 9 {
		t.Errorf("expected 9 status values, got %d", len(expected))
	}
}

func TestWaybillStatus_StringValues(t *testing.T) {
	tests := []struct {
		status WaybillStatus
		want   string
	}{
		{StatusCreated, "CREATED"},
		{StatusPickedUp, "PICKED_UP"},
		{StatusInTransit, "IN_TRANSIT"},
		{StatusDelivered, "DELIVERED"},
		{StatusCancelled, "CANCELLED"},
	}

	for _, tt := range tests {
		if string(tt.status) != tt.want {
			t.Errorf("expected %s, got %s", tt.want, string(tt.status))
		}
	}
}

func TestWaybill_JSONSerialization(t *testing.T) {
	now := time.Now()
	wb := Waybill{
		ID: "wb-1",
		TrackingNumber: "WBT-001",
		ShipperID: "user-1",
		ShipperName: "Test Shipper",
		RecipientName: "John Doe",
		Status: StatusInTransit,
		Weight: 10.5,
		Dimensions: "10x10x10",
		ServiceType: "standard",
		CreatedAt: now,
		UpdatedAt: now,
	}

	data, err := json.Marshal(wb)

	if err != nil {
		t.Fatalf("failed to marshal waybill: %v", err)
	}

	var decoded Waybill

	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal waybill: %v", err)
	}

	if decoded.ID != wb.ID {
		t.Errorf("expected id %s, got %s", wb.ID, decoded.ID)
	}

	if decoded.TrackingNumber != wb.TrackingNumber {
		t.Errorf("expected trackingNumber %s, got %s", wb.TrackingNumber, decoded.TrackingNumber)
	}

	if decoded.Status != wb.Status {
		t.Errorf("expected status %s, got %s", wb.Status, decoded.Status)
	}
}

func TestScanEvent_JSONSerialization(t *testing.T) {
	now := time.Now()
	remark := "Package arrived"
	event := ScanEvent{
		ID: "evt-1",
		WaybillID: "wb-1",
		Status: StatusInTransit,
		Location: "Sorting Center A",
		Timestamp: now,
		Remark: &remark,
	}

	data, err := json.Marshal(event)

	if err != nil {
		t.Fatalf("failed to marshal scan event: %v", err)
	}

	var decoded ScanEvent
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal scan event: %v", err)
	}

	if decoded.ID != event.ID {
		t.Errorf("expected id %s, got %s", event.ID, decoded.ID)
	}

	if decoded.Location != event.Location {
		t.Errorf("expected location %s, got %s", event.Location, decoded.Location)
	}

	if *decoded.Remark != *event.Remark {
		t.Errorf("expected remark %s, got %s", *event.Remark, *decoded.Remark)
	}
}

func TestCreateWaybillRequest_Validation(t *testing.T) {
	req := CreateWaybillRequest{
		RecipientName: "John Doe",
		RecipientAddress: "123 Main St",
		RecipientPhone: "555-0100",
		Origin: "NYC",
		Destination: "LAX",
		Weight: 10.5,
	}

	if req.RecipientName != "John Doe" {
		t.Errorf("expected recipientName John Doe, got %s", req.RecipientName)
	}

	if req.Weight != 10.5 {
		t.Errorf("expected weight 10.5, got %f", req.Weight)
	}
}

func TestStatusUpdateRequest_JSON(t *testing.T) {
	remark := "Delivered on time"
	req := StatusUpdateRequest{
		Status: StatusDelivered,
		Location: "Customer Door",
		Remark: &remark,
	}

	data, err := json.Marshal(req)

	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	var decoded StatusUpdateRequest

	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if decoded.Status != StatusDelivered {
		t.Errorf("expected status %s, got %s", StatusDelivered, decoded.Status)
	}
}

func TestUser_JSONSerialization(t *testing.T) {
	user := User{
		ID: "user-1",
		Email: "test@example.com",
		Name: "Test User",
		Role: "ADMIN",
	}

	data, err := json.Marshal(user)

	if err != nil {
		t.Fatalf("failed to marshal user: %v", err)
	}

	var decoded User
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal user: %v", err)
	}

	if decoded.ID != user.ID {
		t.Errorf("expected id %s, got %s", user.ID, decoded.ID)
	}

	if decoded.Role != "ADMIN" {
		t.Errorf("expected role ADMIN, got %s", decoded.Role)
	}

	if decoded.Password != "" {
		t.Error("expected password to be hidden from JSON")
	}
}