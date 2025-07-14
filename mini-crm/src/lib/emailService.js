// src/lib/emailService.js
import { logEmailAttempt } from './api';

////////////////////////
// 🔹 Email Templates
////////////////////////
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome {{name}}! Let's get started",
    html: `
      <h2>Welcome {{name}}!</h2>
      <p>Thank you for your interest in our services. We're excited to help you achieve your goals.</p>
      <p>Our team will be in touch with you soon with more information.</p>
      <p>Best regards,<br>Your Team</p>
    `
  },
  followup: {
    subject: "Following up on your inquiry, {{name}}",
    html: `
      <h2>Hi {{name}},</h2>
      <p>We wanted to follow up on your recent inquiry. Do you have any questions we can help answer?</p>
      <p>Feel free to reply to this email or give us a call.</p>
      <p>Best regards,<br>Your Team</p>
    `
  },
  reminder: {
    subject: "Reminder: {{name}}, we're here to help",
    html: `
      <h2>Hi {{name}},</h2>
      <p>Just a friendly reminder that we're here to help with your needs.</p>
      <p>Don't hesitate to reach out if you have any questions.</p>
      <p>Best regards,<br>Your Team</p>
    `
  }
};

////////////////////////
// 🔹 Email Service Functions
////////////////////////
export async function sendEmailViaResend(to, subject, htmlContent, leadId, showToast) {
  try {
    console.log(`Attempting to send email to: ${to}`);
    
    // Show loading toast
    if (showToast) {
      showToast({
        type: 'loading',
        title: 'Sending Email',
        message: `Sending email to ${to}...`,
        duration: 0 // Keep showing until we update it
      });
    }

    const res = await fetch('http://localhost:8000/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html: htmlContent }),
    });

    const result = await res.json();

    if (result.success) {
      await logEmailAttempt(leadId, to, subject, 'sent', null);
      console.log('Email sent successfully via Resend API');
      
      // Show success toast
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Email Sent Successfully',
          message: `Email successfully sent to ${to}`,
          duration: 4000
        });
      }
    } else {
      await logEmailAttempt(leadId, to, subject, 'failed', result.error);
      console.error('Email sending failed:', result.error);
      
      // Show error toast
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Email Failed to Send',
          message: `Failed to send email to ${to}: ${result.error}`,
          duration: 6000
        });
      }
    }

    return result;
  } catch (err) {
    console.error('Email sending failed:', err);
    await logEmailAttempt(leadId, to, subject, 'failed', err.message);
    
    // Show error toast for network/connection issues
    if (showToast) {
      showToast({
        type: 'error',
        title: 'Email Service Error',
        message: `Network error: ${err.message}`,
        duration: 6000
      });
    }
    return { success: false, error: err.message };
  }
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}