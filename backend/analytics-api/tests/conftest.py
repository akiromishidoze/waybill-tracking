import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.main import app
from app.core.config import settings
from app.core.database import get_db
from app.core.ratelimit import rate_limit

_test_token = jwt.encode(
    {"sub": "test-user-id", "role": "ADMIN", "name": "Test User"},
    settings.JWT_SECRET,
    algorithm="HS256",
)


async def _mock_db():
    session = MagicMock()
    session.execute = AsyncMock(side_effect=Exception("no db in ci"))
    session.close = AsyncMock()
    yield session


def _noop_rate_limit(*args, **kwargs):
    async def _dep():
        return None
    return _dep


@pytest_asyncio.fixture
async def async_client():
    app.dependency_overrides[get_db] = _mock_db
    app.dependency_overrides[rate_limit] = _noop_rate_limit
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {_test_token}"},
    ) as c:
        yield c
    app.dependency_overrides.clear()