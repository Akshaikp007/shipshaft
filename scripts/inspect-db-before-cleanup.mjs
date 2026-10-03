import mongoose from 'mongoose';
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

async function inspect() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log('Database Name:', db.databaseName);

  const collections = ['users', 'agents', 'shipments', 'trackingevents', 'payments', 'notifications', 'agentlocations', 'branches'];

  for (const col of collections) {
    const count = await db.collection(col).countDocuments();
    console.log(`Collection [${col}]: ${count} documents`);
  }

  const roleCounts = await db.collection('users').aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\n--- USER ROLE COUNTS ---');
  console.log(roleCounts);

  console.log('\n--- USERS WITH ROLE AGENT ---');
  const agentUsers = await db.collection('users').find({ role: 'AGENT' }, { projection: { passwordHash: 0 } }).toArray();
  console.log(`Found ${agentUsers.length} users with role AGENT:`);
  agentUsers.forEach(u => console.log(` - ID: ${u._id}, Email: ${u.email}, Name: ${u.name}, isActive: ${u.isActive}`));

  console.log('\n--- ALL AGENTS ---');
  const agents = await db.collection('agents').find().toArray();
  console.log(`Found ${agents.length} agents:`);
  for (const a of agents) {
    console.log(` - ID: ${a._id}, EmpID: ${a.employeeId}, BranchId: ${a.branchId}, UserId: ${a.userId}, Available: ${a.isAvailable}/${a.availability}`);
  }

  console.log('\n--- SHIPMENTS ---');
  const shipments = await db.collection('shipments').find().toArray();
  console.log(`Found ${shipments.length} shipments:`);
  for (const s of shipments) {
    console.log(` - ID: ${s._id}, Tracking: ${s.trackingNumber}, Status: ${s.status}, AgentId: ${s.agentId}`);
  }

  console.log('\n--- AGENT LOCATIONS ---');
  const locations = await db.collection('agentlocations').find().toArray();
  console.log(`Found ${locations.length} agent locations:`);
  for (const l of locations) {
    console.log(` - ID: ${l._id}, AgentId: ${l.agentId}, ShipmentId: ${l.shipmentId}`);
  }

  console.log('\n--- BRANCHES ---');
  const branches = await db.collection('branches').find().toArray();
  console.log(`Found ${branches.length} branches:`);
  for (const b of branches) {
    console.log(` - ID: ${b._id}, Code: ${b.code}, Name: ${b.name}, City: ${b.city}`);
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
