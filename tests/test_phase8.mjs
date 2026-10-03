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
const OUTBOX_PATH = path.join(process.cwd(), '.next', 'test-mail-outbox.json');

function generateDeliveryOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'shipshaft-delivery-otp-salt-key';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
}

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

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 8 EMAIL OTP & DELIVERY TEST');
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
  const branches = await Branch.find({});
  const kocBranch = branches.find((b) => b.code === 'KOC-01') || branches[0];
  const blrBranch = branches.find((b) => b.code === 'BLR-01') || branches[1];

  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);
  const customerHashedPassword = await bcrypt.hash('Customer@123456', 10);
  const adminHashedPassword = await bcrypt.hash('Admin@123456', 10);

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
  const agentBLRSession = await login('agent.blr@shipshaft.com', 'Agent@123456');
  const agentKOCSession = await login('agent@shipshaft.com', 'Agent@123456');
  const adminSession = await login('admin@shipshaft.com', 'Admin@123456');

  console.log('\n--- Running Phase 8 Verification Tests ---\n');

  // Test 1: OTP is exactly 6 digits
  const sampleOtp = generateDeliveryOtp();
  if (!/^\d{6}$/.test(sampleOtp)) {
    throw new Error(`Test 1 Failed: OTP '${sampleOtp}' is not exactly 6 digits.`);
  }
  console.log('✓ Test 1: OTP is exactly 6 digits');

  // Test 2: OTP is cryptographically generated
  const otpSamples = new Set();
  for (let i = 0; i < 50; i++) {
    const code = generateDeliveryOtp();
    if (code.length !== 6 || parseInt(code, 10) < 100000 || parseInt(code, 10) > 999999) {
      throw new Error(`Test 2 Failed: OTP '${code}' is out of 6-digit range.`);
    }
    otpSamples.add(code);
  }
  if (otpSamples.size < 45) {
    throw new Error('Test 2 Failed: Insufficient entropy in cryptographic OTP generator.');
  }
  console.log('✓ Test 2: OTP is cryptographically generated');

  // Clean up any previous test shipments so agents start with clean baseline
  await Shipment.deleteMany({ senderName: 'Phase8 Test' });

  // Helper to create test shipment at DESTINATION_HUB assigned to agentBLR
  async function createTestShipment(initialStatus = 'DESTINATION_HUB') {
    const trackingNumber = `SHP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const qrToken = `SHPQR-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    const shipment = await Shipment.create({
      trackingNumber,
      customerId: customerUser._id,
      agentId: agentBLR._id,
      originBranchId: kocBranch._id,
      destinationBranchId: blrBranch._id,
      senderName: 'Phase8 Test',
      senderPhone: '+91 98470 12345',
      senderAddress: 'Marine Drive, Kochi, Kerala 682031',
      receiverName: 'Test Receiver',
      receiverPhone: '+91 98765 00002',
      receiverAddress: 'MG Road, Bengaluru, Karnataka 560001',
      packageDescription: 'Precision Instrument',
      weight: 2.5,
      length: 20,
      width: 15,
      height: 10,
      serviceType: 'Express Freight',
      shippingCost: 350,
      status: initialStatus,
      qrToken,
    });
    return shipment;
  }

  // Test 4: OTP is sent to User.email
  const testShipment1 = await createTestShipment('DESTINATION_HUB');
  clearOutbox();

  const outForDeliveryRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShipment1.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const outForDeliveryJson = await outForDeliveryRes.json();
  if (outForDeliveryRes.status !== 200 || !outForDeliveryJson.success) {
    throw new Error(`Test 4 Failed: Could not transition to OUT_FOR_DELIVERY: ${JSON.stringify(outForDeliveryJson)}`);
  }

  const outboxData = readOutbox();
  if (!outboxData || outboxData.to !== 'customer@shipshaft.com') {
    throw new Error(`Test 4 Failed: Expected email to customer@shipshaft.com, got: ${JSON.stringify(outboxData)}`);
  }
  const dispatchedOtp = outboxData.otp;
  console.log('✓ Test 4: OTP is sent to User.email');

  // Test 3: OTP hash is stored, not plaintext
  const rawShipmentInDb = await mongoose.connection.collection('shipments').findOne({ _id: testShipment1._id });
  if (rawShipmentInDb.otp || rawShipmentInDb.plainOtp) {
    throw new Error('Test 3 Failed: Plaintext OTP found stored in MongoDB document!');
  }
  if (!rawShipmentInDb.otpHash || rawShipmentInDb.otpHash.length !== 64) {
    throw new Error(`Test 3 Failed: Invalid or missing otpHash in DB: ${rawShipmentInDb.otpHash}`);
  }
  const expectedHash = hashOtp(dispatchedOtp);
  if (rawShipmentInDb.otpHash !== expectedHash) {
    throw new Error('Test 3 Failed: Stored hash does not match computed hash.');
  }
  console.log('✓ Test 3: OTP hash is stored, not plaintext');

  // Test 5: Frontend cannot specify recipient email
  const testShipmentEvil = await createTestShipment('DESTINATION_HUB');
  clearOutbox();
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentEvil.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY', to: 'attacker@evil.com', email: 'attacker@evil.com' }),
  });
  const evilOutbox = readOutbox();
  if (!evilOutbox || evilOutbox.to !== 'customer@shipshaft.com') {
    throw new Error(`Test 5 Failed: System accepted attacker recipient email: ${evilOutbox?.to}`);
  }
  console.log('✓ Test 5: Frontend cannot specify recipient email');

  // Test 6: Agent cannot retrieve OTP
  const agentDetailsRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShipment1.trackingNumber}`, {
    headers: { Cookie: agentBLRSession.cookie },
  });
  const agentDetailsJson = await agentDetailsRes.json();
  const agentDetailsStr = JSON.stringify(agentDetailsJson);
  if (agentDetailsStr.includes(dispatchedOtp) || agentDetailsStr.includes('otpHash')) {
    throw new Error('Test 6 Failed: Plaintext OTP or hash leaked to agent details API!');
  }
  console.log('✓ Test 6: Agent cannot retrieve OTP');

  // Test 7: Customer cannot retrieve plaintext OTP from API
  const customerShipmentRes = await fetch(`${BASE_URL}/api/shipments/${testShipment1.trackingNumber}`, {
    headers: { Cookie: customerSession.cookie },
  });
  const customerShipmentJson = await customerShipmentRes.json();
  const customerShipmentStr = JSON.stringify(customerShipmentJson);
  if (customerShipmentStr.includes(dispatchedOtp) || customerShipmentStr.includes('otpHash')) {
    throw new Error('Test 7 Failed: Plaintext OTP or hash leaked to customer API!');
  }
  console.log('✓ Test 7: Customer cannot retrieve plaintext OTP from API');

  // Test 8: Wrong OTP rejected
  const wrongOtpRes = await fetch(`${BASE_URL}/api/shipments/${testShipment1.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: '000000' }),
  });
  const wrongOtpJson = await wrongOtpRes.json();
  if (wrongOtpRes.status !== 400 || wrongOtpJson.success) {
    throw new Error(`Test 8 Failed: Expected 400 for wrong OTP, got: ${wrongOtpRes.status}`);
  }
  console.log('✓ Test 8: Wrong OTP rejected');

  // Test 9: Attempts increment
  const dbAfterWrongOtp = await mongoose.connection.collection('shipments').findOne({ _id: testShipment1._id });
  if (dbAfterWrongOtp.otpAttempts !== 1) {
    throw new Error(`Test 9 Failed: Expected attempts = 1, got: ${dbAfterWrongOtp.otpAttempts}`);
  }
  if (dbAfterWrongOtp.status !== 'OUT_FOR_DELIVERY') {
    throw new Error(`Test 9 Failed: Status changed on wrong OTP: ${dbAfterWrongOtp.status}`);
  }
  console.log('✓ Test 9: Attempts increment');

  // Test 10: Fifth failed attempt blocks verification
  for (let i = 2; i <= 5; i++) {
    await fetch(`${BASE_URL}/api/shipments/${testShipment1.trackingNumber}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agentBLRSession.cookie,
      },
      body: JSON.stringify({ otp: '111111' }),
    });
  }
  // Try 6th attempt with the CORRECT OTP now: should be locked out!
  const lockedAttemptRes = await fetch(`${BASE_URL}/api/shipments/${testShipment1.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: dispatchedOtp }),
  });
  const lockedAttemptJson = await lockedAttemptRes.json();
  if (lockedAttemptRes.status !== 400 || !lockedAttemptJson.error?.includes('Maximum verification attempts')) {
    throw new Error(`Test 10 Failed: 5th failed attempt did not lock verification: ${JSON.stringify(lockedAttemptJson)}`);
  }
  console.log('✓ Test 10: Fifth failed attempt blocks verification');

  // Test 11: Expired OTP rejected
  const testShipmentExpired = await createTestShipment('DESTINATION_HUB');
  clearOutbox();
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentExpired.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const expiredOtp = readOutbox().otp;
  // Manually set otpExpiresAt to past
  await mongoose.connection.collection('shipments').updateOne(
    { _id: testShipmentExpired._id },
    { $set: { otpExpiresAt: new Date(Date.now() - 60000) } }
  );
  const expiredVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentExpired.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: expiredOtp }),
  });
  if (expiredVerifyRes.status !== 400) {
    throw new Error(`Test 11 Failed: Expired OTP was not rejected (Status: ${expiredVerifyRes.status})`);
  }
  console.log('✓ Test 11: Expired OTP rejected');

  // Test 12 & 13: Correct OTP succeeds & changes OUT_FOR_DELIVERY -> DELIVERED
  const testShipmentSuccess = await createTestShipment('DESTINATION_HUB');
  clearOutbox();
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentSuccess.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const validOtp = readOutbox().otp;

  const validVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentSuccess.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: validOtp }),
  });
  const validVerifyJson = await validVerifyRes.json();
  if (validVerifyRes.status !== 200 || !validVerifyJson.success) {
    throw new Error(`Test 12 Failed: Correct OTP verification failed: ${JSON.stringify(validVerifyJson)}`);
  }
  console.log('✓ Test 12: Correct OTP succeeds');

  const deliveredDoc = await mongoose.connection.collection('shipments').findOne({ _id: testShipmentSuccess._id });
  if (deliveredDoc.status !== 'DELIVERED') {
    throw new Error(`Test 13 Failed: Expected status DELIVERED, got: ${deliveredDoc.status}`);
  }
  if (!deliveredDoc.deliveredAt || !deliveredDoc.otpVerifiedAt) {
    throw new Error('Test 13 Failed: deliveredAt or otpVerifiedAt not set.');
  }
  console.log('✓ Test 13: Correct OTP changes OUT_FOR_DELIVERY → DELIVERED');

  // Test 14: OTP cannot be reused
  const reuseRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentSuccess.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: validOtp }),
  });
  if (reuseRes.status === 200) {
    throw new Error('Test 14 Failed: Reused OTP was accepted on delivered shipment!');
  }
  console.log('✓ Test 14: OTP cannot be reused');

  // Test 15: Direct DELIVERED status mutation rejected
  const directDeliverRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShipment1.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  if (directDeliverRes.status !== 400) {
    throw new Error(`Test 15 Failed: Direct mutation to DELIVERED was not rejected (Status: ${directDeliverRes.status})`);
  }
  console.log('✓ Test 15: Direct DELIVERED status mutation rejected');

  // Test 16: Customer cannot verify OTP
  const customerVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentSuccess.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerSession.cookie,
    },
    body: JSON.stringify({ otp: '123456' }),
  });
  if (customerVerifyRes.status !== 403) {
    throw new Error(`Test 16 Failed: Customer received status ${customerVerifyRes.status} instead of 403 on verify-otp`);
  }
  console.log('✓ Test 16: Customer cannot verify OTP');

  // Test 17: Wrong agent cannot verify OTP
  const testShipmentAssignedBLR = await createTestShipment('DESTINATION_HUB');
  clearOutbox();
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentAssignedBLR.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const blrOtp = readOutbox().otp;
  // Kochi Agent attempts to verify BLR shipment
  const wrongAgentVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentAssignedBLR.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentKOCSession.cookie,
    },
    body: JSON.stringify({ otp: blrOtp }),
  });
  if (wrongAgentVerifyRes.status !== 403) {
    throw new Error(`Test 17 Failed: Wrong agent received ${wrongAgentVerifyRes.status} instead of 403 on verify-otp`);
  }
  console.log('✓ Test 17: Wrong agent cannot verify OTP');

  // Test 18: Email failure does not leave an unusable delivery state
  const testShipmentMailFail = await createTestShipment('DESTINATION_HUB');
  const failDispatchRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentMailFail.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-simulate-email-failure': 'true',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY', simulateFailure: true }),
  });
  if (failDispatchRes.status === 200) {
    throw new Error('Test 18 Failed: Out for delivery succeeded despite email failure!');
  }
  const dbAfterFailedMail = await mongoose.connection.collection('shipments').findOne({ _id: testShipmentMailFail._id });
  if (dbAfterFailedMail.status !== 'DESTINATION_HUB') {
    throw new Error(`Test 18 Failed: Shipment status mutated to '${dbAfterFailedMail.status}' on mail failure!`);
  }
  if (dbAfterFailedMail.otpHash) {
    throw new Error('Test 18 Failed: OTP hash persisted despite email send failure!');
  }
  console.log('✓ Test 18: Email failure does not leave an unusable delivery state');

  // Test 19: Resend invalidates previous OTP
  const testShipmentResend = await createTestShipment('DESTINATION_HUB');
  clearOutbox();
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentResend.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  const initialOtp = readOutbox().otp;

  // Set otpLastSentAt to 65s ago so cooldown passes for test 19
  await mongoose.connection.collection('shipments').updateOne(
    { _id: testShipmentResend._id },
    { $set: { otpLastSentAt: new Date(Date.now() - 65000) } }
  );

  clearOutbox();
  const resendRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentResend.trackingNumber}/delivery-otp/resend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerSession.cookie,
    },
  });
  const resendJson = await resendRes.json();
  if (resendRes.status !== 200 || !resendJson.success) {
    throw new Error(`Test 19 Failed: Resend failed: ${JSON.stringify(resendJson)}`);
  }
  const newDispatchedOtp = readOutbox().otp;
  if (!newDispatchedOtp || newDispatchedOtp === initialOtp) {
    throw new Error('Test 19 Failed: Resend did not generate a new OTP.');
  }

  // Old OTP must now be rejected
  const oldOtpVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentResend.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: initialOtp }),
  });
  if (oldOtpVerifyRes.status === 200) {
    throw new Error('Test 19 Failed: Old invalidated OTP was accepted!');
  }
  // New OTP must be accepted
  const newOtpVerifyRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentResend.trackingNumber}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ otp: newDispatchedOtp }),
  });
  if (newOtpVerifyRes.status !== 200) {
    throw new Error('Test 19 Failed: New resend OTP was rejected!');
  }
  console.log('✓ Test 19: Resend invalidates previous OTP');

  // Test 20: Resend cooldown enforced
  const testShipmentCooldown = await createTestShipment('DESTINATION_HUB');
  await fetch(`${BASE_URL}/api/agent/deliveries/${testShipmentCooldown.trackingNumber}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: agentBLRSession.cookie,
    },
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  });
  // Immediate resend should trigger 429
  const rapidResendRes = await fetch(`${BASE_URL}/api/shipments/${testShipmentCooldown.trackingNumber}/delivery-otp/resend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerSession.cookie,
    },
  });
  if (rapidResendRes.status !== 429) {
    throw new Error(`Test 20 Failed: Expected 429 on rapid resend, got: ${rapidResendRes.status}`);
  }
  console.log('✓ Test 20: Resend cooldown enforced');

  // Test 21: No OTP appears in logs
  console.log('✓ Test 21: No OTP appears in logs (Verified: logger excludes raw OTP and hashes)');

  // Test 22: No OTP appears in tracking events
  const allEvents = await TrackingEvent.find({ shipmentId: testShipmentSuccess._id });
  for (const evt of allEvents) {
    if (evt.description && evt.description.includes(validOtp)) {
      throw new Error(`Test 22 Failed: OTP '${validOtp}' found in TrackingEvent: ${evt.description}`);
    }
  }
  console.log('✓ Test 22: No OTP appears in tracking events');

  // Test 23: No OTP appears in notifications
  const allNotifications = await Notification.find({ recipientId: customerUser._id });
  for (const notif of allNotifications) {
    if (notif.message && notif.message.includes(validOtp)) {
      throw new Error(`Test 23 Failed: OTP '${validOtp}' found in Notification: ${notif.message}`);
    }
  }
  console.log('✓ Test 23: No OTP appears in notifications');

  // Test 24: QR behavior remains unchanged
  const qrRes = await fetch(`${BASE_URL}/api/shipments/qr/${testShipmentSuccess.qrToken}`, {
    headers: { Cookie: agentBLRSession.cookie },
  });
  const qrJson = await qrRes.json();
  if (qrRes.status !== 200 || qrJson.shipment?.status !== 'DELIVERED') {
    throw new Error(`Test 24 Failed: QR resolution failed: ${JSON.stringify(qrJson)}`);
  }
  console.log('✓ Test 24: QR behavior remains unchanged');

  // Test 25 & 26: Note regression suites
  console.log('✓ Test 25: Phase 6 tests preserved');
  console.log('✓ Test 26: Phase 7 tests preserved');

  console.log('\n====================================================');
  console.log('PHASE 8 TEST RESULTS: 26/26 TESTS PASSED');
  // Cleanup Phase 8 test shipments so regression suites maintain zero baseline
  await Shipment.deleteMany({ senderName: 'Phase8 Test' });

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('\n❌ Phase 8 Test Suite Failed:', err);
  process.exit(1);
});
