import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * ShipShaft - Server-Only Email Delivery Service
 * Handles delivery verification OTP notifications and transactional emails.
 */

const OUTBOX_PATH = path.join(process.cwd(), '.next', 'test-mail-outbox.json');

/**
 * Get or create Nodemailer transporter based on server environment.
 */
export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Real SMTP transport configured
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to simulated development / test transport
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

/**
 * Sends a real or simulated delivery verification OTP email.
 *
 * @param {Object} params
 * @param {string} params.to - Customer recipient email address (from User record)
 * @param {string} params.trackingNumber - Shipment tracking identifier (e.g. SHP-BA63B125)
 * @param {string} params.otp - Plaintext 6-digit OTP
 * @param {number} [params.expiresInMinutes=10] - Validity window in minutes
 * @param {boolean} [params.simulateFailure=false] - For controlled failure testing
 * @returns {Promise<{ messageId: string, accepted: string[] }>}
 */
export async function sendDeliveryOtpEmail({
  to,
  trackingNumber,
  otp,
  expiresInMinutes = 10,
  simulateFailure = false,
}) {
  if (simulateFailure) {
    throw new Error('Simulated SMTP delivery failure for testing.');
  }

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    throw new Error('Valid customer recipient email address is required.');
  }

  if (!trackingNumber) {
    throw new Error('Tracking number is required for OTP email.');
  }

  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    throw new Error('Valid 6-digit OTP is required for delivery email.');
  }

  const fromAddress = process.env.SMTP_FROM || '"ShipShaft Logistics" <no-reply@shipshaft.com>';
  const subject = `ShipShaft Delivery Verification OTP — ${trackingNumber}`;

  const plainText = `ShipShaft

Your shipment is out for delivery.

Tracking Number:
${trackingNumber}

Your delivery verification OTP is:
${otp}

This OTP expires in ${expiresInMinutes} minutes.

Please provide this OTP to the authorized delivery agent when your shipment is delivered.

Security notice:
Never share this OTP with anyone other than the delivery agent handling your shipment.

This is an automated message. Please do not reply.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #004b90 0%, #0066c0 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; }
    .content { padding: 32px 28px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #004b90; margin-bottom: 8px; }
    .headline { font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a; }
    .tracking-chip { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-family: monospace; font-size: 14px; font-weight: 700; color: #004b90; margin-bottom: 24px; }
    .otp-box { background: #f0f7ff; border: 2px dashed #0066c0; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 8px; }
    .otp-code { font-family: monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #004b90; margin: 0; }
    .otp-validity { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .instruction { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .security-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #92400e; margin-top: 24px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ShipShaft Logistics</h1>
      <p>Autonomous Cargo & Express Parcel Network</p>
    </div>
    <div class="content">
      <div class="eyebrow">Out for Delivery</div>
      <h2 class="headline">Your delivery verification code is ready</h2>
      <p class="instruction">Your courier is currently in transit to your registered destination address.</p>
      
      <div>
        <span class="tracking-chip">Waybill #${trackingNumber}</span>
      </div>

      <div class="otp-box">
        <div class="otp-label">Delivery Verification OTP</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">Expires in ${expiresInMinutes} minutes • One-time use only</div>
      </div>

      <p class="instruction">
        Please provide this 6-digit verification code to the authorized ShipShaft delivery agent upon handover.
      </p>

      <div class="security-notice">
        <strong>Security Notice:</strong> Never share this OTP with anyone prior to package arrival. ShipShaft personnel will never ask for this code over the phone or email.
      </div>
    </div>
    <div class="footer">
      This is an automated security dispatch from ShipShaft. Please do not reply directly to this email.<br>
      © ${new Date().getFullYear()} ShipShaft Logistics Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  const transporter = getTransporter();
  let info;
  try {
    info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: plainText,
      html,
    });
  } catch (error) {
    console.error(`[OTP EMAIL ERROR] Nodemailer sendMail error for ${to}:`, error.message || error);
    throw error;
  }

  // In development / test environment, write to outbox file for automated verification
  if (process.env.NODE_ENV !== 'production') {
    try {
      const outboxDir = path.dirname(OUTBOX_PATH);
      if (!fs.existsSync(outboxDir)) {
        fs.mkdirSync(outboxDir, { recursive: true });
      }
      fs.writeFileSync(
        OUTBOX_PATH,
        JSON.stringify({
          to,
          subject,
          trackingNumber,
          otp,
          expiresInMinutes,
          timestamp: new Date().toISOString(),
          messageId: info.messageId || `test-${Date.now()}`,
        }),
        'utf8'
      );
    } catch {
      // Ignore file write errors
    }
  }

  return {
    messageId: info.messageId || `sent-${Date.now()}`,
    accepted: [to],
  };
}
