import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request, Form, status
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter(prefix="/mock", tags=["Mock Career Portal"])


@router.get("/apply/{job_id}", response_class=HTMLResponse)
async def get_mock_application_form(
    job_id: str,
    captcha: Optional[bool] = False,
):
    """
    Simulated Employer Career Portal Application Page.
    Used for safe, ethical end-to-end automation testing.
    """
    captcha_html = ""
    if captcha:
        captcha_html = """
        <div class="captcha-box" id="captcha-container" style="border: 2px solid #e11d48; padding: 12px; margin-bottom: 16px; border-radius: 6px; background: #fff1f2;">
            <p style="color: #9f1239; font-weight: bold; margin: 0 0 8px 0;">Bot Protection: Solve CAPTCHA to proceed</p>
            <div id="g-recaptcha" class="recaptcha-checkbox">I am not a robot [Challenge Active]</div>
            <input type="hidden" name="captcha_solved" value="false" />
        </div>
        """

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Mock Career Portal - Job Application</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 30px; }}
        .form-card {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }}
        h1 {{ font-size: 20px; color: #1e293b; margin-top: 0; }}
        label {{ display: block; font-size: 13px; font-weight: 600; color: #475569; margin-top: 14px; margin-bottom: 4px; }}
        input, select, textarea {{ width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }}
        button {{ width: 100%; margin-top: 20px; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 15px; cursor: pointer; }}
        button:hover {{ background: #1d4ed8; }}
    </style>
</head>
<body>
    <div class="form-card">
        <h1>Submit Application for Job #{job_id}</h1>
        <form method="POST" action="/mock/apply/{job_id}" enctype="multipart/form-data" id="application-form">
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" required placeholder="John Doe" />

            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" />

            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" required placeholder="+1 555-0199" />

            <label for="location">Current Location</label>
            <input type="text" id="location" name="location" required placeholder="Bangalore, India" />

            <label for="notice_period">Notice Period</label>
            <input type="text" id="notice_period" name="notice_period" required placeholder="Immediate" />

            <label for="sponsorship">Sponsorship Required?</label>
            <select id="sponsorship" name="sponsorship">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
            </select>

            <label for="cover_note">Cover Note</label>
            <textarea id="cover_note" name="cover_note" rows="3" placeholder="Brief statement of interest..."></textarea>

            {captcha_html}

            <button type="submit" id="submit-btn">Submit Application</button>
        </form>
    </div>
</body>
</html>
    """
    return HTMLResponse(content=html_content)


@router.post("/apply/{job_id}", response_class=JSONResponse)
async def submit_mock_application(
    job_id: str,
    request: Request,
):
    """
    Process application submission.
    Simulates employer backend verification, detects CAPTCHA flags,
    and returns a verifiable submission receipt.
    """
    # Accept JSON or form-data
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
    else:
        form = await request.form()
        body = dict(form)

    # Check for active unresolved CAPTCHA challenge
    if body.get("captcha_solved") == "false" or request.query_params.get("captcha") == "true":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "CAPTCHA_CHALLENGE_REQUIRED",
                "message": "Human verification required. Automation stopped ethically.",
            },
        )

    # Generate receipt code
    receipt_code = f"REC-MOCK-{uuid.uuid4().hex[:10].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "APPLIED_CONFIRMED",
            "receipt_code": receipt_code,
            "job_id": job_id,
            "applicant_name": body.get("full_name", "Applicant"),
            "submitted_at": now_iso,
            "message": "Application received and logged in employer portal.",
        },
    )
