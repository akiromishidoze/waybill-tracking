import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.main import app
from app.core.config import settings

_test_token = jwt.encode(
    {"sub": "test-user-id", "role": "ADMIN", "name": "Test User"},
    settings.JWT_SECRET,
    algorithm="HS256",
)

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {_test_token}"},
    ) as c:
        yield c