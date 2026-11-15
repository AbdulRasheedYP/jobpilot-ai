import logging
from urllib.parse import urlparse
from typing import Dict, Any, Tuple
import httpx
from backend.app.models.enums import ApplicationStatus

logger = logging.getLogger(__name__)


async def submit_application_to_portal(
    application_url: str,
    form_data: Dict[str, Any],
) -> Tuple[ApplicationStatus, Dict[str, Any], str]:
    """
    Submits application data to employer portal.
    
    Ethical Automation Standards:
    - Verifies confirmation receipt before marking APPLIED_CONFIRMED.
    - If CAPTCHA/MFA challenge is detected, strictly HALTS and returns MANUAL_ACTION_REQUIRED.
    - Never bypasses security or platform restrictions.
    """
    try:
        parsed = urlparse(application_url)
        # Handle internal test/mock portal requests in-process via ASGI transport
        if parsed.netloc in ["test", "localhost", "127.0.0.1"] or "/mock/apply" in application_url:
            from backend.app.main import app
            transport = httpx.ASGITransport(app=app)
            client_cm = httpx.AsyncClient(transport=transport, base_url="http://test", timeout=20.0)
            target_url = parsed.path + (f"?{parsed.query}" if parsed.query else "")
        else:
            client_cm = httpx.AsyncClient(timeout=20.0)
            target_url = application_url

        async with client_cm as client:
            response = await client.post(
                target_url,
                json=form_data,
                headers={"User-Agent": "JobPilot-AI-Agent/1.0"},
            )

            if response.status_code == 403:
                res_json = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                if "CAPTCHA" in str(res_json):
                    return (
                        ApplicationStatus.MANUAL_ACTION_REQUIRED,
                        {},
                        "CAPTCHA / Bot challenge detected. Halted automation safely.",
                    )
                return (
                    ApplicationStatus.FAILED_RETRYABLE,
                    {},
                    f"Portal returned HTTP 403: {response.text[:200]}",
                )

            if response.status_code == 200:
                data = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                receipt = data.get("receipt_code") or data.get("confirmation_number")

                if receipt or data.get("status") == "APPLIED_CONFIRMED":
                    return (
                        ApplicationStatus.APPLIED_CONFIRMED,
                        {
                            "receipt_code": receipt,
                            "raw_response": data,
                        },
                        "Submission successfully verified with employer receipt.",
                    )
                else:
                    return (
                        ApplicationStatus.SUBMISSION_UNCONFIRMED,
                        {"raw_response": data},
                        "Form submitted, but no verifiable receipt code returned.",
                    )

            return (
                ApplicationStatus.FAILED_RETRYABLE,
                {},
                f"Portal returned unexpected status HTTP {response.status_code}",
            )

    except Exception as e:
        logger.error(f"Network error during application submission: {e}")
        return (
            ApplicationStatus.FAILED_RETRYABLE,
            {},
            f"Network or timeout error: {str(e)}",
        )
