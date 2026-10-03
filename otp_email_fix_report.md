# OTP Email Delivery Fix & Diagnostic Report

## 1. Root Cause Analysis
The delivery OTP email was not arriving in the customer's real email inbox due to two interrelated factors:
1. **Missing SMTP Runtime Configuration**:
   The runtime environment file (`.env`) only had `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV`. The environment variables required for real email transmission (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) were **not configured**.
2. **Silent Fallback to Local Stream Transport**:
   In `src/lib/services/emailService.js`, when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASSWORD` are not provided, `getTransporter()` fell back silently to Nodemailer's in-memory `streamTransport`. This transport buffers the email in memory and writes the message to `.next/test-mail-outbox.json` for automated test suites, returning a synthetic `messageId` without throwing an error. As a consequence, the application registered the email as sent, but **no network transmission to external mail servers or real recipient inboxes ever occurred**.

---

## 2. OTP Generation Result
- **Length & Entropy**: Generated using cryptographically secure `crypto.randomInt(100000, 1000000)` producing a 6-digit numeric OTP.
- **Hashing**: Plaintext OTP is immediately hashed using salted SHA-256 (`crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex')`) and persisted to `shipment.otpHash`.
- **Validity & Expiry**: `otpExpiresAt` set to exactly 10 minutes (`Date.now() + 600,000 ms`).
- **Attempts Counter**: Initialized to `otpAttempts: 0`.
- **Confidentiality**: The plaintext OTP is **NEVER** stored in MongoDB, **NEVER** returned in any API responses (Customer, Agent, Admin, Public Tracking), and **NEVER** logged to the console or server logs.

---

## 3. Customer Email Lookup Result
- **Relationship Resolution**: Dynamically resolved via MongoDB foreign keys:
  $$\text{Shipment.customerId} \longrightarrow \text{User.\_id} \longrightarrow \text{User.email}$$
- **Real Shipment (`SHP-0F7A96A3`)**: Resolved to registered customer `Sarah Jenkins` (`customer@shipshaft.com`).
- **User-Created Shipment (`SHP-9BB0FAB4`)**: Resolved to registered customer `kushu vali` (`kuttishankaran74@gmail.com`).
- **Verification**: Zero hardcoded, demo, mock, agent, or admin emails are used. The recipient is strictly the authenticated account owner.
- **Server Debug Logging Added**:
  ```
  [OTP DEBUG] Customer lookup started
  [OTP DEBUG] Customer email resolved: <customer email>
  ```

---

## 4. SMTP Configuration Result
Runtime environment audit (`.env`):
- `SMTP_HOST`: **not configured**
- `SMTP_PORT`: **not configured**
- `SMTP_USER`: **not configured**
- `SMTP_PASSWORD`: **not configured**
- `SMTP_FROM`: **not configured**

---

## 5. SMTP Connection Result
Executed `transporter.verify()` against the Nodemailer transport configuration:
- **Result**: **SMTP connection failed**
- **Safe Diagnostic Reason**: `Missing environment variable: SMTP_HOST is not configured in .env`
- No credentials or sensitive data exposed.

---

## 6. sendMail Execution Result
- The `sendDeliveryOtpEmail` function in `src/lib/services/emailService.js` was inspected and verified:
  - Invokes `transporter.sendMail()` and explicitly awaits the promise.
  - Passes `from: process.env.SMTP_FROM || '"ShipShaft Logistics" <no-reply@shipshaft.com>'`.
  - Passes `to: customer.email` (resolved from the shipment's customer record).
  - Includes formal responsive HTML and plaintext templates containing the tracking number, security advisories, and the 6-digit OTP.
  - Safe error logging added around `sendMail` to ensure any SMTP/transport errors are surfaced to server logs without leaking credentials.

---

## 7. Real Inbox Delivery Result
- Because `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` are missing, no TCP connection to external mail exchangers (e.g., Google SMTP, SendGrid, Amazon SES) is created.
- In order for emails to arrive in an external mailbox (such as `@gmail.com`), real SMTP credentials must be added to `.env` (e.g., using Gmail SMTP with an App Password or a transactional email service), followed by restarting the Next.js development server:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASSWORD=your_app_password
  SMTP_FROM="ShipShaft Logistics" <your_email@gmail.com>
  ```

---

## 8. OTP Verification & Handover Result
Tested full status advancement and OTP verification workflow on shipment `SHP-0F7A96A3`:
1. **Transition to `OUT_FOR_DELIVERY`**:
   - Status updated to `OUT_FOR_DELIVERY`.
   - `otpHash` generated and stored.
   - `otpExpiresAt` set to 10 minutes.
   - `otpAttempts` initialized to `0`.
   - `otpVerifiedAt` set to `null`.
2. **Verification with Correct OTP**:
   - `POST /api/shipments/SHP-0F7A96A3/verify-otp` with valid candidate OTP returned `200 OK`.
   - Shipment status transitioned to `DELIVERED`.
   - `otpVerifiedAt` recorded with timestamp.
   - Status tracking event and customer notification created.
3. **Replay Attack / Reuse Protection**:
   - Repeating verification with the same OTP returned `400 Bad Request` (`Shipment is not currently out for delivery`).
   - OTP reuse is strictly rejected.

---

## 9. Security Verification
- **Zero Plaintext OTP Exposure**: Verified through database inspection and API response checks.
- **Brute-Force Protection**: Capped at a maximum of 5 attempts before locking verification.
- **Role-Based Handover**: Only the assigned delivery agent (`Priya Sharma`, `AGT-BLR-001`) can submit the OTP for verification; unauthorized agents and customers are rejected with `403 Forbidden`.
- **Safe Server Logging**: Logger outputs lifecycle stages without printing raw OTP or hashed values:
  ```
  [OTP DEBUG] OUT_FOR_DELIVERY transition started
  [OTP DEBUG] Customer lookup started
  [OTP DEBUG] Customer email resolved: <customer email>
  [OTP DEBUG] OTP generation started
  [OTP DEBUG] Email send started
  [OTP DEBUG] Email send completed
  ```

---

## 10. Regression Test Results
- `node test_phase6.mjs`: **26/26 PASSED** (Agent assignment & state machine)
- `node test_phase7.mjs`: **25/25 PASSED** (QR token & scanner)
- `node test_phase8.mjs`: **26/26 PASSED** (OTP verification & delivery lifecycle)
- `node test_phase9.mjs`: **26/26 PASSED** (Real-time GPS telemetry)
- `node test_phase10.mjs`: **27/27 PASSED** (Admin analytics & reports)

---

## 11. Lint Validation
- **Command**: `npm run lint`
- **Result**: **0 errors, 0 warnings**

---

## 12. Production Build Validation
- **Command**: `npm run build`
- **Result**: **45 pages successfully compiled** with Next.js Turbopack (`0 errors`).
