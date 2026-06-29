from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class TrackingEvent:
    status: str
    location: str
    timestamp: datetime
    remark: str | None = None
    raw: dict[str, Any] | None = None


class CarrierAdapter(ABC):
    def __init__(self, carrier: dict[str, Any]):
        self.carrier = carrier

    @abstractmethod
    def fetch_tracking(self, tracking_number: str) -> list[TrackingEvent]:
        """Return normalized tracking events for a carrier tracking number."""
        raise NotImplementedError

    def supports(self, carrier_name: str) -> bool:
        return self.carrier.get("name", "").lower() == carrier_name.lower()
