"""Standardized Error Handlers and Schema for Khabo Kothay? API."""
import uuid
from typing import Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str
    hint: str
    requestId: str

class ErrorResponse(BaseModel):
    error: ErrorDetail

class AppError(Exception):
    def __init__(self, code: str, message: str, hint: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.hint = hint
        self.status_code = status_code

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "hint": exc.hint,
                "requestId": request_id
            }
        }
    )

async def generic_http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    code_map = {
        400: "BAD_INPUT",
        404: "NO_RESULTS",
        429: "RATE_LIMITED",
        500: "UPSTREAM_TIMEOUT",
        503: "SERVER_WAKING"
    }
    code = code_map.get(exc.status_code, "BAD_INPUT")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail) if exc.detail else "An HTTP error occurred",
                "hint": "Check request parameters and try again.",
                "requestId": request_id
            }
        }
    )
