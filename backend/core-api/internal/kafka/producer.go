package kafka

import (
	"context"
	"encoding/json"

	"github.com/segmentio/kafka-go"
	"github.com/waybill-tracking/core-api/internal/models"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(brokers, defaultTopic string) *Producer {
	w := &kafka.Writer{
		Addr:     kafka.TCP(brokers),
		Topic:    defaultTopic,
		Balancer: &kafka.LeastBytes{},
	}
	return &Producer{writer: w}
}

func (p *Producer) PublishScanEvent(ctx context.Context, event models.ScanEvent) error {
	data, _ := json.Marshal(event)
	return p.writer.WriteMessages(ctx, kafka.Message{
		Topic: "scan-events",
		Key:   []byte(event.WaybillID),
		Value: data,
	})
}

func (p *Producer) PublishStatusChange(ctx context.Context, wb models.Waybill) error {
	data, _ := json.Marshal(wb)
	return p.writer.WriteMessages(ctx, kafka.Message{
		Topic: "status-changes",
		Key:   []byte(wb.ID),
		Value: data,
	})
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
