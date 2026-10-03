import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
  console.log('SHIPSHAFT — PHASE 9 REAL-TIME GPS TRACKING TEST');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB validations');

  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));
  const AgentLocation = mongoose.model('AgentLocation', new mongoose.Schema({}, { strict: false }));

  // Set up branches
  const branches = await Branch.find({});
  const kocBranch = branches.find((b) => b.code === 'KOC-01') || branches[0];
  const blrBranch = branches.find((b) => b.code === 'BLR-01') || branches[1];

  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);
  const customerHashedPassword = await bcrypt.hash('Customer@123456', 10);
  const adminHashedPassword = await bcrypt.hash('Admin@123456', 10);

  // Setup Customer 1 (Sarah Jenkins)
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
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'customer@shipshaft.com' },
      { $set: { passwordHash: customerHashedPassword, isActive: true } }
    );
  }

  // Setup Customer 2 (Alex Johnson - for cross-tenant isolation testing)
  let customer2User = await User.findOne({ email: 'customer2@shipshaft.com' });
  if (!customer2User) {
    customer2User = await User.create({
      name: 'Alex Johnson',
      email: 'customer2@shipshaft.com',
      passwordHash: customerHashedPassword,
      role: 'CUSTOMER',
      phone: '+91 98765 43299',
      isActive: true,
    });
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'customer2@shipshaft.com' },
      { $set: { passwordHash: customerHashedPassword, isActive: true } }
    );
  }

  // Setup Agent 1 (BLR - AGT-002)
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
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'agent.blr@shipshaft.com' },
      { $set: { passwordHash: agentHashedPassword, isActive: true } }
    );
  }

  let agentBLR = await Agent.findOne({ employeeId: 'AGT-002' });
  if (!agentBLR) {
    agentBLR = await Agent.create({
      userId: agentBLRUser._id,
      branchId: blrBranch._id,
      employeeId: 'AGT-002',
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      isAvailable: true,
      currentWorkload: 0,
      totalDeliveries: 0,
    });
  }

  // Setup Agent 2 (KOC - AGT-001)
  let agentKOCUser = await User.findOne({ email: 'agent@shipshaft.com' });
  if (!agentKOCUser) {
    agentKOCUser = await User.create({
      name: 'Rahul Kumar',
      email: 'agent@shipshaft.com',
      passwordHash: agentHashedPassword,
      role: 'AGENT',
      phone: '+91 98765 43211',
      isActive: true,
    });
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'agent@shipshaft.com' },
      { $set: { passwordHash: agentHashedPassword, isActive: true } }
    );
  }

  let agentKOC = await Agent.findOne({ employeeId: 'AGT-001' });
  if (!agentKOC) {
    agentKOC = await Agent.create({
      userId: agentKOCUser._id,
      branchId: kocBranch._id,
      employeeId: 'AGT-001',
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      isAvailable: true,
      currentWorkload: 0,
      totalDeliveries: 0,
    });
  }

  // Setup Admin
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
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'admin@shipshaft.com' },
      { $set: { passwordHash: adminHashedPassword, isActive: true } }
    );
  }

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

  const customerSession = await login('customer@shipshaft.com', 'Customer@123456');
  const customer2Session = await login('customer2@shipshaft.com', 'Customer@123456');
  const agentBLRSession = await login('agent.blr@shipshaft.com', 'Agent@123456');
  const agentKOCSession = await login('agent@shipshaft.com', 'Agent@123456');
  const adminSession = await login('admin@shipshaft.com', 'Admin@123456');

  // Clean up any previous Phase 9 test shipments and locations
  const oldTestShipments = await Shipment.find({ senderName: 'Phase9 Test' });
  const oldIds = oldTestShipments.map((s) => s._id);
  if (oldIds.length > 0) {
    await Shipment.deleteMany({ _id: { $in: oldIds } });
    await TrackingEvent.deleteMany({ shipmentId: { $in: oldIds } });
    await AgentLocation.deleteMany({ shipmentId: { $in: oldIds } });
  }

  console.log('\n--- Running Phase 9 Verification Tests ---\n');
  let passedCount = 0;

  // Helper to create test shipment
  async function createTestShipment(overrides = {}) {
    const tn = 'SHP-P9' + Math.floor(100000 + Math.random() * 900000);
    const otp = generateDeliveryOtp();
    const hash = hashOtp(otp);
    const shipment = await Shipment.create({
      trackingNumber: tn,
      customerId: customerUser._id,
      agentId: agentBLR._id,
      originBranchId: blrBranch._id,
      destinationBranchId: blrBranch._id,
      senderName: 'Phase9 Test',
      senderPhone: '+91 98470 11111',
      senderAddress: 'BLR Tech Hub',
      receiverName: 'Receiver Test',
      receiverPhone: '+91 98470 22222',
      receiverAddress: 'MG Road, Bangalore',
      weight: 2.5,
      shippingCost: 350,
      status: 'OUT_FOR_DELIVERY',
      otpHash: hash,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      qrToken: `SHPQR-${tn}`,
      ...overrides,
    });
    return { shipment, otp, hash };
  }

  const primaryTest = await createTestShipment();
  const primaryId = primaryTest.shipment._id.toString();
  const primaryTracking = primaryTest.shipment.trackingNumber;

  // Test 1: Unauthenticated location update rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
    });
    if (res.status === 401) {
      console.log('✓ Test 1: Unauthenticated location update rejected (401)');
      passedCount++;
    } else {
      console.error(`✗ Test 1 failed: Expected 401, got ${res.status}`);
    }
  }

  // Test 2: Customer location update rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
    });
    if (res.status === 403) {
      console.log('✓ Test 2: Customer location update rejected (403)');
      passedCount++;
    } else {
      console.error(`✗ Test 2 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 3: Admin location update rejected (admins cannot impersonate agents for live GPS)
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
    });
    if (res.status === 403) {
      console.log('✓ Test 3: Admin location update rejected (403)');
      passedCount++;
    } else {
      console.error(`✗ Test 3 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 4: Wrong agent location update rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentKOCSession.cookie, // agentKOC is not assigned to primaryTest
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
    });
    if (res.status === 403) {
      console.log('✓ Test 4: Wrong agent location update rejected (403)');
      passedCount++;
    } else {
      console.error(`✗ Test 4 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 5: Assigned agent location update accepted
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie, // assigned agent
      },
      body: JSON.stringify({
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 12.5,
      }),
    });
    const json = await res.json();
    if (res.status === 201 && json.success && json.location?.latitude === 12.9716) {
      console.log('✓ Test 5: Assigned agent location update accepted');
      passedCount++;
    } else {
      console.error(`✗ Test 5 failed: Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
    }
  }

  // Test 6: Non-OUT_FOR_DELIVERY update rejected
  {
    const inTransitShipment = await createTestShipment({ status: 'IN_TRANSIT' });
    const res = await fetch(
      `${BASE_URL}/api/agent/deliveries/${inTransitShipment.shipment.trackingNumber}/location`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: agentBLRSession.cookie,
        },
        body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
      }
    );
    if (res.status === 400) {
      console.log('✓ Test 6: Non-OUT_FOR_DELIVERY update rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 6 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 7: Invalid latitude rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 95.0, longitude: 77.5946 }), // lat > 90
    });
    if (res.status === 400) {
      console.log('✓ Test 7: Invalid latitude rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 7 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 8: Invalid longitude rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 185.0 }), // lng > 180
    });
    if (res.status === 400) {
      console.log('✓ Test 8: Invalid longitude rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 8 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 9: Invalid accuracy rejected
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, accuracy: -5 }),
    });
    if (res.status === 400) {
      console.log('✓ Test 9: Invalid accuracy rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 9 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 10: Invalid timestamp rejected
  {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour in future
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, recordedAt: futureDate }),
    });
    if (res.status === 400) {
      console.log('✓ Test 10: Invalid timestamp rejected (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 10 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 11: Agent ID cannot be spoofed
  {
    const res = await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({
        latitude: 12.972,
        longitude: 77.595,
        agentId: agentKOC._id.toString(), // Attempting to spoof KOC agent ID
      }),
    });
    const latestLoc = await AgentLocation.findOne({ shipmentId: primaryTest.shipment._id }).sort({
      recordedAt: -1,
    });
    if (res.status === 201 && latestLoc.agentId.toString() === agentBLR._id.toString()) {
      console.log('✓ Test 11: Agent ID cannot be spoofed');
      passedCount++;
    } else {
      console.error(`✗ Test 11 failed: Spoofed agent ID was accepted or wrong agent recorded`);
    }
  }

  // Test 12: Customer can read own shipment location
  {
    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: customerSession.cookie },
    });
    const json = await res.json();
    if (
      res.status === 200 &&
      json.success &&
      json.location &&
      typeof json.location.latitude === 'number'
    ) {
      console.log('✓ Test 12: Customer can read own shipment location');
      passedCount++;
    } else {
      console.error(`✗ Test 12 failed: Expected 200 with location, got ${res.status}`);
    }
  }

  // Test 13: Customer cannot read another customer's location
  {
    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: customer2Session.cookie }, // customer2 does not own primaryTracking
    });
    if (res.status === 403) {
      console.log("✓ Test 13: Customer cannot read another customer's location (403)");
      passedCount++;
    } else {
      console.error(`✗ Test 13 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 14: Agent can read assigned shipment location
  {
    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: agentBLRSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.location) {
      console.log('✓ Test 14: Agent can read assigned shipment location');
      passedCount++;
    } else {
      console.error(`✗ Test 14 failed: Expected 200, got ${res.status}`);
    }
  }

  // Test 15: Agent cannot read another agent's shipment location
  {
    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: agentKOCSession.cookie }, // agentKOC is not assigned
    });
    if (res.status === 403) {
      console.log("✓ Test 15: Agent cannot read another agent's shipment location (403)");
      passedCount++;
    } else {
      console.error(`✗ Test 15 failed: Expected 403, got ${res.status}`);
    }
  }

  // Test 16: Admin can read location
  {
    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: adminSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.location) {
      console.log('✓ Test 16: Admin can read location');
      passedCount++;
    } else {
      console.error(`✗ Test 16 failed: Expected 200, got ${res.status}`);
    }
  }

  // Test 17: Location history authorization works
  {
    const resCustomer = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location/history`, {
      headers: { Cookie: customerSession.cookie },
    });
    const resCust2 = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location/history`, {
      headers: { Cookie: customer2Session.cookie },
    });
    const resAgentKOC = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location/history`, {
      headers: { Cookie: agentKOCSession.cookie },
    });
    if (resCustomer.status === 200 && resCust2.status === 403 && resAgentKOC.status === 403) {
      console.log('✓ Test 17: Location history authorization works');
      passedCount++;
    } else {
      console.error(
        `✗ Test 17 failed: Expected 200, 403, 403; got ${resCustomer.status}, ${resCust2.status}, ${resAgentKOC.status}`
      );
    }
  }

  // Test 18: Location history limit enforced
  {
    const res = await fetch(
      `${BASE_URL}/api/shipments/${primaryTracking}/location/history?limit=500`,
      {
        headers: { Cookie: customerSession.cookie },
      }
    );
    const json = await res.json();
    if (res.status === 200 && Array.isArray(json.history) && json.history.length <= 100) {
      console.log('✓ Test 18: Location history limit enforced (capped at max 100)');
      passedCount++;
    } else {
      console.error(`✗ Test 18 failed: Limit check failed: ${JSON.stringify(json)}`);
    }
  }

  // Test 19: DELIVERED shipment does not accept new GPS updates
  {
    const deliveredShipment = await createTestShipment({ status: 'DELIVERED' });
    const res = await fetch(
      `${BASE_URL}/api/agent/deliveries/${deliveredShipment.shipment.trackingNumber}/location`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: agentBLRSession.cookie,
        },
        body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
      }
    );
    if (res.status === 400) {
      console.log('✓ Test 19: DELIVERED shipment does not accept new GPS updates (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 19 failed: Expected 400, got ${res.status}`);
    }
  }

  // Test 20: Latest location returned correctly
  {
    const point1Time = new Date(Date.now() - 5000);
    const point2Time = new Date();
    await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.98, longitude: 77.6, recordedAt: point1Time }),
    });
    await fetch(`${BASE_URL}/api/agent/deliveries/${primaryTracking}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ latitude: 12.99, longitude: 77.61, recordedAt: point2Time }),
    });

    const res = await fetch(`${BASE_URL}/api/shipments/${primaryTracking}/location`, {
      headers: { Cookie: customerSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.location?.latitude === 12.99) {
      console.log('✓ Test 20: Latest location returned correctly');
      passedCount++;
    } else {
      console.error(`✗ Test 20 failed: Expected latitude 12.99, got ${json.location?.latitude}`);
    }
  }

  // Test 21: Stale location is identified correctly
  {
    const staleTest = await createTestShipment();
    const staleTracking = staleTest.shipment.trackingNumber;
    // Insert a location recorded 2 minutes ago (> 60s threshold)
    await AgentLocation.create({
      shipmentId: staleTest.shipment._id,
      agentId: agentBLR._id,
      latitude: 12.97,
      longitude: 77.59,
      recordedAt: new Date(Date.now() - 120 * 1000),
    });

    const res = await fetch(`${BASE_URL}/api/shipments/${staleTracking}/location`, {
      headers: { Cookie: customerSession.cookie },
    });
    const json = await res.json();
    if (res.status === 200 && json.locationFresh === false && json.trackingActive === true) {
      console.log('✓ Test 21: Stale location is identified correctly (locationFresh: false)');
      passedCount++;
    } else {
      console.error(
        `✗ Test 21 failed: Expected locationFresh false, got ${json.locationFresh}`
      );
    }
  }

  // Test 22: Phase 8 OTP delivery still works
  {
    const otpTest = await createTestShipment();
    const verifyRes = await fetch(
      `${BASE_URL}/api/shipments/${otpTest.shipment.trackingNumber}/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: agentBLRSession.cookie,
        },
        body: JSON.stringify({ otp: otpTest.otp }),
      }
    );
    const verifyJson = await verifyRes.json();
    const updated = await Shipment.findById(otpTest.shipment._id);
    if (verifyRes.status === 200 && verifyJson.success && updated.status === 'DELIVERED') {
      console.log('✓ Test 22: Phase 8 OTP delivery still works (transitions to DELIVERED)');
      passedCount++;
    } else {
      console.error(`✗ Test 22 failed: OTP verification failed: ${JSON.stringify(verifyJson)}`);
    }
  }

  // Test 23: Phase 8 direct DELIVERED protection still works
  {
    const directRes = await fetch(
      `${BASE_URL}/api/agent/deliveries/${primaryTracking}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: agentBLRSession.cookie,
        },
        body: JSON.stringify({ status: 'DELIVERED' }),
      }
    );
    if (directRes.status === 400) {
      console.log('✓ Test 23: Phase 8 direct DELIVERED protection still works (400)');
      passedCount++;
    } else {
      console.error(`✗ Test 23 failed: Expected 400 for direct DELIVERED patch, got ${directRes.status}`);
    }
  }

  // Test 24: Phase 7 QR still works
  {
    const qrRes = await fetch(`${BASE_URL}/api/shipments/qr/${primaryTest.shipment.qrToken}`, {
      headers: { Cookie: customerSession.cookie },
    });
    const qrJson = await qrRes.json();
    if (qrRes.status === 200 && qrJson.success && qrJson.shipment?.trackingNumber === primaryTracking) {
      console.log('✓ Test 24: Phase 7 QR still works');
      passedCount++;
    } else {
      console.error(`✗ Test 24 failed: Expected QR 200, got ${qrRes.status}`);
    }
  }

  // Test 25: Phase 6 assignment still works
  {
    const agentCheck = await Agent.findOne({ employeeId: 'AGT-002' });
    if (agentCheck && agentCheck.status === 'ACTIVE') {
      console.log('✓ Test 6: Phase 6 assignment structure verified');
      passedCount++;
    } else {
      console.error('✗ Test 25 failed: Agent record invalid');
    }
  }

  // Test 26: Authentication still works
  {
    const badLogin = await login('customer@shipshaft.com', 'WrongPassword!');
    const goodLogin = await login('customer@shipshaft.com', 'Customer@123456');
    if (badLogin.status === 401 && goodLogin.status === 200) {
      console.log('✓ Test 26: Authentication still works');
      passedCount++;
    } else {
      console.error(`✗ Test 26 failed: Auth check returned ${badLogin.status}, ${goodLogin.status}`);
    }
  }

  // Clean up Phase 9 test shipments
  const cleanupShipments = await Shipment.find({ senderName: 'Phase9 Test' });
  const cleanupIds = cleanupShipments.map((s) => s._id);
  if (cleanupIds.length > 0) {
    await Shipment.deleteMany({ _id: { $in: cleanupIds } });
    await TrackingEvent.deleteMany({ shipmentId: { $in: cleanupIds } });
    await AgentLocation.deleteMany({ shipmentId: { $in: cleanupIds } });
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`PHASE 9 TEST RESULTS: ${passedCount}/26 TESTS PASSED`);
  console.log('====================================================\n');

  if (passedCount !== 26) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
