import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'shipshaft-delivery-otp-salt-key';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
}

async function setup() {
  await mongoose.connect(MONGO_URI);
  const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shipment = mongoose.model('Shipment', new mongoose.Schema({}, { strict: false }));
  const AgentLocation = mongoose.model('AgentLocation', new mongoose.Schema({}, { strict: false }));

  const customer = await User.findOne({ email: 'customer@shipshaft.com' });
  const agentBLR = await Agent.findOne({ employeeId: 'AGT-002' });
  const blrBranch = await Branch.findOne({ code: 'BLR-01' });

  const trackingNumber = 'SHP-E2EG9999';
  await Shipment.deleteMany({ trackingNumber });
  await AgentLocation.deleteMany({ shipmentId: { $exists: true } });

  const rawOtp = '729104';
  const hashedOtp = hashOtp(rawOtp);

  const shipment = await Shipment.create({
    trackingNumber,
    customerId: customer._id,
    agentId: agentBLR._id,
    originBranchId: blrBranch._id,
    destinationBranchId: blrBranch._id,
    senderName: 'Electronics Express',
    senderPhone: '+91 98470 12345',
    senderAddress: 'Tech Corridor Hub, Bengaluru',
    receiverName: 'Sarah Jenkins',
    receiverPhone: '+91 98765 43210',
    receiverAddress: '42 Orchid Residency, Electronic City, Bengaluru',
    packageDescription: 'Precision Electronic Equipment',
    weight: 3.2,
    serviceType: 'Express Priority',
    shippingCost: 450,
    status: 'OUT_FOR_DELIVERY',
    otpHash: hashedOtp,
    otpExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour for test
    otpAttempts: 0,
    otpLastSentAt: new Date(),
    qrToken: `SHPQR-${trackingNumber}`,
  });

  // Seed an initial live location near Bangalore Electronic City
  const initialLoc = await AgentLocation.create({
    shipmentId: shipment._id,
    agentId: agentBLR._id,
    latitude: 12.8399,
    longitude: 77.6770,
    accuracy: 15,
    recordedAt: new Date(),
  });

  // Also write OTP to test outbox so it mimics real email delivery
  const outboxDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(outboxDir)) fs.mkdirSync(outboxDir, { recursive: true });
  fs.writeFileSync(
    path.join(outboxDir, 'test-mail-outbox.json'),
    JSON.stringify({
      to: customer.email,
      trackingNumber,
      otp: rawOtp,
      expiresInMinutes: 10,
      timestamp: new Date().toISOString(),
    }, null, 2)
  );

  console.log(`✓ E2E Shipment created: ${trackingNumber} (OTP: ${rawOtp})`);
  console.log(`✓ Initial AgentLocation seeded at [${initialLoc.latitude}, ${initialLoc.longitude}]`);
  await mongoose.disconnect();
}

setup().catch(console.error);
