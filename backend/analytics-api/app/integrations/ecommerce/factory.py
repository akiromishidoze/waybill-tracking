from typing import Any

from app.integrations.ecommerce.base import ECommerceAdapter
from app.integrations.ecommerce.generic import GenericJsonECommerceAdapter
from app.integrations.ecommerce.lazada import LazadaAdapter
from app.integrations.ecommerce.mock import MockECommerceAdapter
from app.integrations.ecommerce.shopee import ShopeeAdapter
from app.integrations.ecommerce.shopify import ShopifyAdapter


BUILTIN_ADAPTERS: list[type[ECommerceAdapter]] = [
    MockECommerceAdapter,
    ShopifyAdapter,
    LazadaAdapter,
    ShopeeAdapter,
    GenericJsonECommerceAdapter,
]


def get_adapter(platform: dict[str, Any]) -> ECommerceAdapter:
    name = platform.get("platform", "")
    for adapter_cls in BUILTIN_ADAPTERS:
        adapter = adapter_cls(platform)
        if adapter.supports(name):
            return adapter
    return GenericJsonECommerceAdapter(platform)
