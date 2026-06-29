from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class ECommerceOrder:
    order_id: str
    recipient_name: str
    recipient_address: str
    recipient_phone: str
    recipient_email: str | None
    origin: str
    destination: str
    weight: float
    dimensions: str | None
    service_type: str | None
    items: list[dict[str, Any]] | None
    created_at: datetime | None = None


class ECommerceAdapter(ABC):
    def __init__(self, platform: dict[str, Any]):
        self.platform = platform

    @abstractmethod
    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        """Return orders from the platform created or updated since the given timestamp."""
        raise NotImplementedError

    def supports(self, platform_name: str) -> bool:
        return self.platform.get("platform", "").lower() == platform_name.lower()
