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

  console.log('=== USERS WITH PRIYA OR BLR ===');
  const users = await db.collection('users').find({
    $or: [
      { email: { $regex: /blr/i } },
      { name: { $regex: /priya/i } }
    ]
  }, { projection: { passwordHash: 0 } }).toArray();
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== AGENTS WITH PRIYA OR BLR ===');
  const agents = await db.collection('agents').find({
    $or: [
      { employeeId: { $regex: /blr/i } },
      { employeeId: 'AGT-002' }
    ]
  }).toArray();
  console.log(JSON.stringify(agents, null, 2));

  console.log('\n=== SHIPMENT SHP-0F7A96A3 ===');
  const shipment = await db.collection('shipments').findOne({
    trackingNumber: 'SHP-0F7A96A3'
  });
  console.log(JSON.stringify(shipment, null, 2));

  console.log('\n=== ALL AGENTS IN DATABASE ===');
  const allAgents = await db.collection('agents').find({}).toArray();
  console.log(allAgents.map(a => ({ id: a._id.toString(), employeeId: a.employeeId, userId: a.userId?.toString(), branchId: a.branchId?.toString() })));

  console.log('\n=== ALL BRANCHES IN DATABASE ===');
  const allBranches = await db.collection('branches').find({}).toArray();
  console.log(allBranches.map(b => ({ id: b._id.toString(), code: b.code, name: b.name })));

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
