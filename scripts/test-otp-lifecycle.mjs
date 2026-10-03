import mongoose from 'mongoose';
import fs from 'fs';

if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  }
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';
const BASE_URL = 'http://localhost:3000';

async function testLifecycle() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const ShipmentCol = db.collection('shipments');
  const UserCol = db.collection('users');
  const AgentCol = db.collection('agents');

  console.log('\n=== STEP 1: PREPARE SHIPMENT SHP-0F7A96A3 AT DESTINATION_HUB ===');
  const shipment = await ShipmentCol.findOne({ trackingNumber: 'SHP-0F7A96A3' });
  if (!shipment) {
    throw new Error('Shipment SHP-0F7A96A3 not found!');
  }

  const customer = await UserCol.findOne({ _id: shipment.customerId });
  const agent = await AgentCol.findOne({ _id: shipment.agentId });

  console.log('Shipment:', shipment.trackingNumber);
  console.log('Customer:', customer?.name, `(${customer?.email})`);
  console.log('Agent:', agent?.employeeId);

  // Set shipment to DESTINATION_HUB for transition test
  await ShipmentCol.updateOne(
    { _id: shipment._id },
    {
      $set: {
        status: 'DESTINATION_HUB',
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpVerifiedAt: null,
      },
    }
  );
  console.log('Shipment status reset to DESTINATION_HUB for transition test.');

  console.log('\n=== STEP 2: LOGIN AS PRIYA SHARMA ===');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'agent.blr001@shipshaft.test',
      password: 'ShipShaft@2026!',
    }),
  });
  const setCookie = loginRes.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  if (loginRes.status !== 200 || !cookie) {
    throw new Error('Login failed for Priya Sharma!');
  }
  console.log('Priya Sharma logged in successfully.');

  console.log('\n=== STEP 3: TRANSITION TO OUT_FOR_DELIVERY VIA AGENT STATUS API ===');
  const statusRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-0F7A96A3/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const statusData = await statusRes.json();
  console.log('Status update response:', statusRes.status, statusData);

  console.log('\n=== STEP 4: VERIFY SHIPMENT IN MONGODB ===');
  const updatedShipment = await ShipmentCol.findOne({ _id: shipment._id });
  console.log('Shipment status in DB:', updatedShipment.status);
  console.log('otpHash exists:', Boolean(updatedShipment.otpHash));
  console.log('otpExpiresAt:', updatedShipment.otpExpiresAt);
  console.log('otpAttempts:', updatedShipment.otpAttempts);
  console.log('otpVerifiedAt:', updatedShipment.otpVerifiedAt);

  console.log('\n=== STEP 5: VERIFY OUTBOX EMAIL DISPATCH ===');
  const outboxPath = '.next/test-mail-outbox.json';
  if (fs.existsSync(outboxPath)) {
    const outboxData = JSON.parse(fs.readFileSync(outboxPath, 'utf8'));
    console.log('Outbox recipient:', outboxData.to);
    console.log('Outbox subject:', outboxData.subject);
    console.log('Outbox trackingNumber:', outboxData.trackingNumber);
    console.log('Recipient matches customer email:', outboxData.to === customer.email);

    const receivedOtp = outboxData.otp;
    console.log('Received OTP is 6 digits:', receivedOtp?.length === 6 && /^\d{6}$/.test(receivedOtp));

    console.log('\n=== STEP 6: VERIFY OTP VERIFICATION (OUT_FOR_DELIVERY -> DELIVERED) ===');
    // Agent verifies correct OTP
    const verifyRes = await fetch(`${BASE_URL}/api/shipments/SHP-0F7A96A3/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ otp: receivedOtp }),
    });
    const verifyData = await verifyRes.json();
    console.log('OTP Verification Response:', verifyRes.status, verifyData);

    const deliveredShipment = await ShipmentCol.findOne({ _id: shipment._id });
    console.log('Shipment status after OTP verification:', deliveredShipment.status);
    console.log('otpVerifiedAt is set:', Boolean(deliveredShipment.otpVerifiedAt));

    console.log('\n=== STEP 7: VERIFY OTP REUSE REJECTED ===');
    const reuseRes = await fetch(`${BASE_URL}/api/shipments/SHP-0F7A96A3/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ otp: receivedOtp }),
    });
    const reuseData = await reuseRes.json();
    console.log('OTP Reuse Response Status (expect 400):', reuseRes.status);
    console.log('OTP Reuse Response Data:', reuseData);
  } else {
    console.log('Outbox file not found.');
  }

  await mongoose.disconnect();
}

testLifecycle().catch(err => {
  console.error('Lifecycle test error:', err);
  process.exit(1);
});
