from typing import Any

from app.integrations.carriers.base import CarrierAdapter
from app.integrations.carriers.generic import GenericJsonCarrierAdapter
from app.integrations.carriers.jnt import JNTExpressAdapter
from app.integrations.carriers.lbc import LBCAdapter
from app.integrations.carriers.mock import MockCarrierAdapter
from app.integrations.carriers.twogo import TwoGoAdapter


BUILTIN_ADAPTERS: list[type[CarrierAdapter]] = [
    MockCarrierAdapter,
    JNTExpressAdapter,
    LBCAdapter,
    TwoGoAdapter,
    GenericJsonCarrierAdapter,
]


def get_adapter(carrier: dict[str, Any]) -> CarrierAdapter:
    name = carrier.get("name", "")
    for adapter_cls in BUILTIN_ADAPTERS:
        adapter = adapter_cls(carrier)
        if adapter.supports(name):
            return adapter
    return GenericJsonCarrierAdapter(carrier)
