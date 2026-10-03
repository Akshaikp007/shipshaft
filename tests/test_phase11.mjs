import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

// Read .env if present
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

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 11 REAL USER DATA & ISOLATION AUDIT');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB setup and validations');

  const Branch = mongoose.models.Branch || mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.models.Agent || mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.models.TrackingEvent || mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));
  const AgentLocation = mongoose.models.AgentLocation || mongoose.model('AgentLocation', new mongoose.Schema({}, { strict: false }));

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

  // 1. Setup Test Users & Fixtures
  console.log('\n--- Setting up test accounts and branch fixtures ---');
  const defaultPasswordHash = await bcrypt.hash('Secret@123456', 10);

  // Customer A
  let custA = await User.findOne({ email: 'cust_a_p11@shipshaft.com' });
  if (!custA) {
    custA = await User.create({
      name: 'Customer Alpha',
      email: 'cust_a_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      phone: '+1 555-0101',
      isActive: true,
    });
  }

  // Customer B
  let custB = await User.findOne({ email: 'cust_b_p11@shipshaft.com' });
  if (!custB) {
    custB = await User.create({
      name: 'Customer Beta',
      email: 'cust_b_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      phone: '+1 555-0102',
      isActive: true,
    });
  }

  // Customer Empty (no shipments)
  let custEmpty = await User.findOne({ email: 'cust_empty_p11@shipshaft.com' });
  if (!custEmpty) {
    custEmpty = await User.create({
      name: 'Customer Empty',
      email: 'cust_empty_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      phone: '+1 555-0103',
      isActive: true,
    });
  }

  // Branches
  let branchOrigin = await Branch.findOne({ code: 'P11-ORIG' });
  if (!branchOrigin) {
    branchOrigin = await Branch.create({
      name: 'P11 Origin Hub',
      code: 'P11-ORIG',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Plot 10, SEZ Hub',
      pincode: '400001',
      status: 'ACTIVE',
      isActive: true,
      coordinates: { latitude: 19.076, longitude: 72.8777 },
    });
  } else if (!branchOrigin.isActive) {
    await Branch.updateOne({ _id: branchOrigin._id }, { $set: { isActive: true } });
  }

  let branchDest = await Branch.findOne({ code: 'P11-DEST' });
  if (!branchDest) {
    branchDest = await Branch.create({
      name: 'P11 Destination Hub',
      code: 'P11-DEST',
      city: 'Pune',
      state: 'Maharashtra',
      address: 'Sector 5, Logistics Park',
      pincode: '411001',
      status: 'ACTIVE',
      isActive: true,
      coordinates: { latitude: 18.5204, longitude: 73.8567 },
    });
  } else if (!branchDest.isActive) {
    await Branch.updateOne({ _id: branchDest._id }, { $set: { isActive: true } });
  }

  // Agent A User & Record
  let agentAUser = await User.findOne({ email: 'agent_a_p11@shipshaft.com' });
  if (!agentAUser) {
    agentAUser = await User.create({
      name: 'Agent Arthur',
      email: 'agent_a_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'AGENT',
      phone: '+91 99999 00001',
      isActive: true,
    });
  }
  let agentA = await Agent.findOne({ userId: agentAUser._id });
  if (!agentA) {
    agentA = await Agent.create({
      userId: agentAUser._id,
      branchId: branchDest._id,
      employeeId: 'AGT-P11-001',
      assignedHub: 'P11 Destination Hub',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
      vehicleType: 'VAN',
      vehicleNumber: 'MH-12-P11-01',
      activeDeliveriesCount: 0,
      totalDeliveredCount: 0,
    });
  }

  // Agent B User & Record
  let agentBUser = await User.findOne({ email: 'agent_b_p11@shipshaft.com' });
  if (!agentBUser) {
    agentBUser = await User.create({
      name: 'Agent Beatrice',
      email: 'agent_b_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'AGENT',
      phone: '+91 99999 00002',
      isActive: true,
    });
  }
  let agentB = await Agent.findOne({ userId: agentBUser._id });
  if (!agentB) {
    agentB = await Agent.create({
      userId: agentBUser._id,
      branchId: branchDest._id,
      employeeId: 'AGT-P11-002',
      assignedHub: 'P11 Destination Hub',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'MH-12-P11-02',
      activeDeliveriesCount: 0,
      totalDeliveredCount: 0,
    });
  }

  // Admin User
  let adminUser = await User.findOne({ email: 'admin_p11@shipshaft.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin Victor',
      email: 'admin_p11@shipshaft.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      phone: '+1 555-9999',
      isActive: true,
    });
  }

  // Clean up prior P11 test run fixtures for idempotency
  await Shipment.deleteMany({ trackingNumber: /^TRK-P11-/ });
  await Payment.deleteMany({ transactionId: /^TXN-P11-/ });
  await Invoice.deleteMany({ invoiceNumber: /^INV-P11-/ });
  await Notification.deleteMany({ message: /TRK-P11-/ });

  // Create Shipments:
  // Shipment A for Customer A, assigned to Agent A
  const trkA = `TRK-P11-A-${Date.now().toString().slice(-6)}`;
  const shipmentA = await Shipment.create({
    trackingNumber: trkA,
    qrToken: `QR-${trkA}`,
    customerId: custA._id,
    agentId: agentA._id,
    originBranchId: branchOrigin._id,
    destinationBranchId: branchDest._id,
    senderName: 'Sender Alpha',
    senderAddress: 'Mumbai Hub Address',
    senderPhone: '+91 98000 11111',
    receiverName: 'Customer Alpha Recipient',
    receiverAddress: 'Pune Delivery Street 1',
    receiverPhone: '+91 98000 22222',
    receiverEmail: 'cust_a_p11@shipshaft.com',
    weight: 2.5,
    serviceType: 'EXPRESS',
    shippingCost: 45.0,
    status: 'PAYMENT_PENDING',
  });

  // Payment A for Shipment A
  const paymentA = await Payment.create({
    shipmentId: shipmentA._id,
    customerId: custA._id,
    amount: 45.0,
    currency: 'USD',
    method: 'CARD',
    transactionId: `TXN-P11-A-${Date.now().toString().slice(-6)}`,
    status: 'PAID',
    paidAt: new Date(),
  });

  // Invoice A
  const invoiceA = await Invoice.create({
    invoiceNumber: `INV-P11-A-${Date.now().toString().slice(-6)}`,
    shipmentId: shipmentA._id,
    customerId: custA._id,
    amount: 45.0,
    currency: 'USD',
    status: 'ISSUED',
  });

  // Notification A
  await Notification.create({
    recipientId: custA._id,
    userId: custA._id,
    title: 'Shipment Created',
    message: `Your consignment ${trkA} has been booked.`,
    type: 'INFO',
    read: false,
  });

  // Shipment B for Customer B, assigned to Agent B
  const trkB = `TRK-P11-B-${Date.now().toString().slice(-6)}`;
  const shipmentB = await Shipment.create({
    trackingNumber: trkB,
    qrToken: `QR-${trkB}`,
    customerId: custB._id,
    agentId: agentB._id,
    originBranchId: branchOrigin._id,
    destinationBranchId: branchDest._id,
    senderName: 'Sender Beta',
    senderAddress: 'Mumbai Hub Address B',
    senderPhone: '+91 98000 33333',
    receiverName: 'Customer Beta Recipient',
    receiverAddress: 'Pune Delivery Street 2',
    receiverPhone: '+91 98000 44444',
    receiverEmail: 'cust_b_p11@shipshaft.com',
    weight: 4.0,
    serviceType: 'STANDARD',
    shippingCost: 30.0,
    status: 'PAYMENT_PENDING',
  });

  // Payment B
  const paymentB = await Payment.create({
    shipmentId: shipmentB._id,
    customerId: custB._id,
    amount: 30.0,
    currency: 'USD',
    method: 'UPI',
    transactionId: `TXN-P11-B-${Date.now().toString().slice(-6)}`,
    status: 'PAID',
    paidAt: new Date(),
  });

  // Invoice B
  const invoiceB = await Invoice.create({
    invoiceNumber: `INV-P11-B-${Date.now().toString().slice(-6)}`,
    shipmentId: shipmentB._id,
    customerId: custB._id,
    amount: 30.0,
    currency: 'USD',
    status: 'ISSUED',
  });

  // Notification B
  await Notification.create({
    recipientId: custB._id,
    userId: custB._id,
    title: 'Shipment Created',
    message: `Your consignment ${trkB} has been booked.`,
    type: 'INFO',
    read: false,
  });

  // Tracking event for shipment A
  await TrackingEvent.create({
    shipmentId: shipmentA._id,
    status: 'BOOKED',
    location: 'Mumbai Hub',
    description: 'Consignment booked successfully',
    timestamp: new Date(),
  });

  console.log('✓ Test fixtures successfully created in MongoDB.');

  // Logins
  console.log('\n--- Authenticating Test Accounts ---');
  const loginCustA = await login('cust_a_p11@shipshaft.com', 'Secret@123456');
  const loginCustB = await login('cust_b_p11@shipshaft.com', 'Secret@123456');
  const loginCustEmpty = await login('cust_empty_p11@shipshaft.com', 'Secret@123456');
  const loginAgentA = await login('agent_a_p11@shipshaft.com', 'Secret@123456');
  const loginAgentB = await login('agent_b_p11@shipshaft.com', 'Secret@123456');
  const loginAdmin = await login('admin_p11@shipshaft.com', 'Secret@123456');

  if (!loginCustA.cookie || !loginCustB.cookie || !loginAgentA.cookie || !loginAdmin.cookie) {
    throw new Error('Failed to obtain cookies for test accounts');
  }
  console.log('✓ All 6 test user sessions established successfully.');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [TEST ${totalTests}] PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ [TEST ${totalTests}] FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // TEST 1: Customer Data Isolation (Shipments List)
  console.log('\n--- 1. Customer Data Isolation ---');
  const resCustAShipments = await fetch(`${BASE_URL}/api/shipments`, {
    headers: { Cookie: loginCustA.cookie },
  });
  const dataCustAShipments = await resCustAShipments.json();
  const custAShipmentIds = dataCustAShipments.shipments?.map((s) => s.trackingNumber) || [];
  assert(
    custAShipmentIds.includes(trkA) && !custAShipmentIds.includes(trkB),
    'Customer A sees only their own shipment and does NOT see Customer B shipment'
  );

  const resCustBShipments = await fetch(`${BASE_URL}/api/shipments`, {
    headers: { Cookie: loginCustB.cookie },
  });
  const dataCustBShipments = await resCustBShipments.json();
  const custBShipmentIds = dataCustBShipments.shipments?.map((s) => s.trackingNumber) || [];
  assert(
    custBShipmentIds.includes(trkB) && !custBShipmentIds.includes(trkA),
    'Customer B sees only their own shipment and does NOT see Customer A shipment'
  );

  // TEST 2: Agent Data Isolation (Deliveries List)
  console.log('\n--- 2. Agent Data Isolation ---');
  const resAgentADeliveries = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: loginAgentA.cookie },
  });
  const dataAgentADeliveries = await resAgentADeliveries.json();
  const agentAShipmentIds = dataAgentADeliveries.deliveries?.map((d) => d.trackingNumber) || [];
  assert(
    agentAShipmentIds.includes(trkA) && !agentAShipmentIds.includes(trkB),
    'Agent A sees only shipment assigned to Agent A and cannot see Agent B assignment'
  );

  const resAgentBDeliveries = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: loginAgentB.cookie },
  });
  const dataAgentBDeliveries = await resAgentBDeliveries.json();
  const agentBShipmentIds = dataAgentBDeliveries.deliveries?.map((d) => d.trackingNumber) || [];
  assert(
    agentBShipmentIds.includes(trkB) && !agentBShipmentIds.includes(trkA),
    'Agent B sees only shipment assigned to Agent B and cannot see Agent A assignment'
  );

  // TEST 3: Admin Data Access Across Collections
  console.log('\n--- 3. Admin Data Access ---');
  const resAdminShipments = await fetch(`${BASE_URL}/api/shipments?search=TRK-P11`, {
    headers: { Cookie: loginAdmin.cookie },
  });
  const dataAdminShipments = await resAdminShipments.json();
  const allAdminTrackings = dataAdminShipments.shipments?.map((s) => s.trackingNumber) || [];
  assert(
    allAdminTrackings.includes(trkA) && allAdminTrackings.includes(trkB),
    'Admin can view operational consignments across all customers'
  );

  const resAdminBranches = await fetch(`${BASE_URL}/api/branches`, {
    headers: { Cookie: loginAdmin.cookie },
  });
  const dataAdminBranches = await resAdminBranches.json();
  assert(
    Array.isArray(dataAdminBranches.branches) && dataAdminBranches.branches.some((b) => b.code === 'P11-ORIG'),
    'Admin retrieves real MongoDB branches collection'
  );

  // TEST 4: No Mock Fallback on Invalid Requests
  console.log('\n--- 4. Zero Mock Fallback ---');
  const resNonExistentTrack = await fetch(`${BASE_URL}/api/track/NONEXISTENT999XYZ`);
  const dataNonExistentTrack = await resNonExistentTrack.json();
  assert(
    resNonExistentTrack.status === 404 && dataNonExistentTrack.error?.toLowerCase().includes('shipment not found'),
    'Invalid public track returns 404 with no Shanghai/Rotterdam mock data fallback'
  );

  // TEST 5: Empty States with Real Zero-Records User
  console.log('\n--- 5. Empty States Handling ---');
  const resEmptyShipments = await fetch(`${BASE_URL}/api/shipments`, {
    headers: { Cookie: loginCustEmpty.cookie },
  });
  const dataEmptyShipments = await resEmptyShipments.json();
  assert(
    resEmptyShipments.status === 200 && Array.isArray(dataEmptyShipments.shipments) && dataEmptyShipments.shipments.length === 0,
    'Empty customer returns clean empty array without falling back to mock shipments'
  );

  const resEmptyNotifications = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: loginCustEmpty.cookie },
  });
  const dataEmptyNotifications = await resEmptyNotifications.json();
  assert(
    resEmptyNotifications.status === 200 && Array.isArray(dataEmptyNotifications.notifications) && dataEmptyNotifications.notifications.length === 0,
    'Empty customer returns clean empty notifications array without falling back to mock notifications'
  );

  // TEST 6: Shipment Ownership Authorization
  console.log('\n--- 6. Shipment Ownership Authorization ---');
  const resUnauthShipments = await fetch(`${BASE_URL}/api/shipments`);
  assert(
    resUnauthShipments.status === 401,
    'Unauthenticated access to /api/shipments is strictly rejected (401)'
  );

  // TEST 7: Payment Ownership Verification
  console.log('\n--- 7. Payment Ownership Verification ---');
  // Customer B attempting to initiate payment on Customer A's shipment
  const resCrossPayment = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: loginCustB.cookie,
    },
    body: JSON.stringify({
      shipmentId: shipmentA._id.toString(),
      method: 'CARD',
    }),
  });
  assert(
    resCrossPayment.status === 403 || resCrossPayment.status === 404,
    'Customer B cannot initiate or execute payment on Customer A shipment (403/404)'
  );

  // TEST 8: Invoice Ownership Verification
  console.log('\n--- 8. Invoice Ownership Verification ---');
  // Customer B requesting Customer A's invoice page directly
  const resCrossInvoicePage = await fetch(`${BASE_URL}/invoices/${invoiceA.invoiceNumber}`, {
    headers: { Cookie: loginCustB.cookie },
    redirect: 'manual',
  });
  assert(
    resCrossInvoicePage.status === 404,
    'Customer B requesting Customer A invoice page returns 404 (not found / forbidden)'
  );

  // Customer A requesting own invoice page
  const resOwnInvoicePage = await fetch(`${BASE_URL}/invoices/${invoiceA.invoiceNumber}`, {
    headers: { Cookie: loginCustA.cookie },
    redirect: 'manual',
  });
  assert(
    resOwnInvoicePage.status === 200,
    'Customer A successfully loads own invoice page (200)'
  );

  // TEST 9: Notification Ownership Verification
  console.log('\n--- 9. Notification Ownership Verification ---');
  const resCustANotifs = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: loginCustA.cookie },
  });
  const dataCustANotifs = await resCustANotifs.json();
  const notifMessages = dataCustANotifs.notifications?.map((n) => n.message) || [];
  assert(
    notifMessages.some((m) => m.includes(trkA)) && !notifMessages.some((m) => m.includes(trkB)),
    'Customer A notifications contain only Customer A events and zero Customer B events'
  );

  // TEST 10: Public Tracking Data Protection
  console.log('\n--- 10. Public Tracking Data Protection ---');
  const resPublicTrack = await fetch(`${BASE_URL}/api/track/${trkA}`);
  const dataPublicTrack = await resPublicTrack.json();
  assert(
    resPublicTrack.status === 200 &&
    dataPublicTrack.shipment?.trackingNumber === trkA &&
    !dataPublicTrack.shipment?.shippingCost &&
    !dataPublicTrack.shipment?.customerId &&
    !dataPublicTrack.shipment?.otpHash,
    'Public tracking endpoint returns authentic shipment info while scrubbing financial/PII secrets'
  );

  // TEST 11: GPS Telemetry Authorization
  console.log('\n--- 11. GPS Telemetry Authorization ---');
  // Set shipment A to OUT_FOR_DELIVERY for live GPS telemetry
  await Shipment.updateOne({ _id: shipmentA._id }, { $set: { status: 'OUT_FOR_DELIVERY' } });

  // Customer attempting to post driver telemetry
  const resCustGps = await fetch(`${BASE_URL}/api/agent/deliveries/${shipmentA._id}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: loginCustA.cookie,
    },
    body: JSON.stringify({
      latitude: 18.5204,
      longitude: 73.8567,
    }),
  });
  assert(
    resCustGps.status === 403,
    'Customer attempting to send driver GPS telemetry is rejected (403)'
  );

  // Unassigned Agent B attempting to post GPS for Agent A shipment
  const resCrossAgentGps = await fetch(`${BASE_URL}/api/agent/deliveries/${shipmentA._id}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: loginAgentB.cookie,
    },
    body: JSON.stringify({
      latitude: 18.5204,
      longitude: 73.8567,
    }),
  });
  assert(
    resCrossAgentGps.status === 403,
    'Unassigned Agent B attempting to post GPS for Agent A shipment is rejected (403)'
  );

  // Authorized Agent A sending real telemetry
  const resAgentGps = await fetch(`${BASE_URL}/api/agent/deliveries/${shipmentA._id}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: loginAgentA.cookie,
    },
    body: JSON.stringify({
      latitude: 18.5204,
      longitude: 73.8567,
      heading: 90,
      speed: 25,
      accuracy: 5,
    }),
  });
  assert(
    resAgentGps.status === 200 || resAgentGps.status === 201,
    'Authorized agent successfully posts live GPS coordinates'
  );

  // TEST 12: QR Code Authorization
  console.log('\n--- 12. QR Code Authorization ---');
  // Agent A scanning Agent B's QR token
  const resCrossAgentQR = await fetch(`${BASE_URL}/api/shipments/qr/QR-${trkB}`, {
    headers: { Cookie: loginAgentA.cookie },
  });
  assert(
    resCrossAgentQR.status === 403,
    'Agent A scanning Agent B shipment QR token is rejected with 403 Forbidden'
  );

  // Agent A scanning own assigned shipment QR token
  const resOwnAgentQR = await fetch(`${BASE_URL}/api/shipments/qr/QR-${trkA}`, {
    headers: { Cookie: loginAgentA.cookie },
  });
  assert(
    resOwnAgentQR.status === 200,
    'Agent A scanning own assigned shipment QR token succeeds (200)'
  );

  // TEST 13: Reports Authorization
  console.log('\n--- 13. Reports Authorization ---');
  const resCustReports = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
    headers: { Cookie: loginCustA.cookie },
  });
  assert(
    resCustReports.status === 403,
    'Customer attempting to access admin reports overview is forbidden (403)'
  );

  const resAdminReports = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
    headers: { Cookie: loginAdmin.cookie },
  });
  assert(
    resAdminReports.status === 200,
    'Admin successfully accesses MongoDB-backed reports overview'
  );

  // TEST 14: Sensitive Field Exclusion in User APIs
  console.log('\n--- 14. Sensitive Field Exclusion ---');
  const resAdminUsers = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: loginAdmin.cookie },
  });
  const dataAdminUsers = await resAdminUsers.json();
  const hasSecrets = dataAdminUsers.users?.some((u) => u.passwordHash || u.otpHash || u.jwtSecret);
  assert(
    resAdminUsers.status === 200 && !hasSecrets,
    'Admin users list returns real MongoDB user profiles without exposing passwordHash, otpHash, or secrets'
  );

  // TEST 15: Authentication Validation
  console.log('\n--- 15. Authentication Validation ---');
  const resBadAuth = await login('cust_a_p11@shipshaft.com', 'WrongPassword!999');
  assert(
    resBadAuth.status === 401,
    'Authentication with invalid credentials returns 401 Unauthorized'
  );

  // TEST 16: Logout Protection
  console.log('\n--- 16. Logout Protection ---');
  const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: loginCustA.cookie },
  });
  const logoutSetCookie = resLogout.headers.get('set-cookie');
  assert(
    resLogout.status === 200 && logoutSetCookie && (logoutSetCookie.includes('1970') || logoutSetCookie.includes('Max-Age=0')),
    'Logout endpoint clears the session cookie with expired timestamp'
  );

  // Try to use expired/cleared session
  const resPostLogout = await fetch(`${BASE_URL}/api/shipments`, {
    headers: { Cookie: logoutSetCookie.split(';')[0] },
  });
  assert(
    resPostLogout.status === 401,
    'Subsequent requests after logout are rejected (401)'
  );

  console.log('\n====================================================');
  console.log(`PHASE 11 AUDIT RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
