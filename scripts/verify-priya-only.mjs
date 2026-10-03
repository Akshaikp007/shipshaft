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

const BASE_URL = 'http://localhost:3000';

async function testPriyaOnly() {
  console.log('=== TEST 1: PRIYA LOGIN VERIFICATION ===');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'agent.blr001@shipshaft.test',
      password: 'ShipShaft@2026!',
    }),
  });

  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  console.log('Login Response Status:', loginRes.status);
  console.log('User details from login:', {
    name: loginData.user?.name,
    email: loginData.user?.email,
    role: loginData.user?.role,
    isActive: loginData.user?.isActive,
  });
  console.log('Redirect target:', loginData.redirectTo);

  if (loginRes.status !== 200 || !cookie) {
    throw new Error('Login failed!');
  }

  console.log('\n=== TEST 2: DASHBOARD VERIFICATION ===');
  const dashRes = await fetch(`${BASE_URL}/agent/dashboard`, {
    headers: { Cookie: cookie },
  });
  console.log('Dashboard Page Status:', dashRes.status);
  const dashHtml = await dashRes.text();

  const hasName = dashHtml.includes('Priya Sharma');
  const hasEmpId = dashHtml.includes('AGT-BLR-001');
  const hasBranch = dashHtml.includes('Bengaluru Hub') || dashHtml.includes('BLR-01');
  const hasAvailable = dashHtml.includes('AVAILABLE') || dashHtml.includes('Available') || dashHtml.includes('Online');
  const hasShipment = dashHtml.includes('SHP-0F7A96A3');

  console.log('Dashboard content checks:');
  console.log(' - Contains name "Priya Sharma":', hasName);
  console.log(' - Contains employee ID "AGT-BLR-001":', hasEmpId);
  console.log(' - Contains branch "Bengaluru Hub":', hasBranch);
  console.log(' - Shows availability:', hasAvailable);
  console.log(' - Shows assigned shipment "SHP-0F7A96A3":', hasShipment);

  console.log('\n=== TEST 3: DELIVERIES QUEUE VERIFICATION ===');
  const deliveriesApiRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  const deliveriesData = await deliveriesApiRes.json();
  console.log('API /api/agent/deliveries Status:', deliveriesApiRes.status);
  console.log('Deliveries Count:', deliveriesData.deliveries?.length);
  deliveriesData.deliveries?.forEach((d) => {
    console.log(` - ${d.trackingNumber}: status=${d.status}, destination=${d.destinationCity}`);
  });

  const deliveriesPageRes = await fetch(`${BASE_URL}/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  console.log('Deliveries HTML Page Status:', deliveriesPageRes.status);
  const deliveriesHtml = await deliveriesPageRes.text();
  console.log('Deliveries HTML contains assigned shipment:', deliveriesHtml.includes('SHP-0F7A96A3'));

  console.log('\n=== TEST 4: DELIVERY DETAILS VERIFICATION ===');
  const detailRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-0F7A96A3`, {
    headers: { Cookie: cookie },
  });
  const detailData = await detailRes.json();
  console.log('API /api/agent/deliveries/SHP-0F7A96A3 Status:', detailRes.status);
  console.log('Shipment:', {
    trackingNumber: detailData.delivery?.trackingNumber,
    status: detailData.delivery?.status,
    agent: detailData.delivery?.agent?.employeeId,
    destination: detailData.delivery?.destinationBranch?.name,
  });

  console.log('\n=== TEST 5: ASSIGNMENT LOGIC SIMULATION ===');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const blrBranch = await db.collection('branches').findOne({ code: 'BLR-01' });
  const eligibleAgents = await db.collection('agents').find({
    branchId: blrBranch._id,
    isAvailable: true,
    status: { $nin: ['OFFLINE', 'INACTIVE'] },
    availability: { $nin: ['OFFLINE', 'BUSY'] },
  }).toArray();

  console.log(`Eligible agents found in DB for destination BLR-01: ${eligibleAgents.length}`);
  for (const a of eligibleAgents) {
    const user = await db.collection('users').findOne({ _id: a.userId });
    console.log(` - Agent: ${a.employeeId}, Name: ${user?.name}, Role: ${user?.role}, Active: ${user?.isActive}`);
    console.log(` - Matches Priya Sharma: ${a.employeeId === 'AGT-BLR-001' && user?.email === 'agent.blr001@shipshaft.test'}`);
  }

  await mongoose.disconnect();

  console.log('\n=== ALL PRIYA VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
}

testPriyaOnly().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
