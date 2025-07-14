from fastapi import APIRouter, Request
from resend import Emails, api_key
import os
import traceback

router = APIRouter()

@router.post("/send-email")
async def send_email(request: Request):
    try:
        body = await request.json()
        to = body.get("to")
        subject = body.get("subject")
        html = body.get("html")

        # Set the API key globally
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key:
            raise ValueError("Missing RESEND_API_KEY in environment")

        # Set Resend global API key
        import resend
        resend.api_key = api_key

        # Send the email
        response = Emails.send({
            "from": "Workflow Bot <onboarding@resend.dev>",
            "to": to,
            "subject": subject,
            "html": html
        })

        return {"success": True, "data": response}
    except Exception as e:
        print("🔥 Email sending failed:")
        traceback.print_exc()
        return {"success": False, "error": str(e)}
