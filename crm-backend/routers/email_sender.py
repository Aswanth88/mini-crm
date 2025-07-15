from fastapi import APIRouter, Request
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
        
        # Get SMTP configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER")  # e.g., "smtp.gmail.com"
        smtp_port = int(os.getenv("SMTP_PORT", "587"))  # Default to 587 for TLS
        smtp_username = os.getenv("SMTP_USERNAME")  # Your email
        smtp_password = os.getenv("SMTP_PASSWORD")  # Your email password or app password
        from_email = os.getenv("FROM_EMAIL", smtp_username)  # Sender email
        
        # Validate required environment variables
        if not all([smtp_server, smtp_username, smtp_password]):
            raise ValueError("Missing required SMTP configuration: SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"Workflow Bot <{from_email}>"
        msg['To'] = to
        
        # Create HTML part
        html_part = MIMEText(html, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Enable TLS encryption
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        return {"success": True, "data": {"message": "Email sent successfully"}}
        
    except Exception as e:
        print("🔥 Email sending failed:")
        traceback.print_exc()
        return {"success": False, "error": str(e)}