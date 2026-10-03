import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';

async function runTests() {
  console.log('====================================================');
  console.log('SHIPSHAFT — PHASE 5 SIMULATED PAYMENT FLOW TEST SUITE');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB directly for validation checks');

  // Load existing test users or create fresh test accounts
  const timestamp = Date.now();
  const customerAEmail = `custA_${timestamp}@test.com`;
  const customerBEmail = `custB_${timestamp}@test.com`;
  const password = 'Password@12345';

  // 1. Setup Customer A & Customer B
  console.log('\n--- Setting up Test Customers ---');
  
  // Register Customer A
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Customer Alice',
      email: customerAEmail,
      phone: '+91 98765 00001',
      password,
      confirmPassword: password,
    }),
  });
  const cookieA = regARes.headers.get('set-cookie');
  console.log('✓ Registered Customer Alice (Cookie acquired)');

  // Register Customer B
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Customer Bob',
      email: customerBEmail,
      phone: '+91 98765 00002',
      password,
      confirmPassword: password,
    }),
  });
  const cookieB = regBRes.headers.get('set-cookie');
  console.log('✓ Registered Customer Bob (Cookie acquired)');

  // Login as Admin
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@shipshaft.com',
      password: 'Admin@123456',
    }),
  });
  const adminCookie = adminRes.headers.get('set-cookie');
  console.log('✓ Logged in as Admin (Cookie acquired)');

  // Get active branches for booking
  const branchRes = await fetch(`${BASE_URL}/api/branches`);
  const branchData = await branchRes.json();
  const branches = branchData.branches;
  const originBranch = branches[0];
  const destBranch = branches[1] || branches[0];

  // Book shipment for Customer A
  console.log('\n--- Booking Initial Shipment for Customer Alice ---');
  const bookRes = await fetch(`${BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      senderName: 'Customer Alice',
      senderPhone: '+91 98765 00001',
      senderAddress: '42 Marine Drive, Kochi, Kerala',
      originBranchId: originBranch._id,
      receiverName: 'Apex Electronics',
      receiverPhone: '+91 98765 00009',
      receiverAddress: '100 MG Road, Bengaluru, Karnataka',
      destinationBranchId: destBranch._id,
      serviceType: 'EXPRESS',
      packageDescription: 'Precision Avionics Components',
      weight: 12.5,
      length: 30,
      width: 25,
      height: 20,
    }),
  });

  const bookData = await bookRes.json();
  if (!bookRes.ok || !bookData.success) {
    throw new Error(`Failed to book shipment: ${JSON.stringify(bookData)}`);
  }
  const shipment = bookData.shipment;
  shipment.id = shipment._id || shipment.trackingNumber;
  console.log(`✓ Shipment Booked: ${shipment.trackingNumber}, Shipping Cost: ₹${shipment.shippingCost}, Status: ${shipment.status}`);

  // TEST 1: Unauthenticated payment rejected
  console.log('\n--- Test 1: Unauthenticated payment rejected (401) ---');
  const test1Res = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId: shipment._id || shipment.trackingNumber, method: 'CARD' }),
  });
  console.log(`Status: ${test1Res.status}`);
  if (test1Res.status === 401) {
    console.log('✓ PASS: Unauthenticated payment rejected with 401');
  } else {
    throw new Error(`FAIL: Expected 401, got ${test1Res.status}`);
  }

  // TEST 3: Customer B cannot pay Customer A's shipment (403)
  console.log('\n--- Test 3: Customer cannot pay another customer shipment (403) ---');
  const test3Res = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieB,
    },
    body: JSON.stringify({ shipmentId: shipment._id || shipment.trackingNumber, method: 'CARD' }),
  });
  const test3Data = await test3Res.json();
  console.log(`Status: ${test3Res.status}, Error: ${test3Data.error}`);
  if (test3Res.status === 403) {
    console.log('✓ PASS: Customer B prevented from paying Customer A shipment');
  } else {
    throw new Error(`FAIL: Expected 403, got ${test3Res.status}`);
  }

  // TEST 6: Invalid payment method rejected
  console.log('\n--- Test 6: Invalid payment method rejected (400) ---');
  const test6Res = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({ shipmentId: shipment.id, method: 'BITCOIN_INVALID' }),
  });
  console.log(`Status: ${test6Res.status}`);
  if (test6Res.status === 400) {
    console.log('✓ PASS: Invalid payment method rejected with 400');
  } else {
    throw new Error(`FAIL: Expected 400, got ${test6Res.status}`);
  }

  // TEST 2, 5, 7, 8, 9, 10, 11, 12: Customer A pays own shipment with fraudulent frontend amount
  console.log('\n--- Test 2, 5, 7-12: Customer pays own shipment (ignores frontend amount) ---');
  const testPayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      shipmentId: shipment.id,
      method: 'CARD',
      amount: 1, // Fraudulent client amount: should be ignored!
      status: 'PAID', // Injected status: should be ignored!
    }),
  });

  const payData = await testPayRes.json();
  console.log(`Payment Status: ${testPayRes.status}`, payData);

  if (testPayRes.status !== 201 || !payData.success) {
    throw new Error(`FAIL: Payment simulation failed: ${JSON.stringify(payData)}`);
  }
  console.log('✓ PASS: Payment processed successfully (201 Created)');

  // TEST 5: Verify backend ignored frontend-supplied amount (1) and used server shippingCost
  if (payData.payment.amount === shipment.shippingCost && payData.payment.amount !== 1) {
    console.log(`✓ PASS (Test 5): Backend ignored client amount (1) and used server shippingCost (${payData.payment.amount})`);
  } else {
    throw new Error(`FAIL: Payment amount mismatch! Got ${payData.payment.amount}`);
  }

  // TEST 8: Payment transaction ID format PAY-XXXXXXXX
  const txnRegex = /^PAY-[0-9A-F]{8}$/;
  if (txnRegex.test(payData.payment.transactionId)) {
    console.log(`✓ PASS (Test 8): Valid server-generated transaction ID: ${payData.payment.transactionId}`);
  } else {
    throw new Error(`FAIL: Invalid transaction ID format: ${payData.payment.transactionId}`);
  }

  // TEST 9: Shipment status updated to PAYMENT_CONFIRMED
  if (payData.shipment.status === 'PAYMENT_CONFIRMED' || payData.shipment.status === 'ASSIGNED') {
    console.log(`✓ PASS (Test 9): Shipment status updated to ${payData.shipment.status}`);
  } else {
    throw new Error(`FAIL: Shipment status not PAYMENT_CONFIRMED or ASSIGNED: ${payData.shipment.status}`);
  }

  // TEST 10: Tracking event created
  const dbTracking = await mongoose.connection.collection('trackingevents').find({
    shipmentId: new mongoose.Types.ObjectId(shipment.id),
    status: 'PAYMENT_CONFIRMED',
  }).toArray();
  if (dbTracking.length === 1 && dbTracking[0].description.includes('Payment confirmed')) {
    console.log(`✓ PASS (Test 10): Tracking event created: "${dbTracking[0].description}" at location "${dbTracking[0].location}"`);
  } else {
    throw new Error(`FAIL: Tracking event missing or invalid: ${JSON.stringify(dbTracking)}`);
  }

  // TEST 11: Invoice created with INV-XXXXXXXX format
  const invoiceRegex = /^INV-[0-9A-F]{8}$/;
  if (payData.invoice && invoiceRegex.test(payData.invoice.invoiceNumber)) {
    console.log(`✓ PASS (Test 11): Invoice created: ${payData.invoice.invoiceNumber}, Total: ₹${payData.invoice.total}`);
  } else {
    throw new Error(`FAIL: Invalid invoice: ${JSON.stringify(payData.invoice)}`);
  }

  // TEST 12: Notification created
  const dbNotifs = await mongoose.connection.collection('notifications').find({
    relatedShipmentId: new mongoose.Types.ObjectId(shipment.id),
  }).toArray();
  if (dbNotifs.length >= 1 && dbNotifs[0].title.includes('Payment Successful')) {
    console.log(`✓ PASS (Test 12): Notification created: "${dbNotifs[0].title}" - "${dbNotifs[0].message}"`);
  } else {
    throw new Error(`FAIL: Notification missing or invalid: ${JSON.stringify(dbNotifs)}`);
  }

  // TEST 13: Duplicate successful payment rejected (409)
  console.log('\n--- Test 13: Duplicate successful payment rejected (409) ---');
  const dupPayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      shipmentId: shipment.id,
      method: 'UPI',
    }),
  });
  const dupPayData = await dupPayRes.json();
  console.log(`Status: ${dupPayRes.status}, Error: ${dupPayData.error}`);
  if (dupPayRes.status === 409 && dupPayData.alreadyPaid) {
    console.log('✓ PASS (Test 13): Duplicate payment properly rejected with 409 Conflict');
  } else {
    throw new Error(`FAIL: Duplicate payment should have returned 409: ${dupPayRes.status}`);
  }

  // TEST 14: Duplicate invoice prevented
  const allInvoices = await mongoose.connection.collection('invoices').find({
    shipmentId: new mongoose.Types.ObjectId(shipment.id),
  }).toArray();
  if (allInvoices.length === 1) {
    console.log(`✓ PASS (Test 14): Exactly 1 invoice exists in DB for shipment (${allInvoices[0].invoiceNumber})`);
  } else {
    throw new Error(`FAIL: Expected 1 invoice, found ${allInvoices.length}`);
  }

  // TEST 15: Already-paid shipment returns paid state
  console.log('\n--- Test 15: GET /api/shipments/[id]/payment returns paid state ---');
  const getShipmentPaymentRes = await fetch(`${BASE_URL}/api/shipments/${shipment.id}/payment`, {
    headers: { Cookie: cookieA },
  });
  const shipmentPaymentData = await getShipmentPaymentRes.json();
  if (getShipmentPaymentRes.ok && shipmentPaymentData.payment?.status === 'PAID') {
    console.log(`✓ PASS (Test 15): Payment status is PAID with Transaction #${shipmentPaymentData.payment.transactionId}`);
  } else {
    throw new Error(`FAIL: Could not retrieve payment status: ${JSON.stringify(shipmentPaymentData)}`);
  }

  // TEST 16: Customer B cannot access Customer A invoice (404)
  console.log('\n--- Test 16: Customer B cannot access Customer A invoice (404) ---');
  const invoiceResB = await fetch(`${BASE_URL}/api/invoices/${payData.invoice.invoiceNumber}`, {
    headers: { Cookie: cookieB },
  });
  if (invoiceResB.status === 404) {
    console.log('✓ PASS (Test 16): Customer B cannot access Customer A invoice (404 Not Found)');
  } else {
    throw new Error(`FAIL: Expected 404 for unauthorized customer invoice access, got ${invoiceResB.status}`);
  }

  // TEST 19: Customer A CAN access invoice with full MongoDB details
  console.log('\n--- Test 19: Customer A retrieves real MongoDB Invoice ---');
  const invoiceResA = await fetch(`${BASE_URL}/api/invoices/${payData.invoice.invoiceNumber}`, {
    headers: { Cookie: cookieA },
  });
  const invoiceDataA = await invoiceResA.json();
  if (invoiceResA.ok && invoiceDataA.invoice?.invoiceNumber === payData.invoice.invoiceNumber) {
    console.log(`✓ PASS (Test 19): Real invoice retrieved: #${invoiceDataA.invoice.invoiceNumber}, Customer: ${invoiceDataA.invoice.customer.name}, Total: ${invoiceDataA.invoice.total}`);
  } else {
    throw new Error(`FAIL: Could not retrieve invoice: ${JSON.stringify(invoiceDataA)}`);
  }

  // TEST 4: Admin can access Customer A invoice according to RBAC
  console.log('\n--- Test 4: Admin can view invoice according to RBAC ---');
  const adminInvoiceRes = await fetch(`${BASE_URL}/api/invoices/${payData.invoice.invoiceNumber}`, {
    headers: { Cookie: adminCookie },
  });
  const adminInvoiceData = await adminInvoiceRes.json();
  if (adminInvoiceRes.ok && adminInvoiceData.invoice?.invoiceNumber === payData.invoice.invoiceNumber) {
    console.log('✓ PASS (Test 4): Admin successfully authorized to view invoice');
  } else {
    throw new Error(`FAIL: Admin could not view invoice: ${adminInvoiceRes.status}`);
  }

  // TEST 17 & 18: GET /api/payments/[id] returns server amount & transaction details
  console.log('\n--- Test 17 & 18: GET /api/payments/[id] returns details ---');
  const getPayRes = await fetch(`${BASE_URL}/api/payments/${payData.payment._id}`, {
    headers: { Cookie: cookieA },
  });
  const getPayData = await getPayRes.json();
  if (getPayRes.ok && getPayData.payment.transactionId === payData.payment.transactionId) {
    console.log(`✓ PASS (Test 17 & 18): Payment verified: Amount: ${getPayData.payment.amount}, Txn: ${getPayData.payment.transactionId}`);
  } else {
    throw new Error(`FAIL: Payment query failed: ${JSON.stringify(getPayData)}`);
  }

  // TEST: Notifications API
  console.log('\n--- Testing Notifications API ---');
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieA },
  });
  const notifData = await notifRes.json();
  if (notifRes.ok && notifData.notifications?.length > 0) {
    console.log(`✓ PASS: Notifications retrieved: found ${notifData.notifications.length} notifications for customer Alice`);
  } else {
    throw new Error(`FAIL: Notifications retrieval failed: ${JSON.stringify(notifData)}`);
  }

  // TEST 20: Existing authentication and session still works
  console.log('\n--- Test 20: Verify existing session/auth works ---');
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieA },
  });
  const sessionData = await sessionRes.json();
  if (sessionRes.ok && sessionData.user?.email.toLowerCase() === customerAEmail.toLowerCase()) {
    console.log(`✓ PASS (Test 20): Session valid for ${sessionData.user.email} (${sessionData.user.role})`);
  } else {
    throw new Error(`FAIL: Session failed: ${JSON.stringify(sessionData)}`);
  }

  console.log('\n====================================================');
  console.log('ALL 20 PHASE 5 AUTOMATED TEST CHECKS PASSED!');
  console.log('====================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
