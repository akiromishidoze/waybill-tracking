import logging
from datetime import datetime
from typing import Any

import httpx

from app.integrations.ecommerce.base import ECommerceAdapter, ECommerceOrder

logger = logging.getLogger(__name__)


class GenericJsonECommerceAdapter(ECommerceAdapter):
    """
    Generic HTTP adapter for e-commerce platforms that expose a JSON orders endpoint.

    Expected endpoint: GET {api_endpoint}/orders?since={iso_timestamp}
    Expected response: {"orders": [{"orderId": "...", "recipientName": "...", ...}]}
    """

    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        endpoint = self.platform.get("storeUrl") or self.platform.get("apiEndpoint")
        api_key = self.platform.get("apiKey")
        api_secret = self.platform.get("apiSecret")

        if not endpoint:
            logger.warning("Platform %s has no store URL or API endpoint", self.platform.get("platform"))
            return []

        url = f"{endpoint.rstrip('/')}/orders"
        params = {}
        if since:
            params["since"] = since.isoformat()

        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = httpx.get(url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("Platform %s orders request failed: %s", self.platform.get("platform"), e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("Platform %s orders returned error: %s", self.platform.get("platform"), e)
            return []
        except ValueError as e:
            logger.error("Platform %s returned invalid JSON: %s", self.platform.get("platform"), e)
            return []

        orders = data.get("orders", []) if isinstance(data, dict) else []
        normalized = []
        for order in orders:
            if not isinstance(order, dict):
                continue
            created_at = order.get("createdAt") or order.get("created_at")
            try:
                parsed_created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00")) if created_at else datetime.utcnow()
            except (ValueError, AttributeError):
                parsed_created_at = datetime.utcnow()

            normalized.append(
                ECommerceOrder(
                    order_id=order.get("orderId", "") or order.get("order_id", ""),
                    recipient_name=order.get("recipientName", "") or order.get("recipient_name", ""),
                    recipient_address=order.get("recipientAddress", "") or order.get("recipient_address", ""),
                    recipient_phone=order.get("recipientPhone", "") or order.get("recipient_phone", ""),
                    recipient_email=order.get("recipientEmail") or order.get("recipient_email"),
                    origin=order.get("origin", ""),
                    destination=order.get("destination", ""),
                    weight=float(order.get("weight", 0) or 0),
                    dimensions=order.get("dimensions"),
                    service_type=order.get("serviceType") or order.get("service_type") or "STANDARD",
                    items=order.get("items"),
                    created_at=parsed_created_at,
                )
            )

        return normalized
