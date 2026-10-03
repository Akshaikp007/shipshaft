import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/shipshaft';
const BASE_URL = 'http://localhost:3000';

async function setupOutForDelivery() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Reset to DESTINATION_HUB
  await db.collection('shipments').updateOne(
    { trackingNumber: 'SHP-0F7A96A3' },
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

  // 2. Login as Priya Sharma
  const loginRes = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent.blr001@shipshaft.test', password: 'ShipShaft@2026!' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];

  // 3. Move to OUT_FOR_DELIVERY
  const patchRes = await fetch(BASE_URL + '/api/agent/deliveries/SHP-0F7A96A3/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const patchData = await patchRes.json();
  console.log('PATCH Status:', patchRes.status, patchData);

  // 4. Verify DB
  const s = await db.collection('shipments').findOne({ trackingNumber: 'SHP-0F7A96A3' });
  console.log('Final DB State:', {
    trackingNumber: s.trackingNumber,
    status: s.status,
    otpHashExists: Boolean(s.otpHash),
    otpExpiresAt: s.otpExpiresAt,
    otpAttempts: s.otpAttempts,
    otpVerifiedAt: s.otpVerifiedAt,
  });

  await mongoose.disconnect();
}

setupOutForDelivery().catch(console.error);
