import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from backend.app.models.user_profile import UserProfile


def test_password_hashing():
    raw_password = "SecretPassword123!"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_creation_and_decoding():
    user_id = "test-user-uuid-1234"
    token = create_access_token(subject=user_id)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded == user_id


def test_jwt_token_invalid():
    assert decode_access_token("invalid.token.here") is None


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_and_get_me_success(db_session):
    # 1. Create a test candidate in test database
    test_user = UserProfile(
        id=uuid.uuid4(),
        full_name="Jane Doe",
        email="jane.doe@example.com",
        hashed_password=get_password_hash("ValidPass123!"),
        skills=["Python", "FastAPI"],
    )
    db_session.add(test_user)
    db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 2. Login
        login_res = await client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={"email": "jane.doe@example.com", "password": "ValidPass123!"},
        )
        assert login_res.status_code == 200
        token_data = login_res.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # 3. Access protected /me endpoint with Bearer token
        token = token_data["access_token"]
        me_res = await client.get(
            f"{settings.API_V1_PREFIX}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        user_info = me_res.json()
        assert user_info["email"] == "jane.doe@example.com"
        assert user_info["full_name"] == "Jane Doe"


@pytest.mark.asyncio
async def test_auth_me_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"{settings.API_V1_PREFIX}/auth/me")
        assert response.status_code == 401
