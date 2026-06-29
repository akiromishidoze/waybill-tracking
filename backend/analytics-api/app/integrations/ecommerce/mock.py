from datetime import datetime, timedelta
import uuid

from app.integrations.ecommerce.base import ECommerceAdapter, ECommerceOrder


class MockECommerceAdapter(ECommerceAdapter):
    """Simulated e-commerce platform adapter for testing the sync pipeline."""

    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        now = datetime.utcnow()
        return [
            ECommerceOrder(
                order_id=f"MOCK-ORDER-{uuid.uuid4().hex[:8]}",
                recipient_name="Jane Doe",
                recipient_address="Quezon City",
                recipient_phone="+639876543210",
                recipient_email="jane@example.com",
                origin="Manila",
                destination="Quezon City",
                weight=1.2,
                dimensions="10x10x10cm",
                service_type="STANDARD",
                items=[{"name": "Sample Item", "quantity": 1, "price": 99.99}],
                created_at=now - timedelta(minutes=5),
            ),
            ECommerceOrder(
                order_id=f"MOCK-ORDER-{uuid.uuid4().hex[:8]}",
                recipient_name="John Smith",
                recipient_address="Pasig City",
                recipient_phone="+639123456789",
                recipient_email="john@example.com",
                origin="Manila",
                destination="Pasig City",
                weight=2.5,
                dimensions="20x15x10cm",
                service_type="EXPRESS",
                items=[{"name": "Another Item", "quantity": 2, "price": 49.50}],
                created_at=now - timedelta(minutes=2),
            ),
        ]

    def supports(self, platform_name: str) -> bool:
        return "mock" in platform_name.lower()
