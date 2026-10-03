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

async function cleanupAgents() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const UserCol = db.collection('users');
  const AgentCol = db.collection('agents');
  const ShipmentCol = db.collection('shipments');
  const BranchCol = db.collection('branches');
  const AgentLocCol = db.collection('agentlocations');

  console.log('\n=== STEP 1: VERIFY PRIYA SHARMA BEFORE CLEANUP ===');
  const priyaAgent = await AgentCol.findOne({ employeeId: 'AGT-BLR-001' });
  if (!priyaAgent) {
    throw new Error('FATAL: Priya Sharma agent record AGT-BLR-001 not found!');
  }
  console.log('Priya Agent found:', priyaAgent._id.toString(), priyaAgent.employeeId);

  const priyaUser = await UserCol.findOne({ _id: priyaAgent.userId });
  if (!priyaUser) {
    throw new Error('FATAL: Priya Sharma user record not found for userId ' + priyaAgent.userId);
  }
  console.log('Priya User found:', priyaUser._id.toString(), priyaUser.email, 'Role:', priyaUser.role, 'Active:', priyaUser.isActive);

  if (priyaUser.role !== 'AGENT' || !priyaUser.isActive) {
    throw new Error('FATAL: Priya user is not an active AGENT!');
  }

  const blrBranch = await BranchCol.findOne({ _id: priyaAgent.branchId });
  if (!blrBranch || blrBranch.code !== 'BLR-01') {
    throw new Error('FATAL: Priya branch is not BLR-01! Found: ' + blrBranch?.code);
  }
  console.log('Priya Branch verified: BLR-01 -', blrBranch.name);

  // Check password
  const pwdValid = await bcrypt.compare('ShipShaft@2026!', priyaUser.passwordHash);
  if (!pwdValid) {
    console.log('Resetting Priya password to ShipShaft@2026! ...');
    const newHash = await bcrypt.hash('ShipShaft@2026!', 10);
    await UserCol.updateOne({ _id: priyaUser._id }, { $set: { passwordHash: newHash } });
    console.log('Password reset successfully.');
  } else {
    console.log('Priya password verified successfully.');
  }

  console.log('\n=== STEP 2: CHECK SHIPMENTS FOR OTHER AGENTS ===');
  const otherAgents = await AgentCol.find({ _id: { $ne: priyaAgent._id } }).toArray();
  const otherAgentIds = otherAgents.map(a => a._id);
  console.log(`Found ${otherAgents.length} other agents to remove.`);

  const shipmentsWithOtherAgents = await ShipmentCol.find({ agentId: { $in: otherAgentIds } }).toArray();
  if (shipmentsWithOtherAgents.length > 0) {
    console.warn(`WARNING: ${shipmentsWithOtherAgents.length} shipments are assigned to agents being removed!`);
    for (const s of shipmentsWithOtherAgents) {
      console.warn(` - Shipment: ${s.trackingNumber}, AgentId: ${s.agentId}`);
    }
    throw new Error('Cannot delete agents with active shipment assignments without reassignment!');
  } else {
    console.log('Safety check passed: 0 shipments assigned to other agents.');
  }

  console.log('\n=== STEP 3: CHECK AGENT LOCATIONS FOR OTHER AGENTS ===');
  const otherAgentLocs = await AgentLocCol.countDocuments({ agentId: { $in: otherAgentIds } });
  if (otherAgentLocs > 0) {
    console.log(`Removing ${otherAgentLocs} agent location records for removed agents...`);
    await AgentLocCol.deleteMany({ agentId: { $in: otherAgentIds } });
  } else {
    console.log('Safety check passed: 0 agent location records for other agents.');
  }

  console.log('\n=== STEP 4: DELETE OTHER AGENTS ===');
  const agentDeleteResult = await AgentCol.deleteMany({ _id: { $ne: priyaAgent._id } });
  console.log(`Deleted ${agentDeleteResult.deletedCount} agent records. Remaining agents: ${await AgentCol.countDocuments()}`);

  console.log('\n=== STEP 5: DELETE OTHER AGENT USER ACCOUNTS ===');
  // Specifically target non-Priya users with role AGENT
  // We preserve all customers and admins
  const agentUsersToDelete = await UserCol.find({
    role: 'AGENT',
    _id: { $ne: priyaUser._id },
  }).toArray();

  console.log(`Found ${agentUsersToDelete.length} non-Priya AGENT user accounts to delete:`);
  agentUsersToDelete.forEach(u => console.log(` - ID: ${u._id}, Email: ${u.email}, Name: ${u.name}`));

  const userDeleteResult = await UserCol.deleteMany({
    role: 'AGENT',
    _id: { $ne: priyaUser._id },
  });
  console.log(`Deleted ${userDeleteResult.deletedCount} AGENT user documents.`);

  console.log('\n=== STEP 6: VERIFY FINAL DATABASE STATE ===');
  const finalAgentCount = await AgentCol.countDocuments();
  const finalAgentUserCount = await UserCol.countDocuments({ role: 'AGENT' });
  const finalAdminUserCount = await UserCol.countDocuments({ role: 'ADMIN' });
  const finalCustomerUserCount = await UserCol.countDocuments({ role: 'CUSTOMER' });
  const finalBranchCount = await BranchCol.countDocuments();
  const finalShipmentCount = await ShipmentCol.countDocuments();

  console.log(`Agent count: ${finalAgentCount} (Expected: 1)`);
  console.log(`AGENT user count: ${finalAgentUserCount} (Expected: 1)`);
  console.log(`ADMIN user count: ${finalAdminUserCount} (Preserved)`);
  console.log(`CUSTOMER user count: ${finalCustomerUserCount} (Preserved)`);
  console.log(`Branch count: ${finalBranchCount} (Preserved)`);
  console.log(`Shipment count: ${finalShipmentCount} (Preserved)`);

  const singleAgent = await AgentCol.findOne();
  const singleAgentUser = await UserCol.findOne({ role: 'AGENT' });
  const singleBranch = await BranchCol.findOne({ _id: singleAgent.branchId });

  console.log('\n--- FINAL SINGLE AGENT DETAILS ---');
  console.log('AGENTS:');
  console.log(`1. ${singleAgentUser.name}`);
  console.log(`   Employee ID: ${singleAgent.employeeId}`);
  console.log(`   Branch: ${singleBranch.code}`);
  console.log(`   User ID: ${singleAgentUser._id.toString()}`);
  console.log(`   Agent ID: ${singleAgent._id.toString()}`);
  console.log(`   Availability: ${singleAgent.availability}`);

  await mongoose.disconnect();
}

cleanupAgents().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
