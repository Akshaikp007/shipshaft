import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 6 AGENT ASSIGNMENT & WORKFLOW TEST');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for DB validations');

  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

  // Find branches
  const branches = await Branch.find({});
  const kocBranch = branches.find((b) => b.code === 'KOC-01') || branches[0];
  const blrBranch = branches.find((b) => b.code === 'BLR-01') || branches[1];

  if (!kocBranch || !blrBranch) {
    throw new Error('Required branches KOC-01 and BLR-01 not found.');
  }

  const agentHashedPassword = await bcrypt.hash('Agent@123456', 10);

  // Ensure Agent 1 User (BLR) exists with matching password hash
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
    agentBLR1.userId = agentBLR1User._id;
    agentBLR1.availability = 'AVAILABLE';
    agentBLR1.isAvailable = true;
    agentBLR1.status = 'ACTIVE';
    agentBLR1.branchId = blrBranch._id;
    await agentBLR1.save();
  }

  // Ensure Agent 2 User (BLR) exists with matching password hash
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
    agentBLR2.userId = agentBLR2User._id;
    agentBLR2.availability = 'AVAILABLE';
    agentBLR2.isAvailable = true;
    agentBLR2.status = 'ACTIVE';
    agentBLR2.branchId = blrBranch._id;
    await agentBLR2.save();
  }

  // Ensure Kochi Agent (AGT-001)
  await mongoose.connection.collection('users').updateOne(
    { email: 'agent@shipshaft.com' },
    { $set: { passwordHash: agentHashedPassword, isActive: true } }
  );
  let agentKOC = await Agent.findOne({ employeeId: 'AGT-001' });
  if (agentKOC) {
    agentKOC.availability = 'AVAILABLE';
    agentKOC.isAvailable = true;
    agentKOC.status = 'ACTIVE';
    agentKOC.branchId = kocBranch._id;
    await agentKOC.save();
  }

  // Clean up any test shipments from previous test runs so workloads start at clean baseline
  await Shipment.deleteMany({ senderName: { $regex: /^Sender Test/i } });
  await Shipment.deleteMany({
    agentId: { $in: [agentBLR1._id, agentBLR2._id] },
    status: { $ne: 'DELIVERED' },
  });

  // Register Fresh Test Customer
  const timestamp = Date.now();
  const customerEmail = `agent_test_cust_${timestamp}@test.com`;
  const password = 'Password@12345';

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Agent Test Customer',
      email: customerEmail,
      phone: '+91 98765 77777',
      password,
      confirmPassword: password,
    }),
  });
  const customerCookie = regRes.headers.get('set-cookie');

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
  let total = 26;

  function assert(condition, message, testNum) {
    if (condition) {
      console.log(`✓ Test ${testNum}: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL Test ${testNum}: ${message}`);
    }
  }

  // Helper to book shipment
  async function bookShipment(cookie, destBranchId = blrBranch._id.toString()) {
    const res = await fetch(`${BASE_URL}/api/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        originBranchId: kocBranch._id.toString(),
        destinationBranchId: destBranchId,
        serviceType: 'EXPRESS',
        senderName: 'Sender Test',
        senderPhone: '+91 98765 00001',
        senderAddress: 'Marine Drive, Kochi, Kerala 682001',
        receiverName: 'Receiver Test',
        receiverPhone: '+91 98765 00002',
        receiverAddress: 'MG Road, Bengaluru, Karnataka 560001',
        packageDescription: 'Precision Avionics Components',
        weight: 2.5,
        length: 20,
        width: 15,
        height: 10,
      }),
    });
    const data = await res.json();
    return data.shipment;
  }

  // Helper to pay shipment
  async function payShipment(cookie, shipmentId) {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        shipmentId: shipmentId.toString(),
        method: 'CARD',
      }),
    });
    return await res.json();
  }

  console.log('\n--- Running Section 31 Verification Tests ---\n');

  // Test 1: Unauthenticated agent API access rejected (401)
  const unauthRes = await fetch(`${BASE_URL}/api/agent/deliveries`);
  assert(unauthRes.status === 401, 'Unauthenticated agent API access rejected (401)', 1);

  // Test 2: Customer cannot access agent delivery queue (403)
  const custQueueRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: customerCookie },
  });
  assert(custQueueRes.status === 403, 'Customer cannot access agent delivery queue (403)', 2);

  // Test 24: Existing customer authentication still works
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: customerCookie },
  });
  const sessionData = await sessionRes.json();
  assert(sessionData.authenticated && sessionData.user.email === customerEmail, 'Existing customer authentication still works', 24);

  // Test 26: Existing shipment booking still works
  const testShipment1 = await bookShipment(customerCookie);
  assert(testShipment1 && testShipment1.trackingNumber && testShipment1.status === 'BOOKED', 'Existing shipment booking still works', 26);

  // Test 25: Existing payment flow still works
  const payRes1 = await payShipment(customerCookie, testShipment1._id);
  assert(payRes1.success && payRes1.payment && (payRes1.payment.status === 'PAID' || payRes1.payment.status === 'COMPLETED'), 'Existing payment flow still works', 25);

  // Test 15: Shipment becomes ASSIGNED after successful assignment
  const dbShipment1 = await Shipment.findById(testShipment1._id);
  assert(dbShipment1.status === 'ASSIGNED' && Boolean(dbShipment1.agentId), 'Shipment becomes ASSIGNED after successful assignment', 15);

  // Test 16: Tracking event created for assignment
  const trackingEvents = await TrackingEvent.find({
    $or: [
      { shipmentId: dbShipment1._id },
      { shipmentId: new mongoose.Types.ObjectId(dbShipment1._id) },
    ],
  });
  const assignEvent = trackingEvents.find((e) => e.status === 'ASSIGNED');
  assert(Boolean(assignEvent) && assignEvent.description?.includes('assigned to delivery agent'), 'Tracking event created for assignment', 16);

  // Test 17: Customer notification created
  const notifications = await Notification.find({ recipientId: dbShipment1.customerId });
  const assignNotification = notifications.find((n) => n.title?.includes('Assigned'));
  assert(Boolean(assignNotification) && assignNotification.message?.includes(dbShipment1.trackingNumber), 'Customer notification created', 17);

  // Test 3: Agent can see own assigned shipments
  const agentAssignedId = dbShipment1.agentId.toString();
  const isAgent1 = agentAssignedId === agentBLR1._id.toString();
  const assignedAgentCookie = isAgent1 ? agent1Cookie : agent2Cookie;
  const otherAgentCookie = isAgent1 ? agent2Cookie : agent1Cookie;

  const agentQueueRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: assignedAgentCookie },
  });
  const agentQueueData = await agentQueueRes.json();
  const foundInAssignedQueue = agentQueueData.deliveries?.some(
    (d) => (d.id || d._id) === testShipment1._id.toString()
  );
  assert(agentQueueRes.status === 200 && foundInAssignedQueue, 'Agent can see own assigned shipments in delivery queue', 3);

  // Test 4: Agent cannot see another agent's shipments
  const otherAgentQueueRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: otherAgentCookie },
  });
  const otherAgentQueueData = await otherAgentQueueRes.json();
  const notFoundInOtherQueue = !otherAgentQueueData.deliveries?.some(
    (d) => (d.id || d._id) === testShipment1._id.toString()
  );

  const otherAgentDetailRes = await fetch(`${BASE_URL}/api/agent/deliveries/${testShipment1._id}`, {
    headers: { Cookie: otherAgentCookie },
  });
  assert(notFoundInOtherQueue && otherAgentDetailRes.status === 404, 'Agent cannot see another agent\'s deliveries (queue and details isolated)', 4);

  // Test 5: Admin can view agents
  const adminAgentsRes = await fetch(`${BASE_URL}/api/admin/agents`, {
    headers: { Cookie: adminCookie },
  });
  const adminAgentsData = await adminAgentsRes.json();
  assert(adminAgentsRes.status === 200 && adminAgentsData.success && adminAgentsData.agents?.length >= 2, 'Admin can view agents list with workloads', 5);

  // Test 7: Customer cannot assign an agent (403)
  const custAssignRes = await fetch(`${BASE_URL}/api/admin/shipments/${testShipment1._id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
    body: JSON.stringify({ agentId: agentBLR2._id.toString() }),
  });
  assert(custAssignRes.status === 403, 'Customer cannot assign an agent (403 Forbidden)', 7);

  // Test 8: Agent cannot assign another agent (403)
  const agentAssignRes = await fetch(`${BASE_URL}/api/admin/shipments/${testShipment1._id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: agent1Cookie },
    body: JSON.stringify({ agentId: agentBLR2._id.toString() }),
  });
  assert(agentAssignRes.status === 403, 'Agent cannot assign another agent (403 Forbidden)', 8);

  // Test 11: Wrong-branch agent is excluded
  const wrongBranchRes = await fetch(`${BASE_URL}/api/admin/shipments/${testShipment1._id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ agentId: agentKOC._id.toString() }), // Kochi agent for Bengaluru destination
  });
  const wrongBranchData = await wrongBranchRes.json();
  assert(wrongBranchRes.status === 400 && wrongBranchData.error?.includes('destination branch'), 'Wrong-branch agent is excluded/rejected', 11);

  // Test 6 & 21 & 22: Admin can manually assign / reassign an eligible agent
  const previousAgentId = dbShipment1.agentId.toString();
  const targetAgentId = isAgent1 ? agentBLR2._id.toString() : agentBLR1._id.toString();
  const reassignRes = await fetch(`${BASE_URL}/api/admin/shipments/${testShipment1._id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ agentId: targetAgentId }),
  });
  const reassignData = await reassignRes.json();
  assert(reassignRes.status === 200 && reassignData.success && reassignData.isReassignment === true, 'Admin can assign/reassign eligible agent', 6);

  // Verify Reassignment queue changes
  const prevAgentQueueRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: isAgent1 ? agent1Cookie : agent2Cookie },
  });
  const prevAgentQueue = await prevAgentQueueRes.json();
  const removedFromPrev = !prevAgentQueue.deliveries?.some((d) => (d.id || d._id) === testShipment1._id.toString());
  assert(removedFromPrev, 'Reassignment removes shipment from previous agent\'s active queue', 21);

  const newAgentQueueRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: isAgent1 ? agent2Cookie : agent1Cookie },
  });
  const newAgentQueue = await newAgentQueueRes.json();
  const appearsInNew = newAgentQueue.deliveries?.some((d) => (d.id || d._id) === testShipment1._id.toString());
  assert(appearsInNew, 'New agent sees reassigned shipment in their active queue', 22);

  // Test 23: Agent workload is calculated correctly
  const activeStatuses = ['ASSIGNED', 'PICKED_UP', 'ORIGIN_HUB', 'IN_TRANSIT', 'DESTINATION_HUB', 'OUT_FOR_DELIVERY'];
  const targetWorkload = await Shipment.countDocuments({
    agentId: new mongoose.Types.ObjectId(targetAgentId),
    status: { $in: activeStatuses },
  });
  const prevWorkload = await Shipment.countDocuments({
    agentId: new mongoose.Types.ObjectId(previousAgentId),
    status: { $in: activeStatuses },
  });
  assert(targetWorkload >= 1 && prevWorkload === 0, 'Agent workload is calculated correctly from active shipments', 23);

  // Test 12: Lowest workload eligible agent selected
  // Right now targetAgent has 1 active delivery (testShipment1), previousAgent has 0.
  // Let's create shipment 2 and pay it. Automatic assignment should pick previousAgent (lower workload)!
  const testShipment2 = await bookShipment(customerCookie);
  await payShipment(customerCookie, testShipment2._id);
  const dbShipment2 = await Shipment.findById(testShipment2._id);
  assert(dbShipment2.agentId.toString() === previousAgentId, 'Lowest workload eligible agent is selected (workload: 0 vs 1)', 12);

  // Test 13: Tie-break uses employeeId deterministically
  // Now both BLR agents have 1 active delivery each (shipment1 and shipment2).
  // Agent 1 employeeId is AGT-002, Agent 2 is AGT-003.
  // Lower employeeId is AGT-002.
  const testShipment3 = await bookShipment(customerCookie);
  await payShipment(customerCookie, testShipment3._id);
  const dbShipment3 = await Shipment.findById(testShipment3._id);
  assert(dbShipment3.agentId.toString() === agentBLR1._id.toString(), 'Tie-break uses employeeId deterministically (AGT-002 < AGT-003)', 13);

  // Test 14: No random assignment (deterministic validation)
  await Shipment.findByIdAndDelete(testShipment3._id);
  const testShipment3Repeat = await bookShipment(customerCookie);
  await payShipment(customerCookie, testShipment3Repeat._id);
  const dbShipment3Repeat = await Shipment.findById(testShipment3Repeat._id);
  assert(dbShipment3Repeat.agentId.toString() === agentBLR1._id.toString(), 'No random assignment: repeated execution produces identical assignment', 14);

  // Test 9: Inactive agents are excluded
  // Set all BLR agents to status INACTIVE
  await Agent.updateMany({ branchId: blrBranch._id }, { $set: { status: 'INACTIVE' } });

  const testShipmentInactive = await bookShipment(customerCookie);
  const payInactiveRes = await payShipment(customerCookie, testShipmentInactive._id);
  const dbShipmentInactive = await Shipment.findById(testShipmentInactive._id);
  assert(
    payInactiveRes.success &&
    dbShipmentInactive.status === 'PAYMENT_CONFIRMED' &&
    !dbShipmentInactive.agentId,
    'Inactive agents are excluded from assignment',
    9
  );

  // Test 10: Offline / unavailable agents are excluded
  // Restore status ACTIVE but set availability OFFLINE
  await Agent.updateMany({ branchId: blrBranch._id }, { $set: { status: 'ACTIVE', availability: 'OFFLINE', isAvailable: false } });

  const testShipmentOffline = await bookShipment(customerCookie);
  await payShipment(customerCookie, testShipmentOffline._id);
  const dbShipmentOffline = await Shipment.findById(testShipmentOffline._id);
  assert(
    dbShipmentOffline.status === 'PAYMENT_CONFIRMED' &&
    !dbShipmentOffline.agentId,
    'Offline/unavailable agents are excluded from assignment',
    10
  );

  // Test 18 & 19: Payment still succeeds when no agent is available & Shipment remains PAYMENT_CONFIRMED
  const offlinePaymentDoc = await Payment.findOne({ shipmentId: dbShipmentOffline._id });
  assert(
    offlinePaymentDoc?.status === 'PAID' &&
    dbShipmentOffline.status === 'PAYMENT_CONFIRMED' &&
    !dbShipmentOffline.agentId,
    'Payment succeeds and shipment remains PAYMENT_CONFIRMED when no agent is available',
    18
  );
  assert(
    dbShipmentOffline.status === 'PAYMENT_CONFIRMED',
    'Shipment remains PAYMENT_CONFIRMED without unassigned fallback corrupting state',
    19
  );

  // Test 20: Admin can manually assign later
  // Re-enable BLR agents
  await Agent.updateMany({ branchId: blrBranch._id }, { $set: { status: 'ACTIVE', availability: 'AVAILABLE', isAvailable: true } });
  const adminLaterAssignRes = await fetch(`${BASE_URL}/api/admin/shipments/${dbShipmentOffline._id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ agentId: agentBLR1._id.toString() }),
  });
  const adminLaterAssignData = await adminLaterAssignRes.json();
  const dbShipmentAssignedLater = await Shipment.findById(dbShipmentOffline._id);
  assert(
    adminLaterAssignRes.status === 200 &&
    adminLaterAssignData.success &&
    dbShipmentAssignedLater.status === 'ASSIGNED' &&
    dbShipmentAssignedLater.agentId.toString() === agentBLR1._id.toString(),
    'Admin can manually assign later to transition PAYMENT_CONFIRMED to ASSIGNED',
    20
  );

  // Restore AGT-003
  await Agent.updateOne({ _id: agentBLR2._id }, { $set: { availability: 'AVAILABLE', isAvailable: true } });

  console.log('\n====================================================');
  console.log(`PHASE 6 TEST RESULTS: ${passed}/${total} TESTS PASSED`);
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
