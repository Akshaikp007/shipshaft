import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 7 QR IDENTIFICATION & SCAN TEST');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB validations');

  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));

  // Find branches
  const branches = await Branch.find({});
  const kocBranch = branches.find((b) => b.code === 'KOC-01') || branches[0];
  const blrBranch = branches.find((b) => b.code === 'BLR-01') || branches[1];

  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);

  // Setup / Ensure Agent 1 (BLR - AGT-002)
  let agentBLR1User = await User.findOne({ email: 'agent.blr@shipshaft.com' });
  if (!agentBLR1User) {
    agentBLR1User = await User.create({
      name: 'Priya Sharma',
      email: 'agent.blr@shipshaft.com',
      passwordHash: agentHashedPassword,
      role: 'AGENT',
      phone: '+91 98765 43213',
      isActive: true,
    });
  }
  await mongoose.connection.collection('users').updateOne(
    { email: 'agent.blr@shipshaft.com' },
    { $set: { passwordHash: agentHashedPassword, isActive: true } }
  );

  let agentBLR1 = await Agent.findOne({ employeeId: 'AGT-002' });
  if (!agentBLR1) {
    agentBLR1 = await Agent.create({
      userId: agentBLR1User._id,
      branchId: blrBranch._id,
      employeeId: 'AGT-002',
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      isAvailable: true,
      currentWorkload: 0,
      totalDeliveries: 0,
    });
  } else {
    agentBLR1.availability = 'AVAILABLE';
    agentBLR1.isAvailable = true;
    agentBLR1.status = 'ACTIVE';
    agentBLR1.branchId = blrBranch._id;
    await agentBLR1.save();
  }

  // Setup / Ensure Agent 2 (BLR - AGT-003)
  let agentBLR2User = await User.findOne({ email: 'agent.blr2@shipshaft.com' });
  if (!agentBLR2User) {
    agentBLR2User = await User.create({
      name: 'Kavita Nair',
      email: 'agent.blr2@shipshaft.com',
      passwordHash: agentHashedPassword,
      role: 'AGENT',
      phone: '+91 98765 43214',
      isActive: true,
    });
  }
  await mongoose.connection.collection('users').updateOne(
    { email: 'agent.blr2@shipshaft.com' },
    { $set: { passwordHash: agentHashedPassword, isActive: true } }
  );

  let agentBLR2 = await Agent.findOne({ employeeId: 'AGT-003' });
  if (!agentBLR2) {
    agentBLR2 = await Agent.create({
      userId: agentBLR2User._id,
      branchId: blrBranch._id,
      employeeId: 'AGT-003',
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      isAvailable: true,
      currentWorkload: 0,
      totalDeliveries: 0,
    });
  } else {
    agentBLR2.availability = 'AVAILABLE';
    agentBLR2.isAvailable = true;
    agentBLR2.status = 'ACTIVE';
    agentBLR2.branchId = blrBranch._id;
    await agentBLR2.save();
  }

  // Clean up any test shipments from previous test runs so workloads start at clean baseline
  await Shipment.deleteMany({ senderName: 'Sender Test Phase 7' });

  // Register Customer 1
  const timestamp = Date.now();
  const customer1Email = `qr_cust1_${timestamp}@test.com`;
  const password = 'Password@12345';

  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QR Customer One',
      email: customer1Email,
      phone: '+91 98765 11111',
      password,
      confirmPassword: password,
    }),
  });
  const customer1Cookie = reg1Res.headers.get('set-cookie');

  // Register Customer 2
  const customer2Email = `qr_cust2_${timestamp}@test.com`;
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QR Customer Two',
      email: customer2Email,
      phone: '+91 98765 22222',
      password,
      confirmPassword: password,
    }),
  });
  const customer2Cookie = reg2Res.headers.get('set-cookie');

  // Login Admin
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shipshaft.com', password: 'Admin@123456' }),
  });
  const adminCookie = adminRes.headers.get('set-cookie');

  // Login Agent 1 (BLR)
  const agent1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent.blr@shipshaft.com', password: 'Agent@123456' }),
  });
  const agent1Cookie = agent1Res.headers.get('set-cookie');

  // Login Agent 2 (BLR)
  const agent2Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent.blr2@shipshaft.com', password: 'Agent@123456' }),
  });
  const agent2Cookie = agent2Res.headers.get('set-cookie');

  let passed = 0;
  let total = 25;

  function assert(condition, message, testNum) {
    if (condition) {
      console.log(`✓ Test ${testNum}: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL Test ${testNum}: ${message}`);
    }
  }

  console.log('\n--- Running Phase 7 QR Verification Tests ---\n');

  // Test 25: Existing authentication still works
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: customer1Cookie },
  });
  const sessionData = await sessionRes.json();
  assert(sessionData.authenticated && sessionData.user.email === customer1Email, 'Existing authentication still works', 25);

  // Test 22 & 1 & 3 & 4: New shipment receives QR token, generated server-side (client attempted token ignored)
  const fakeClientToken = 'ATTEMPTED_CLIENT_FAKE_TOKEN_12345';
  const bookRes = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customer1Cookie },
    body: JSON.stringify({
      originBranchId: kocBranch._id.toString(),
      destinationBranchId: blrBranch._id.toString(),
      serviceType: 'EXPRESS',
      senderName: 'Sender Test Phase 7',
      senderPhone: '+91 98765 00001',
      senderAddress: 'Marine Drive, Kochi, Kerala 682001',
      receiverName: 'Receiver Test Phase 7',
      receiverPhone: '+91 98765 00002',
      receiverAddress: 'MG Road, Bengaluru, Karnataka 560001',
      packageDescription: 'Precision Avionics Components',
      weight: 2.5,
      length: 20,
      width: 15,
      height: 10,
      qrToken: fakeClientToken, // Frontend attempted bypass
    }),
  });
  const bookData = await bookRes.json();
  const testShipment1 = bookData.shipment;

  assert(
    testShipment1 &&
    testShipment1.qrToken &&
    testShipment1.qrToken.startsWith('SHPQR-') &&
    testShipment1.qrToken !== fakeClientToken,
    'New shipment receives QR token generated server-side',
    1
  );

  assert(testShipment1.qrToken !== fakeClientToken, 'Frontend cannot provide its own QR token', 4);
  assert(testShipment1.qrToken.startsWith('SHPQR-'), 'QR token is generated server-side (cryptographic SHPQR- format)', 3);
  assert(testShipment1.status === 'BOOKED', 'Existing shipment booking still works', 22);

  // Test 2: QR token is unique
  const bookRes2 = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customer1Cookie },
    body: JSON.stringify({
      originBranchId: kocBranch._id.toString(),
      destinationBranchId: blrBranch._id.toString(),
      serviceType: 'STANDARD',
      senderName: 'Sender Test Phase 7',
      senderPhone: '+91 98765 00001',
      senderAddress: 'Marine Drive, Kochi, Kerala 682001',
      receiverName: 'Receiver Test Phase 7',
      receiverPhone: '+91 98765 00002',
      receiverAddress: 'MG Road, Bengaluru, Karnataka 560001',
      packageDescription: 'Sample Hardware',
      weight: 1.0,
      length: 10,
      width: 10,
      height: 10,
    }),
  });
  const bookData2 = await bookRes2.json();
  const testShipment2 = bookData2.shipment;
  assert(testShipment1.qrToken !== testShipment2.qrToken, 'QR token is unique across shipments', 2);

  // Test 5: QR token remains stable after reload
  await fetch(`${BASE_URL}/shipments/${testShipment1.trackingNumber}`, { headers: { Cookie: customer1Cookie } });
  await fetch(`${BASE_URL}/shipments/${testShipment1.trackingNumber}`, { headers: { Cookie: customer1Cookie } });
  const refetchedShipment = await Shipment.findById(testShipment1._id);
  assert(refetchedShipment.qrToken === testShipment1.qrToken, 'QR token remains stable after reload/subsequent checks', 5);

  // Test 6: Customer can resolve own shipment QR
  const custResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, {
    headers: { Cookie: customer1Cookie },
  });
  const custResolveData = await custResolveRes.json();
  assert(
    custResolveRes.status === 200 &&
    custResolveData.success &&
    custResolveData.shipment.trackingNumber === testShipment1.trackingNumber,
    'Customer can resolve own shipment QR',
    6
  );

  // Test 7: Customer cannot resolve another customer\'s QR (403)
  const cust2ResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, {
    headers: { Cookie: customer2Cookie },
  });
  assert(cust2ResolveRes.status === 403, 'Customer cannot resolve another customer\'s QR (403 Forbidden)', 7);

  // Test 23 & 24: Existing payment flow still works & triggers agent assignment
  const payRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customer1Cookie },
    body: JSON.stringify({
      shipmentId: testShipment1._id.toString(),
      method: 'CARD',
    }),
  });
  const payData = await payRes.json();
  assert((payRes.status === 200 || payRes.status === 201) && payData.success && payData.payment?.status === 'PAID', 'Existing payment flow still works', 23);

  const dbPaidShipment = await Shipment.findById(testShipment1._id);
  assert(dbPaidShipment.status === 'ASSIGNED' && Boolean(dbPaidShipment.agentId), 'Existing agent assignment still works (assigned upon payment)', 24);

  const assignedAgentId = dbPaidShipment.agentId.toString();
  const isAgent1Assigned = assignedAgentId === agentBLR1._id.toString();
  const assignedAgentCookie = isAgent1Assigned ? agent1Cookie : agent2Cookie;
  const unassignedAgentCookie = isAgent1Assigned ? agent2Cookie : agent1Cookie;

  // Test 8: Agent can resolve assigned shipment QR
  const agentResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, {
    headers: { Cookie: assignedAgentCookie },
  });
  const agentResolveData = await agentResolveRes.json();
  assert(
    agentResolveRes.status === 200 &&
    agentResolveData.success &&
    agentResolveData.shipment.trackingNumber === testShipment1.trackingNumber,
    'Agent can resolve assigned shipment QR',
    8
  );

  // Test 9: Agent cannot resolve another agent\'s shipment QR (403 Forbidden)
  const otherAgentResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, {
    headers: { Cookie: unassignedAgentCookie },
  });
  const otherAgentResolveData = await otherAgentResolveRes.json();
  assert(
    otherAgentResolveRes.status === 403 &&
    otherAgentResolveData.error?.includes('not assigned to you'),
    'Agent cannot resolve another agent\'s shipment QR (403 Forbidden)',
    9
  );

  // Test 10: Admin can resolve shipment QR
  const adminResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, {
    headers: { Cookie: adminCookie },
  });
  const adminResolveData = await adminResolveRes.json();
  assert(
    adminResolveRes.status === 200 &&
    adminResolveData.success &&
    adminResolveData.shipment.trackingNumber === testShipment1.trackingNumber,
    'Admin can resolve shipment QR',
    10
  );

  // Test 11: Invalid QR returns safe error (404)
  const invalidResolveRes = await fetch(`${BASE_URL}/api/shipments/qr/SHPQR-NONEXISTENTTOKEN99999`, {
    headers: { Cookie: assignedAgentCookie },
  });
  assert(invalidResolveRes.status === 404, 'Invalid QR returns safe 404 error without leaking DB errors', 11);

  // Test 12: QR does not expose sensitive information
  const exposedKeys = Object.keys(agentResolveData.shipment);
  const hasSensitiveData = ['password', 'passwordHash', 'otp', 'otpHash', 'card', 'cvv'].some((k) =>
    exposedKeys.includes(k)
  );
  assert(!hasSensitiveData, 'QR does not expose sensitive information (password, OTP, secrets omitted)', 12);

  // Test 13 & 14 & 15: QR scan does not change shipment status or create tracking events
  const statusBeforeScan = dbPaidShipment.status;
  const eventsCountBefore = await TrackingEvent.countDocuments({ shipmentId: dbPaidShipment._id });

  // Perform multiple scans
  await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, { headers: { Cookie: assignedAgentCookie } });
  await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.qrToken}`, { headers: { Cookie: assignedAgentCookie } });

  const shipmentAfterScan = await Shipment.findById(testShipment1._id);
  const eventsCountAfter = await TrackingEvent.countDocuments({ shipmentId: dbPaidShipment._id });

  assert(shipmentAfterScan.status === statusBeforeScan, 'QR scan does not change shipment status', 13);
  assert(eventsCountBefore === eventsCountAfter, 'QR scan does not create tracking events', 14);
  assert(shipmentAfterScan.status === 'ASSIGNED', 'Duplicate scan does not alter shipment', 15);

  // Test 16: Tracking-number fallback respects authorization
  const trackingFallbackAssigned = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.trackingNumber}`, {
    headers: { Cookie: assignedAgentCookie },
  });
  const trackingFallbackOther = await fetch(`${BASE_URL}/api/shipments/qr/${testShipment1.trackingNumber}`, {
    headers: { Cookie: unassignedAgentCookie },
  });
  assert(
    trackingFallbackAssigned.status === 200 && trackingFallbackOther.status === 403,
    'Tracking-number fallback respects authorization',
    16
  );

  // Test 17: Existing shipments without QR tokens receive one safely
  const customer1User = await User.findOne({ email: customer1Email });
  const legacyShipment = await Shipment.create({
    trackingNumber: `SHP-LEGACY-${Date.now().toString().slice(-6)}`,
    customerId: customer1User._id,
    originBranchId: kocBranch._id,
    destinationBranchId: blrBranch._id,
    senderName: 'Legacy Sender',
    senderPhone: '+91 98765 00001',
    senderAddress: 'Legacy Address',
    receiverName: 'Legacy Receiver',
    receiverPhone: '+91 98765 00002',
    receiverAddress: 'Legacy Destination',
    shippingCost: 350,
    status: 'BOOKED',
  });
  // Fetching the shipment page triggers ensureShipmentQrToken server-side
  await fetch(`${BASE_URL}/shipments/${legacyShipment.trackingNumber}`, {
    headers: { Cookie: customer1Cookie },
  });
  const refetchedLegacy = await Shipment.findById(legacyShipment._id);
  assert(
    Boolean(refetchedLegacy.qrToken) &&
    refetchedLegacy.qrToken.startsWith('SHPQR-'),
    'Existing shipments without QR tokens receive one safely',
    17
  );

  // Test 18: Customer shipment details displays QR
  const detailsHtmlRes = await fetch(`${BASE_URL}/shipments/${testShipment1.trackingNumber}`, {
    headers: { Cookie: customer1Cookie },
  });
  const detailsHtml = await detailsHtmlRes.text();
  assert(
    detailsHtmlRes.status === 200 &&
    (detailsHtml.includes('Waybill Digital Pass') || detailsHtml.includes('data:image/png;base64')),
    'Customer shipment details displays QR code',
    18
  );

  // Test 19: Agent scanner can process valid QR (via formatted payload SHIPSHAFT:<token>)
  const formattedPrefixedPayload = `SHIPSHAFT:${testShipment1.qrToken}`;
  const prefixedRes = await fetch(`${BASE_URL}/api/shipments/qr/${encodeURIComponent(formattedPrefixedPayload)}`, {
    headers: { Cookie: assignedAgentCookie },
  });
  const prefixedData = await prefixedRes.json();
  assert(prefixedRes.status === 200 && prefixedData.success, 'Agent scanner can process valid QR with SHIPSHAFT: prefix', 19);

  // Test 20: Agent scanner handles invalid QR
  const invalidPrefixedRes = await fetch(`${BASE_URL}/api/shipments/qr/${encodeURIComponent('SHIPSHAFT:SHPQR-MALFORMEDTOKEN')}`, {
    headers: { Cookie: assignedAgentCookie },
  });
  assert(invalidPrefixedRes.status === 404, 'Agent scanner handles invalid QR safely', 20);

  // Test 21: Camera permission denial handled gracefully (Scanner component loads without requiring hardware camera)
  const scannerPageRes = await fetch(`${BASE_URL}/agent/scan`, {
    headers: { Cookie: assignedAgentCookie },
  });
  const scannerPageHtml = await scannerPageRes.text();
  assert(
    scannerPageRes.status === 200 &&
    scannerPageHtml.includes('Package Scanner') &&
    scannerPageHtml.includes('qr-reader-viewport'),
    'Camera permission denial handled gracefully (page loads standalone with manual fallback)',
    21
  );

  console.log('\n====================================================');
  console.log(`PHASE 7 TEST RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
