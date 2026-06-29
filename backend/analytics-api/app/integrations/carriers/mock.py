from datetime import datetime, timedelta
import random

from app.integrations.carriers.base import CarrierAdapter, TrackingEvent


class MockCarrierAdapter(CarrierAdapter):
    """Simulated carrier adapter for testing the carrier sync pipeline."""

    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        now = datetime.utcnow()
        return [
            TrackingEvent(
                status="PICKED_UP",
                location="Manila Hub",
                timestamp=now - timedelta(hours=12),
                remark="Shipment picked up",
            ),
            TrackingEvent(
                status="IN_TRANSIT",
                location="Cebu Sorting Center",
                timestamp=now - timedelta(hours=6),
                remark="In transit to destination",
            ),
            TrackingEvent(
                status="OUT_FOR_DELIVERY",
                location="Manila",
                timestamp=now - timedelta(hours=1),
                remark="Out for delivery",
            ),
        ]

    def supports(self, carrier_name: str) -> bool:
        return "mock" in carrier_name.lower()
