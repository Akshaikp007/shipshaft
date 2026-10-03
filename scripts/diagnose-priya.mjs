import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipshaft';

async function diagnose() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const UserCol = db.collection('users');
  const AgentCol = db.collection('agents');
  const BranchCol = db.collection('branches');
  const ShipmentCol = db.collection('shipments');

  console.log('=== 1. INSPECT PRIYA AGENT RECORD ===');
  const priyaAgent = await AgentCol.findOne({ employeeId: 'AGT-BLR-001' });
  console.log('Agent document:', JSON.stringify(priyaAgent, null, 2));

  if (!priyaAgent) {
    console.error('ERROR: Agent AGT-BLR-001 not found!');
    process.exit(1);
  }

  const blrBranch = await BranchCol.findOne({ _id: priyaAgent.branchId });
  console.log('Linked Branch:', blrBranch?.code, blrBranch?.name);

  console.log('\n=== 2. INSPECT LINKED USER ===');
  const linkedUser = await UserCol.findOne({ _id: priyaAgent.userId });
  console.log('Linked User (excluding hash):', {
    _id: linkedUser?._id,
    name: linkedUser?.name,
    email: linkedUser?.email,
    role: linkedUser?.role,
    isActive: linkedUser?.isActive,
    hasPasswordHash: Boolean(linkedUser?.passwordHash),
  });

  // Verify password with bcrypt
  const matchesTargetPassword = await bcrypt.compare('ShipShaft@2026!', linkedUser.passwordHash);
  console.log('Password matches ShipShaft@2026!:', matchesTargetPassword);

  // If not matching, reset it
  if (!matchesTargetPassword) {
    console.log('Resetting password to ShipShaft@2026!...');
    const newHash = await bcrypt.hash('ShipShaft@2026!', 10);
    await UserCol.updateOne({ _id: linkedUser._id }, { $set: { passwordHash: newHash } });
    console.log('Password reset successfully.');
  }

  // Also ensure email is strictly normalized
  if (linkedUser.email !== 'agent.blr001@shipshaft.test') {
    console.log(`Normalizing email from ${linkedUser.email} to agent.blr001@shipshaft.test...`);
    await UserCol.updateOne({ _id: linkedUser._id }, { $set: { email: 'agent.blr001@shipshaft.test' } });
  }

  console.log('\n=== 3. CHECK DUPLICATES ===');
  const duplicateUsers = await UserCol.find({ email: 'agent.blr001@shipshaft.test' }).toArray();
  console.log(`Users with email 'agent.blr001@shipshaft.test': ${duplicateUsers.length}`);

  const duplicateAgents = await AgentCol.find({ employeeId: 'AGT-BLR-001' }).toArray();
  console.log(`Agents with employeeId 'AGT-BLR-001': ${duplicateAgents.length}`);

  const usersNamedPriya = await UserCol.find({ name: 'Priya Sharma' }, { projection: { passwordHash: 0 } }).toArray();
  console.log(`Total users named 'Priya Sharma': ${usersNamedPriya.length}`);
  usersNamedPriya.forEach((u) => {
    console.log(` - ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, isActive: ${u.isActive}`);
  });

  console.log('\n=== 4. INSPECT SHIPMENT SHP-0F7A96A3 ===');
  const shipment = await ShipmentCol.findOne({ trackingNumber: 'SHP-0F7A96A3' });
  if (shipment) {
    console.log('Shipment trackingNumber:', shipment.trackingNumber);
    console.log('Shipment status:', shipment.status);
    console.log('Shipment agentId:', shipment.agentId?.toString());
    console.log('Matches Priya Agent ID?', shipment.agentId?.toString() === priyaAgent._id.toString());
  } else {
    console.log('Shipment SHP-0F7A96A3 not found in database.');
  }

  await mongoose.disconnect();
}

diagnose().catch(console.error);
