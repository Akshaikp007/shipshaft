import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';

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

const EXPECTED_AGENTS = [
  { name: 'Rahul Kumar', employeeId: 'AGT-KOC-001', branchCode: 'KOC-01', email: 'agent.koc001@shipshaft.test' },
  { name: 'Arun Raj', employeeId: 'AGT-KOC-002', branchCode: 'KOC-01', email: 'agent.koc002@shipshaft.test' },
  { name: 'Nikhil Das', employeeId: 'AGT-CCJ-001', branchCode: 'CCJ-01', email: 'agent.ccj001@shipshaft.test' },
  { name: 'Vishnu Prasad', employeeId: 'AGT-CCJ-002', branchCode: 'CCJ-01', email: 'agent.ccj002@shipshaft.test' },
  { name: 'Priya Sharma', employeeId: 'AGT-BLR-001', branchCode: 'BLR-01', email: 'agent.blr001@shipshaft.test' },
  { name: 'Aditya Rao', employeeId: 'AGT-BLR-002', branchCode: 'BLR-01', email: 'agent.blr002@shipshaft.test' },
  { name: 'Karthik S', employeeId: 'AGT-MAA-001', branchCode: 'MAA-01', email: 'agent.maa001@shipshaft.test' },
  { name: 'Naveen Kumar', employeeId: 'AGT-MAA-002', branchCode: 'MAA-01', email: 'agent.maa002@shipshaft.test' },
  { name: 'Arjun Reddy', employeeId: 'AGT-HYD-001', branchCode: 'HYD-01', email: 'agent.hyd001@shipshaft.test' },
  { name: 'Sai Krishna', employeeId: 'AGT-HYD-002', branchCode: 'HYD-01', email: 'agent.hyd002@shipshaft.test' },
  { name: 'Rohan Mehta', employeeId: 'AGT-BOM-001', branchCode: 'BOM-01', email: 'agent.bom001@shipshaft.test' },
  { name: 'Amit Patil', employeeId: 'AGT-BOM-002', branchCode: 'BOM-01', email: 'agent.bom002@shipshaft.test' },
];

async function verifyAll() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const UserCol = db.collection('users');
  const AgentCol = db.collection('agents');
  const BranchCol = db.collection('branches');

  console.log('==================================================');
  console.log('VERIFYING ALL 12 SEEDED AGENTS');
  console.log('==================================================');

  let allPassed = true;
  const results = [];

  for (const exp of EXPECTED_AGENTS) {
    // 1. Find Agent
    const agent = await AgentCol.findOne({ employeeId: exp.employeeId });
    if (!agent) {
      console.error(`FAIL: Agent record not found for ${exp.name} (${exp.employeeId})`);
      allPassed = false;
      results.push({ ...exp, status: 'FAIL: Agent record not found' });
      continue;
    }

    // 2. Find Linked Branch
    const branch = await BranchCol.findOne({ _id: agent.branchId });
    if (!branch || branch.code !== exp.branchCode) {
      console.error(`FAIL: Branch mismatch for ${exp.name} (${exp.employeeId}). Expected ${exp.branchCode}, found ${branch?.code}`);
      allPassed = false;
      results.push({ ...exp, status: 'FAIL: Branch mismatch' });
      continue;
    }

    // 3. Find Linked User
    const user = await UserCol.findOne({ _id: agent.userId });
    if (!user) {
      console.error(`FAIL: User record not found for agent ${exp.name} (${exp.employeeId}), userId: ${agent.userId}`);
      allPassed = false;
      results.push({ ...exp, status: 'FAIL: User record not found' });
      continue;
    }

    // Check user attributes
    const roleOk = user.role === 'AGENT';
    const activeOk = user.isActive === true;
    const emailOk = user.email.toLowerCase() === exp.email.toLowerCase();
    const hasHash = Boolean(user.passwordHash);
    const pwdOk = hasHash ? await bcrypt.compare('ShipShaft@2026!', user.passwordHash) : false;

    // Check duplicates
    const userDupes = await UserCol.countDocuments({ email: exp.email.toLowerCase() });
    const agentDupes = await AgentCol.countDocuments({ employeeId: exp.employeeId });

    if (!roleOk || !activeOk || !emailOk || !pwdOk || userDupes !== 1 || agentDupes !== 1) {
      console.error(`FAIL: Checks failed for ${exp.name}: roleOk=${roleOk}, activeOk=${activeOk}, emailOk=${emailOk}, pwdOk=${pwdOk}, userDupes=${userDupes}, agentDupes=${agentDupes}`);
      allPassed = false;
      results.push({
        ...exp,
        status: `FAIL (roleOk=${roleOk}, activeOk=${activeOk}, emailOk=${emailOk}, pwdOk=${pwdOk}, userDupes=${userDupes}, agentDupes=${agentDupes})`,
      });
    } else {
      results.push({
        name: exp.name,
        employeeId: exp.employeeId,
        branch: `${branch.code} (${branch.name})`,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        agentId: agent._id.toString(),
        userId: user._id.toString(),
        status: 'VERIFIED',
      });
    }
  }

  console.table(results);
  console.log(`All 12 agents verified: ${allPassed ? 'YES' : 'NO'}`);

  await mongoose.disconnect();
}

verifyAll().catch(console.error);
