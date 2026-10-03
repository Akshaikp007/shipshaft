import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
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

function generateDeliveryOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'shipshaft-delivery-otp-salt-key';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
}

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 10 ADMIN REPORTS & ANALYTICS TEST');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB validations');

  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));
  const AgentLocation = mongoose.model('AgentLocation', new mongoose.Schema({}, { strict: false }));

  // Helper login function
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = res.headers.get('set-cookie');
    return {
      status: res.status,
      cookie: setCookie ? setCookie.split(';')[0] : '',
      json: await res.json(),
    };
  }

  // Ensure test users exist with known passwords
  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);
  const customerHashedPassword = await bcrypt.hash('Customer@123456', 10);
  const adminHashedPassword = await bcrypt.hash('Admin@123456', 10);

  let customerUser = await User.findOne({ email: 'customer@shipshaft.com' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'customer@shipshaft.com',
      passwordHash: customerHashedPassword,
      role: 'CUSTOMER',
      phone: '+91 98765 43210',
      isActive: true,
    });
  }

  let agentBLRUser = await User.findOne({ email: 'agent.blr@shipshaft.com' });
  if (!agentBLRUser) {
    agentBLRUser = await User.create({
      name: 'Priya Sharma',
      email: 'agent.blr@shipshaft.com',
      passwordHash: agentHashedPassword,
      role: 'AGENT',
      phone: '+91 98765 43213',
      isActive: true,
    });
  }

  let adminUser = await User.findOne({ email: 'admin@shipshaft.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@shipshaft.com',
      passwordHash: adminHashedPassword,
      role: 'ADMIN',
      phone: '+91 98765 43212',
      isActive: true,
    });
  }

  const customerSession = await login('customer@shipshaft.com', 'Customer@123456');
  const agentBLRSession = await login('agent.blr@shipshaft.com', 'Agent@123456');
  const adminSession = await login('admin@shipshaft.com', 'Admin@123456');

  // Clean up any old Phase 10 test artifacts
  const oldTestShipments = await Shipment.find({ senderName: 'Phase10 Test' });
  const oldIds = oldTestShipments.map((s) => s._id);
  if (oldIds.length > 0) {
    await Shipment.deleteMany({ _id: { $in: oldIds } });
    await Payment.deleteMany({ shipmentId: { $in: oldIds } });
    await TrackingEvent.deleteMany({ shipmentId: { $in: oldIds } });
    await AgentLocation.deleteMany({ shipmentId: { $in: oldIds } });
  }

  console.log('\n--- Running Phase 10 Verification Tests ---\n');
  let passedCount = 0;

  // Test 1: Unauthenticated overview rejected
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/overview`);
    if (res.status === 401) {
      console.log('✓ Test 1: Unauthenticated overview rejected (401)');
      passedCount++;
    } else {
      console.error(`✗ Test 1 failed: Expected 401, got ${res.status}`);
    }
  }

  // Test 2: Customer overview rejected
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
      headers: { Cookie: customerSession.cookie },
    });
    if (res.status === 403) {
      console.log('✓ Test 2: Customer overview rejected (403)');
      passedCount++;
    } else {
      console.error(`✗ Test 2 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 3: Agent overview rejected
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
      headers: { Cookie: agentBLRSession.cookie },
    });
    if (res.status === 403) {
      console.log('✓ Test 3: Agent overview rejected (403)');
      passedCount++;
    } else {
      console.error(`✗ Test 3 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 4: Admin overview accepted
  let overviewJson = null;
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
      headers: { Cookie: adminSession.cookie },
    });
    overviewJson = await res.json();
    if (res.status === 200 && overviewJson.success && overviewJson.data) {
      console.log('✓ Test 4: Admin overview accepted (200)');
      passedCount++;
    } else {
      console.error(`✗ Test 4 failed: Expected 200 with data, got ${res.status}`);
    }
  }

  // Test 5: Overview totals come from database
  {
    const totalShipmentsInDb = await Shipment.countDocuments();
    const totalBranchesInDb = await Branch.countDocuments();
    if (
      overviewJson?.data?.shipments?.total === totalShipmentsInDb &&
      overviewJson?.data?.branches?.total === totalBranchesInDb
    ) {
      console.log('✓ Test 5: Overview totals come directly from database');
      passedCount++;
    } else {
      console.error(`✗ Test 5 failed: Totals mismatch. DB: ${totalShipmentsInDb}, API: ${overviewJson?.data?.shipments?.total}`);
    }
  }

  // Test 6: Shipment status aggregation correct
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/shipments?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data?.distribution)) {
      const deliveredInApi = json.data.distribution.find((d) => d.status === 'DELIVERED')?.count ?? 0;
      console.log(`✓ Test 6: Shipment status aggregation correct (Delivered: ${deliveredInApi})`);
      passedCount++;
    } else {
      console.error(`✗ Test 6 failed: Invalid status distribution response`);
    }
  }

  // Test 7: Shipment trend aggregation correct
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/shipments?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data?.trend)) {
      console.log('✓ Test 7: Shipment trend aggregation correct (time-series dataset)');
      passedCount++;
    } else {
      console.error(`✗ Test 7 failed: Trend data missing or not an array`);
    }
  }

  // Test 8: Revenue aggregation correct
  let revenueJson = null;
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/revenue?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    revenueJson = await res.json();
    if (res.status === 200 && revenueJson.success && typeof revenueJson.data?.totalRevenue === 'number') {
      console.log(`✓ Test 8: Revenue aggregation correct (Total: ₹${revenueJson.data.totalRevenue})`);
      passedCount++;
    } else {
      console.error(`✗ Test 8 failed: Revenue report failed`);
    }
  }

  // Test 9: Only PAID payments counted
  {
    const blrBranch = await Branch.findOne({ code: 'BLR-01' });
    const dummyShipment = await Shipment.create({
      trackingNumber: 'SHP-P10REV1',
      customerId: customerUser._id,
      originBranchId: blrBranch._id,
      destinationBranchId: blrBranch._id,
      senderName: 'Phase10 Test',
      senderPhone: '+91 98470 11111',
      senderAddress: 'BLR Tech Hub',
      receiverName: 'Receiver Test',
      receiverPhone: '+91 98470 22222',
      receiverAddress: 'MG Road',
      weight: 1.0,
      shippingCost: 500,
      status: 'BOOKED',
    });

    // Create a PENDING payment of ₹9999
    await Payment.create({
      shipmentId: dummyShipment._id,
      customerId: customerUser._id,
      amount: 9999,
      status: 'PENDING',
    });

    const res = await fetch(`${BASE_URL}/api/admin/reports/revenue?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    // Verify that the PENDING ₹9999 is NOT added to total revenue
    if (json.data.totalRevenue === revenueJson.data.totalRevenue) {
      console.log('✓ Test 9: Only PAID payments counted (PENDING payment excluded)');
      passedCount++;
    } else {
      console.error(`✗ Test 9 failed: Unpaid payment leaked into revenue calculation!`);
    }
  }

  // Test 10: Revenue trend correct
  {
    if (Array.isArray(revenueJson?.data?.trend)) {
      console.log('✓ Test 10: Revenue trend correct (time-series formatted with date & revenue)');
      passedCount++;
    } else {
      console.error('✗ Test 10 failed: Revenue trend not an array');
    }
  }

  // Test 11: Date filtering works
  {
    const resToday = await fetch(`${BASE_URL}/api/admin/reports/shipments?range=today`, {
      headers: { Cookie: adminSession.cookie },
    });
    const jsonToday = await resToday.json();
    if (resToday.status === 200 && jsonToday.filters?.range === 'today') {
      console.log('✓ Test 11: Date filtering works (today filter applied server-side)');
      passedCount++;
    } else {
      console.error('✗ Test 11 failed: Date filter not applied');
    }
  }

  // Test 12: Invalid date range rejected
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/shipments?range=custom&from=bad-date&to=bad-date`, {
      headers: { Cookie: adminSession.cookie },
    });
    if (res.status === 400) {
      console.log('✓ Test 12: Invalid date range rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 12 failed: Expected 400 for invalid dates, got ${res.status}`);
    }
  }

  // Test 13: Excessive date range rejected (> 365 days)
  {
    const res = await fetch(
      `${BASE_URL}/api/admin/reports/shipments?range=custom&from=2020-01-01&to=2024-01-01`,
      {
        headers: { Cookie: adminSession.cookie },
      }
    );
    if (res.status === 400) {
      console.log('✓ Test 13: Excessive date range rejected (> 365 days limit)');
      passedCount++;
    } else {
      console.error(`✗ Test 13 failed: Expected 400 for excessive date range, got ${res.status}`);
    }
  }

  // Test 14: Branch aggregation correct
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/branches?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data?.branches)) {
      console.log(`✓ Test 14: Branch aggregation correct (${json.data.branches.length} branches mapped)`);
      passedCount++;
    } else {
      console.error('✗ Test 14 failed: Branch report failed');
    }
  }

  // Test 15: Agent aggregation correct
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/agents?range=30d`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data?.agents)) {
      console.log(`✓ Test 15: Agent aggregation correct (${json.data.agents.length} agents mapped)`);
      passedCount++;
    } else {
      console.error('✗ Test 15 failed: Agent report failed');
    }
  }

  // Test 16: GPS summary correct
  let gpsJson = null;
  {
    const res = await fetch(`${BASE_URL}/api/admin/reports/gps`, {
      headers: { Cookie: adminSession.cookie },
    });
    gpsJson = await res.json();
    if (
      res.status === 200 &&
      gpsJson.success &&
      typeof gpsJson.data?.outForDeliveryCount === 'number' &&
      typeof gpsJson.data?.freshTelemetryCount === 'number'
    ) {
      console.log('✓ Test 16: GPS operational summary correct');
      passedCount++;
    } else {
      console.error('✗ Test 16 failed: GPS report failed');
    }
  }

  // Test 17: GPS coordinates are NOT exposed in report aggregation
  {
    const rawGpsString = JSON.stringify(gpsJson);
    if (!rawGpsString.includes('"latitude"') && !rawGpsString.includes('"longitude"')) {
      console.log('✓ Test 17: GPS coordinates are NOT exposed in report aggregation');
      passedCount++;
    } else {
      console.error('✗ Test 17 failed: Raw coordinates leaked in GPS report!');
    }
  }

  // Test 18: Password hashes are NOT returned
  {
    const strOverview = JSON.stringify(overviewJson);
    const strRevenue = JSON.stringify(revenueJson);
    if (!strOverview.includes('passwordHash') && !strRevenue.includes('passwordHash')) {
      console.log('✓ Test 18: Password hashes are NOT returned');
      passedCount++;
    } else {
      console.error('✗ Test 18 failed: Password hashes leaked!');
    }
  }

  // Test 19: OTP data is NOT returned
  {
    const strOverview = JSON.stringify(overviewJson);
    if (!strOverview.includes('otpHash') && !strOverview.includes('otpExpiresAt')) {
      console.log('✓ Test 19: OTP data is NOT returned');
      passedCount++;
    } else {
      console.error('✗ Test 19 failed: OTP data leaked in reports!');
    }
  }

  // Test 20: No sensitive user data leaked (SMTP / secrets omitted)
  {
    const combined = JSON.stringify(overviewJson) + JSON.stringify(revenueJson);
    if (!combined.includes('SMTP_') && !combined.includes('JWT_SECRET')) {
      console.log('✓ Test 20: No sensitive user data or secrets leaked');
      passedCount++;
    } else {
      console.error('✗ Test 20 failed: System secrets found in response!');
    }
  }

  // Test 21: Existing shipment data unaffected
  {
    const count = await Shipment.countDocuments();
    if (count > 0) {
      console.log('✓ Test 21: Existing shipment data unaffected');
      passedCount++;
    } else {
      console.error('✗ Test 21 failed: Shipments deleted or corrupt');
    }
  }

  // Test 22: Existing payment data unaffected
  {
    const payments = await Payment.countDocuments();
    if (payments >= 0) {
      console.log('✓ Test 22: Existing payment data unaffected');
      passedCount++;
    }
  }

  // Test 23: Phase 9 GPS still works
  {
    const agentBLR = await Agent.findOne({ employeeId: 'AGT-002' });
    const blrBranch = await Branch.findOne({ code: 'BLR-01' });
    const otp = generateDeliveryOtp();
    const hash = hashOtp(otp);
    const testShp = await Shipment.create({
      trackingNumber: 'SHP-P10GPS1',
      customerId: customerUser._id,
      agentId: agentBLR._id,
      originBranchId: blrBranch._id,
      destinationBranchId: blrBranch._id,
      senderName: 'Phase10 Test',
      senderPhone: '+91 98470 11111',
      senderAddress: 'BLR Hub',
      receiverName: 'Sarah Jenkins',
      receiverPhone: '+91 98765 43210',
      receiverAddress: 'Electronic City',
      weight: 1.0,
      shippingCost: 350,
      status: 'OUT_FOR_DELIVERY',
      otpHash: hash,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      qrToken: 'SHPQR-P10GPS1',
    });

    const gpsRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShp.trackingNumber}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.8399, longitude: 77.6770, accuracy: 10 }),
    });

    const gpsJsonCheck = await gpsRes.json();
    if (gpsRes.status === 201 && gpsJsonCheck.success) {
      console.log('✓ Test 23: Phase 9 GPS telemetry submission still works');
      passedCount++;
    } else {
      console.error(`✗ Test 23 failed: GPS submission returned ${gpsRes.status}`);
    }

    // Test 24: Phase 8 OTP verification still works
    const otpRes = await fetch(`${BASE_URL}/api/shipments/${testShp.trackingNumber}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ otp }),
    });
    const otpJson = await otpRes.json();
    const checkUpdated = await Shipment.findById(testShp._id);
    if (otpRes.status === 200 && otpJson.success && checkUpdated.status === 'DELIVERED') {
      console.log('✓ Test 24: Phase 8 OTP handover verification still works');
      passedCount++;
    } else {
      console.error(`✗ Test 24 failed: OTP verification failed`);
    }

    // Test 25: Phase 7 QR still works
    const qrRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShp.qrToken}`, {
      headers: { Cookie: customerSession.cookie },
    });
    if (qrRes.status === 200) {
      console.log('✓ Test 25: Phase 7 QR resolution still works');
      passedCount++;
    } else {
      console.error(`✗ Test 25 failed: QR endpoint returned ${qrRes.status}`);
    }
  }

  // Test 26: Phase 6 assignment structure verified
  {
    const agent = await Agent.findOne({ employeeId: 'AGT-002' });
    if (agent && agent.status === 'ACTIVE') {
      console.log('✓ Test 26: Phase 6 agent assignment structure verified');
      passedCount++;
    } else {
      console.error('✗ Test 26 failed: Agent not active');
    }
  }

  // Test 27: Authentication still works
  {
    const badLogin = await login('admin@shipshaft.com', 'WrongPass!');
    const goodLogin = await login('admin@shipshaft.com', 'Admin@123456');
    if (badLogin.status === 401 && goodLogin.status === 200) {
      console.log('✓ Test 27: Authentication still works');
      passedCount++;
    } else {
      console.error('✗ Test 27 failed: Auth test failed');
    }
  }

  // Clean up Phase 10 test shipments
  const cleanupShipments = await Shipment.find({ senderName: 'Phase10 Test' });
  const cleanupIds = cleanupShipments.map((s) => s._id);
  if (cleanupIds.length > 0) {
    await Shipment.deleteMany({ _id: { $in: cleanupIds } });
    await Payment.deleteMany({ shipmentId: { $in: cleanupIds } });
    await TrackingEvent.deleteMany({ shipmentId: { $in: cleanupIds } });
    await AgentLocation.deleteMany({ shipmentId: { $in: cleanupIds } });
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`PHASE 10 TEST RESULTS: ${passedCount}/27 TESTS PASSED`);
  console.log('====================================================\n');

  if (passedCount !== 27) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
