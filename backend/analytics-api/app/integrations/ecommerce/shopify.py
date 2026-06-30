import logging
from datetime import datetime

import httpx

from app.integrations.ecommerce.base import ECommerceAdapter, ECommerceOrder

logger = logging.getLogger(__name__)


class ShopifyAdapter(ECommerceAdapter):
    """
    Adapter for Shopify stores using the Shopify REST Admin API.

    Required platform fields:
        storeUrl   → https://{shop}.myshopify.com
        apiKey     → Admin API access token (X-Shopify-Access-Token)

    Endpoint: GET {storeUrl}/admin/api/2024-01/orders.json
    Docs: https://shopify.dev/docs/api/admin-rest/2024-01/resources/order
    """

    _API_VERSION = "2024-01"

    def fetch_orders(self, since: datetime | None = None) -> list[ECommerceOrder]:
        store_url = self.platform.get("storeUrl", "").rstrip("/")
        api_key = self.platform.get("apiKey", "")

        if not store_url or not api_key:
            logger.warning("Shopify platform missing storeUrl or apiKey")
            return []

        url = f"{store_url}/admin/api/{self._API_VERSION}/orders.json"
        params: dict = {"status": "open", "limit": 250}
        if since:
            params["created_at_min"] = since.isoformat()

        headers = {"X-Shopify-Access-Token": api_key, "Content-Type": "application/json"}

        try:
            response = httpx.get(url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except httpx.RequestError as e:
            logger.error("Shopify request failed: %s", e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("Shopify returned error: %s", e)
            return []
        except ValueError as e:
            logger.error("Shopify invalid JSON: %s", e)
            return []

        orders: list[ECommerceOrder] = []
        for order in data.get("orders", []):
            shipping = (order.get("shipping_address") or {})
            billing = (order.get("billing_address") or {})
            address = shipping or billing

            recipient_address = ", ".join(
                filter(None, [
                    address.get("address1", ""),
                    address.get("city", ""),
                    address.get("province", ""),
                    address.get("country", ""),
                ])
            )

            raw_ts = order.get("created_at", "")
            try:
                created_at = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")) if raw_ts else datetime.utcnow()
            except ValueError:
                created_at = datetime.utcnow()

            total_weight_g = sum(
                (item.get("grams", 0) or 0) for item in order.get("line_items", [])
            )

            orders.append(
                ECommerceOrder(
                    order_id=str(order.get("id", "")),
                    recipient_name=address.get("name", "") or order.get("contact_email", ""),
                    recipient_address=recipient_address,
                    recipient_phone=address.get("phone", "") or order.get("phone", ""),
                    recipient_email=order.get("contact_email"),
                    origin=self.platform.get("store_name", "Shopify Store"),
                    destination=address.get("city", "") or address.get("country", ""),
                    weight=round(total_weight_g / 1000, 3),
                    dimensions=None,
                    service_type="STANDARD",
                    items=order.get("line_items"),
                    created_at=created_at,
                )
            )
        return orders

    def supports(self, platform_name: str) -> bool:
        return "shopify" in platform_name.lower()
