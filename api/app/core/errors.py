"""Standardized Error Handlers and Schema for Khabo Kothay? API."""

import uuid

from fastapi import HTTPException, Request
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
    def __init__(
        self,
        code: str = "INTERNAL_ERROR",
        message: str = "An unexpected error occurred.",
        hint: str = "Please try again later.",
        status_code: int = 500,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.hint = hint
        self.status_code = status_code


async def app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    code = getattr(exc, "code", "INTERNAL_ERROR")
    message = getattr(exc, "message", str(exc))
    hint = getattr(exc, "hint", "Please try again later.")
    status_code = getattr(exc, "status_code", 500)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "hint": hint,
                "requestId": request_id,
            }
        },
    )


async def generic_http_error_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    code_map = {
        400: "BAD_INPUT",
        404: "NOT_FOUND",
        429: "RATE_LIMITED",
        500: "UPSTREAM_TIMEOUT",
        503: "SERVER_WAKING",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
                "hint": "Check request parameters and try again.",
                "requestId": request_id,
            }
        },
    )
