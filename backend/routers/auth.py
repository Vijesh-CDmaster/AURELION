"""Authentication endpoints — simple JWT-based auth."""

import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from dotenv import load_dotenv

from ..services.grid_simulator import simulator

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "grid-entropy-sentinel-secret-2026")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

# Role-based page access
ROLE_PAGES = {
    "admin": list(range(1, 13)),
    "operator": [1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
    "viewer": [1, 2, 4, 5, 9],
}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str
    role: str
    name: str
    allowed_pages: list


def _create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = simulator.users.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token({
        "sub": req.username,
        "role": user["role"],
        "name": user["name"],
    })
    return TokenResponse(
        token=token,
        role=user["role"],
        name=user["name"],
        allowed_pages=ROLE_PAGES.get(user["role"], []),
    )


@router.get("/verify")
async def verify(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "valid": True,
            "username": payload["sub"],
            "role": payload["role"],
            "name": payload["name"],
        }
    except Exception:
        return {"valid": False}
