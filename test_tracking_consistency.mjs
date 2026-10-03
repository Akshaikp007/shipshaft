import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
const OUTBOX_PATH = path.join(process.cwd(), '.next', 'test-mail-outbox.json');

function readOutbox() {
  if (!fs.existsSync(OUTBOX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUTBOX_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function clearOutbox() {
  if (fs.existsSync(OUTBOX_PATH)) {
    try {
      fs.unlinkSync(OUTBOX_PATH);
    } catch {
      // ignore
    }
  }
}

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

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — TRACKING CONSISTENCY & STATUS AUDIT TEST');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB validations');

  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

  // Set up branches
  let branches = await Branch.find({});
  if (branches.length < 2) {
    const b1 = await Branch.create({ name: 'Kochi Central Hub', code: 'KOC-01', city: 'Kochi', state: 'Kerala', address: 'MG Road', phone: '+91 98470 11111' });
    const b2 = await Branch.create({ name: 'Bengaluru Logistics Facility', code: 'BLR-01', city: 'Bengaluru', state: 'Karnataka', address: 'Indiranagar', phone: '+91 98470 22222' });
    branches = [b1, b2];
  }
  const kocBranch = branches.find((b) => b.code === 'KOC-01') || branches[0];
  const blrBranch = branches.find((b) => b.code === 'BLR-01') || branches[1];

  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);
  const customerHashedPassword = await bcrypt.hash('Customer@123456', 10);
  const adminHashedPassword = await bcrypt.hash('Admin@123456', 10);

  // Setup Admin
  let adminUser = await User.findOne({ email: 'admin@shipshaft.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@shipshaft.com',
      passwordHash: adminHashedPassword,
      role: 'ADMIN',
      phone: '+91 98470 00000',
      isActive: true,
    });
  } else {
    await mongoose.connection.collection('users').updateOne(
      { email: 'admin@shipshaft.com' },
      { $set: { passwordHash: adminHashedPassword, isActive: true } }
    );
  }

  // Setup Customer
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
      vehicleType: 'Delivery Van',
      vehicleNumber: 'KA-01-EF-5678',
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
      vehicleType: 'Motorcycle',
      vehicleNumber: 'KL-07-AB-1234',
    });
  }

  // Authenticate users
  const customerSession = await login('customer@shipshaft.com', 'Customer@123456');
  const agentBLRSession = await login('agent.blr@shipshaft.com', 'Agent@123456');
  const agentKOCSession = await login('agent@shipshaft.com', 'Agent@123456');
  const adminSession = await login('admin@shipshaft.com', 'Admin@123456');

  if (!customerSession.cookie || !adminSession.cookie || !agentBLRSession.cookie || !agentKOCSession.cookie) {
    throw new Error('Authentication failed for test accounts.');
  }
  console.log('✓ All 4 user sessions authenticated successfully (Customer, Admin, Agent BLR, Agent KOC)');

  let passedTests = 0;
  const totalTests = 16;

  function assert(condition, message) {
    if (!condition) {
      console.error(`✗ FAIL: ${message}`);
      throw new Error(message);
    }
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  }

  // =========================================================================
  // SECTION 1: EXACT SCREENSHOT CASE & SEQUENTIAL LIFECYCLE
  // =========================================================================
  console.log('\n--- SECTION 1: Exact Screenshot Case & Lifecycle Progression ---');

  // 1. Create a fresh shipment (BOOKED)
  const bookRes = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerSession.cookie },
    body: JSON.stringify({
      senderName: 'Sarah Jenkins',
      senderPhone: '+91 98765 43210',
      senderAddress: '12 Marine Drive, Kochi, Kerala',
      receiverName: 'TechCorp Solutions',
      receiverPhone: '+91 98765 88888',
      receiverAddress: '42 MG Road, Bengaluru, Karnataka',
      packageDescription: 'Precision Electronics Circuit Boards',
      weight: 3.5,
      length: 30,
      width: 20,
      height: 15,
      serviceType: 'EXPRESS',
      originBranchId: kocBranch._id.toString(),
      destinationBranchId: blrBranch._id.toString(),
    }),
  });
  const bookData = await bookRes.json();
  assert(bookRes.status === 201 && bookData.success, 'Shipment successfully booked by customer');
  const trackingNumber = bookData.shipment.trackingNumber;
  const shipmentId = new mongoose.Types.ObjectId(bookData.shipment._id);

  // Verify status is BOOKED and 1 tracking event exists
  let events = await TrackingEvent.find({ shipmentId });
  assert(events.length === 1 && events[0].status === 'BOOKED', 'Step 1: Shipment status is BOOKED with 1 TrackingEvent');

  // 2. Pay for shipment -> PAYMENT_CONFIRMED
  const payRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerSession.cookie },
    body: JSON.stringify({
      shipmentId,
      amount: bookData.shipment.shippingCost,
      method: 'CARD',
      cardDetails: { last4: '4242' },
    }),
  });
  const payData = await payRes.json();
  assert(payRes.status === 201 && payData.success, 'Shipment payment confirmed');

  // 3. Assign Agent -> ASSIGNED (to agentBLR at destination branch)
  const assignRes = await fetch(`${BASE_URL}/api/admin/shipments/${trackingNumber}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ agentId: agentBLR._id.toString() }),
  });
  const assignData = await assignRes.json();
  assert(assignRes.status === 200 && assignData.success, 'Shipment assigned to courier AGT-002');

  events = await TrackingEvent.find({ shipmentId }).sort({ createdAt: 1 });
  assert(events.some((e) => e.status === 'ASSIGNED'), 'Step 2: TrackingEvent created for ASSIGNED');

  // 4. Agent marks PICKED_UP
  const pickupRes = await fetch(`${BASE_URL}/api/agent/deliveries/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ status: 'PICKED_UP', location: 'Kochi Pickup Hub' }),
  });
  const pickupData = await pickupRes.json();
  assert(pickupRes.status === 200 && pickupData.success, 'Courier updates status to PICKED_UP');

  // 5. Agent marks IN_TRANSIT
  const transitRes = await fetch(`${BASE_URL}/api/agent/deliveries/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ status: 'IN_TRANSIT', location: 'National Highway Transit Corridor' }),
  });
  const transitData = await transitRes.json();
  assert(transitRes.status === 200 && transitData.success, 'Courier updates status to IN_TRANSIT');

  // 6. Verify Admin API & Screenshot Condition:
  // Status: IN TRANSIT
  // Assigned Agent: Must NOT be Unassigned! Must be Priya Sharma (AGT-002)
  // Tracking timeline: Must contain all 5 milestones (BOOKED, PAYMENT_CONFIRMED, ASSIGNED, PICKED_UP, IN_TRANSIT)
  const adminShipmentRes = await fetch(`${BASE_URL}/api/shipments/${trackingNumber}`, {
    headers: { Cookie: adminSession.cookie },
  });
  const adminShipmentData = await adminShipmentRes.json();
  assert(adminShipmentData.success, 'Admin retrieves shipment details');
  assert(adminShipmentData.shipment.status === 'IN_TRANSIT', 'Admin view: Shipment status is IN_TRANSIT');
  assert(
    adminShipmentData.shipment.agent &&
      adminShipmentData.shipment.agent.employeeId === 'AGT-002' &&
      adminShipmentData.shipment.agent.name === 'Priya Sharma',
    'Admin view: Assigned Agent is correctly populated as Priya Sharma (AGT-002), never "Unassigned"'
  );
  assert(
    adminShipmentData.trackingEvents.length >= 5,
    `Admin view: TrackingEvent history contains all 5 sequential events (found ${adminShipmentData.trackingEvents.length})`
  );

  // 7. Verify Customer synchronization:
  const customerShipmentRes = await fetch(`${BASE_URL}/api/shipments/${trackingNumber}`, {
    headers: { Cookie: customerSession.cookie },
  });
  const customerShipmentData = await customerShipmentRes.json();
  assert(
    customerShipmentData.shipment.status === 'IN_TRANSIT' &&
      customerShipmentData.trackingEvents.length === adminShipmentData.trackingEvents.length,
    'Customer view: Status and tracking events are 100% synchronized with Admin view'
  );

  // 8. Verify Public /track API:
  const publicTrackRes = await fetch(`${BASE_URL}/api/track/${trackingNumber}`);
  const publicTrackData = await publicTrackRes.json();
  assert(
    publicTrackRes.status === 200 &&
      publicTrackData.success &&
      publicTrackData.shipment.status === 'IN_TRANSIT' &&
      publicTrackData.shipment.steps.length >= 5,
    'Public /track: Real shipment state and 5 database milestones returned accurately'
  );

  // 9. Advance: IN_TRANSIT -> DESTINATION_HUB -> OUT_FOR_DELIVERY
  const hubRes = await fetch(`${BASE_URL}/api/agent/deliveries/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ status: 'DESTINATION_HUB', location: 'Bengaluru Central Sorting Facility' }),
  });
  assert(hubRes.status === 200, 'Courier marks DESTINATION_HUB');

  clearOutbox();
  const ofdRes = await fetch(`${BASE_URL}/api/agent/deliveries/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY', location: 'Bengaluru East Delivery Zone' }),
  });
  assert(ofdRes.status === 200, 'Courier marks OUT_FOR_DELIVERY');

  const outbox = readOutbox();
  assert(outbox && outbox.otp, 'Customer OTP successfully dispatched to registered email');
  const recipientOtp = outbox.otp;

  // 10. Courier completes delivery via OTP verification:
  const verifyRes = await fetch(`${BASE_URL}/api/shipments/${trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ otp: recipientOtp }),
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 200 && verifyData.success, 'Handover completed via valid recipient OTP');

  // Verify DB state is DELIVERED with all 8 lifecycle tracking event stages
  const finalShipment = await Shipment.findById(shipmentId);
  const finalEvents = await TrackingEvent.find({ shipmentId });
  const uniqueStatuses = [...new Set(finalEvents.map((e) => e.status))];
  const allStagesPresent = [
    'BOOKED',
    'PAYMENT_CONFIRMED',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DESTINATION_HUB',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ].every((s) => uniqueStatuses.includes(s));
  assert(
    finalShipment.status === 'DELIVERED' && allStagesPresent,
    'Authoritative DB check: Status is DELIVERED and all 8 lifecycle stages are recorded in TrackingEvents'
  );

  // =========================================================================
  // SECTION 2: INVALID STATUS TRANSITION TESTS (ADMIN API)
  // =========================================================================
  console.log('\n--- SECTION 2: Invalid State Machine Transition Rejections ---');

  // Create another shipment at BOOKED state for rejection testing
  const testShipmentRes = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerSession.cookie },
    body: JSON.stringify({
      senderName: 'Sarah Jenkins',
      senderPhone: '+91 98765 43210',
      senderAddress: '12 Marine Drive, Kochi, Kerala',
      receiverName: 'Test Recipient',
      receiverPhone: '+91 98765 99999',
      receiverAddress: '100 Airport Road, Bengaluru',
      packageDescription: 'Security Test Consignment',
      weight: 2.0,
      length: 20,
      width: 20,
      height: 20,
      serviceType: 'STANDARD',
      originBranchId: kocBranch._id.toString(),
      destinationBranchId: blrBranch._id.toString(),
    }),
  });
  const testShipmentData = await testShipmentRes.json();
  const testTrackingNumber = testShipmentData.shipment.trackingNumber;

  // Test 11: Attempt BOOKED -> DELIVERED (must fail 400)
  const rej1 = await fetch(`${BASE_URL}/api/admin/shipments/${testTrackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  assert(rej1.status === 400, 'Invalid transition rejected: BOOKED → DELIVERED (Direct DELIVERED blocked)');

  // Test 12: Attempt BOOKED -> IN_TRANSIT (must fail 400)
  const rej2 = await fetch(`${BASE_URL}/api/admin/shipments/${testTrackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'IN_TRANSIT' }),
  });
  assert(rej2.status === 400, 'Invalid transition rejected: BOOKED → IN_TRANSIT (Non-sequential transition blocked)');

  // Test 13: Attempt arbitrary prototype status EXCEPTION_DELAY (must fail 400)
  const rej3 = await fetch(`${BASE_URL}/api/admin/shipments/${testTrackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'EXCEPTION_DELAY' }),
  });
  assert(rej3.status === 400, 'Prototype status rejected: EXCEPTION_DELAY is not in state machine');

  // Test 14: Attempt transition to active transit state on unassigned shipment (must fail 400)
  // Advance test shipment: BOOKED -> PAYMENT_CONFIRMED
  await Shipment.updateOne({ trackingNumber: testTrackingNumber }, { $set: { status: 'PAYMENT_CONFIRMED' } });
  // Try advancing to PICKED_UP directly via API while agentId is null:
  const rej4 = await fetch(`${BASE_URL}/api/admin/shipments/${testTrackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'PICKED_UP' }),
  });
  assert(rej4.status === 400, 'Unassigned active transition rejected: PICKED_UP without assigned agent blocked');

  // Test 15: From DELIVERED state, attempt reverse transitions DELIVERED -> IN_TRANSIT & DELIVERED -> OUT_FOR_DELIVERY
  const rej5 = await fetch(`${BASE_URL}/api/admin/shipments/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'IN_TRANSIT' }),
  });
  assert(rej5.status === 400, 'Terminal state protection: DELIVERED → IN_TRANSIT rejected (terminal state)');

  const rej5b = await fetch(`${BASE_URL}/api/admin/shipments/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  assert(rej5b.status === 400, 'Terminal state protection: DELIVERED → OUT_FOR_DELIVERY rejected (terminal state)');

  // Test 15c: ASSIGNED -> DELIVERED & PICKED_UP -> DELIVERED
  // Create another shipment, assign agent, test ASSIGNED -> DELIVERED
  const shp2Res = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerSession.cookie },
    body: JSON.stringify({
      senderName: 'Sarah Jenkins',
      senderPhone: '+91 98765 43210',
      senderAddress: '12 Marine Drive, Kochi, Kerala',
      receiverName: 'Test Consignee',
      receiverPhone: '+91 98765 99999',
      receiverAddress: '100 Airport Road, Bengaluru',
      packageDescription: 'Invalid Transition Testing Parcel',
      weight: 1.5,
      length: 15,
      width: 15,
      height: 15,
      serviceType: 'STANDARD',
      originBranchId: kocBranch._id.toString(),
      destinationBranchId: blrBranch._id.toString(),
    }),
  });
  const shp2Data = await shp2Res.json();
  const shp2TrackNum = shp2Data.shipment.trackingNumber;

  // Pay and Assign
  await Shipment.updateOne({ trackingNumber: shp2TrackNum }, { $set: { status: 'PAYMENT_CONFIRMED' } });
  await fetch(`${BASE_URL}/api/admin/shipments/${shp2TrackNum}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ agentId: agentBLR._id.toString() }),
  });

  // Attempt ASSIGNED -> DELIVERED (must fail 400)
  const rejAssignedDelivered = await fetch(`${BASE_URL}/api/admin/shipments/${shp2TrackNum}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  assert(rejAssignedDelivered.status === 400, 'Invalid transition rejected: ASSIGNED → DELIVERED (Direct DELIVERED blocked)');

  // Advance to PICKED_UP
  await fetch(`${BASE_URL}/api/agent/deliveries/${shp2TrackNum}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agentBLRSession.cookie },
    body: JSON.stringify({ status: 'PICKED_UP' }),
  });

  // Attempt PICKED_UP -> DELIVERED (must fail 400)
  const rejPickedUpDelivered = await fetch(`${BASE_URL}/api/admin/shipments/${shp2TrackNum}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookie },
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  assert(rejPickedUpDelivered.status === 400, 'Invalid transition rejected: PICKED_UP → DELIVERED (Direct DELIVERED blocked)');

  // Test 16: Security RBAC: Customer cannot modify status
  const rej6 = await fetch(`${BASE_URL}/api/admin/shipments/${trackingNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: customerSession.cookie },
    body: JSON.stringify({ status: 'IN_TRANSIT' }),
  });
  assert(rej6.status === 403, 'RBAC Security: Customer forbidden from mutating status via admin endpoint');

  console.log('\n====================================================');
  console.log(`ALL ${passedTests}/${totalTests} CONSISTENCY AUDIT TESTS PASSED!`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN ERROR:', err);
  process.exit(1);
});
