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
const AGENT_PASSWORD = 'ShipShaft@2026!';
const SALT_ROUNDS = 10;

// Hub Definitions (6 Operational Hubs)
const HUBS_DATA = [
  {
    name: 'Kochi Central Hub',
    code: 'KOC-01',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    address: 'Harbor Road, Willingdon Island, Kochi',
    phone: '+91 484 2668001',
    isActive: true,
  },
  {
    name: 'Calicut Hub',
    code: 'CCJ-01',
    city: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    address: 'Mini Bypass Road, Govindapuram, Kozhikode',
    phone: '+91 495 2741001',
    isActive: true,
  },
  {
    name: 'Bengaluru Hub',
    code: 'BLR-01',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    address: 'Outer Ring Road, Bellandur, Bengaluru',
    phone: '+91 80 41235001',
    isActive: true,
  },
  {
    name: 'Chennai Hub',
    code: 'MAA-01',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    address: 'GST Road, Guindy Industrial Estate, Chennai',
    phone: '+91 44 22501001',
    isActive: true,
  },
  {
    name: 'Hyderabad Hub',
    code: 'HYD-01',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    address: 'HITEC City Main Road, Madhapur, Hyderabad',
    phone: '+91 40 23114001',
    isActive: true,
  },
  {
    name: 'Mumbai Hub',
    code: 'BOM-01',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'Andheri-Kurla Road, Sakinaka, Mumbai',
    phone: '+91 22 28502001',
    isActive: true,
  },
];

// Delivery Agent Definitions (12 Agents, 2 per hub)
const AGENTS_DATA = [
  // KOCHI
  {
    branchCode: 'KOC-01',
    employeeId: 'AGT-KOC-001',
    name: 'Rahul Kumar',
    email: 'agent.koc001@shipshaft.test',
    phone: '+91 98470 10001',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'KL-07-AK-1001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'KOC-01',
    employeeId: 'AGT-KOC-002',
    name: 'Arun Raj',
    email: 'agent.koc002@shipshaft.test',
    phone: '+91 98470 10002',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'KL-07-AK-1002',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  // CALICUT
  {
    branchCode: 'CCJ-01',
    employeeId: 'AGT-CCJ-001',
    name: 'Nikhil Das',
    email: 'agent.ccj001@shipshaft.test',
    phone: '+91 98470 20001',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'KL-11-CD-2001',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'CCJ-01',
    employeeId: 'AGT-CCJ-002',
    name: 'Vishnu Prasad',
    email: 'agent.ccj002@shipshaft.test',
    phone: '+91 98470 20002',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'KL-11-CD-2002',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  },
  // BENGALURU
  {
    branchCode: 'BLR-01',
    employeeId: 'AGT-BLR-001',
    name: 'Priya Sharma',
    email: 'agent.blr001@shipshaft.test',
    phone: '+91 98470 30001',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'KA-01-EF-3001',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'BLR-01',
    employeeId: 'AGT-BLR-002',
    name: 'Aditya Rao',
    email: 'agent.blr002@shipshaft.test',
    phone: '+91 98470 30002',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'KA-01-EF-3002',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  // CHENNAI
  {
    branchCode: 'MAA-01',
    employeeId: 'AGT-MAA-001',
    name: 'Karthik S',
    email: 'agent.maa001@shipshaft.test',
    phone: '+91 98470 40001',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'TN-09-GH-4001',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'MAA-01',
    employeeId: 'AGT-MAA-002',
    name: 'Naveen Kumar',
    email: 'agent.maa002@shipshaft.test',
    phone: '+91 98470 40002',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'TN-09-GH-4002',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
  // HYDERABAD
  {
    branchCode: 'HYD-01',
    employeeId: 'AGT-HYD-001',
    name: 'Arjun Reddy',
    email: 'agent.hyd001@shipshaft.test',
    phone: '+91 98470 50001',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'TS-09-IJ-5001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'HYD-01',
    employeeId: 'AGT-HYD-002',
    name: 'Sai Krishna',
    email: 'agent.hyd002@shipshaft.test',
    phone: '+91 98470 50002',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'TS-09-IJ-5002',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  // MUMBAI
  {
    branchCode: 'BOM-01',
    employeeId: 'AGT-BOM-001',
    name: 'Rohan Mehta',
    email: 'agent.bom001@shipshaft.test',
    phone: '+91 98470 60001',
    vehicleType: 'Delivery Van',
    vehicleNumber: 'MH-02-KL-6001',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    branchCode: 'BOM-01',
    employeeId: 'AGT-BOM-002',
    name: 'Amit Patil',
    email: 'agent.bom002@shipshaft.test',
    phone: '+91 98470 60002',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'MH-02-KL-6002',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log(`Connected. Database name: ${dbName}`);

  if (dbName !== 'shipshaft') {
    throw new Error(`ABORT: Expected database 'shipshaft' but connected to '${dbName}'!`);
  }

  const BranchCol = db.collection('branches');
  const UserCol = db.collection('users');
  const AgentCol = db.collection('agents');

  // Pre-compute bcrypt password hash
  const passwordHash = await bcrypt.hash(AGENT_PASSWORD, SALT_ROUNDS);

  let branchesCreated = 0;
  let branchesReused = 0;
  const branchMap = new Map(); // code -> Branch document

  // 1. Seed / Upsert Hubs
  console.log('\n--- Seeding 6 Operational Hubs ---');
  for (const hub of HUBS_DATA) {
    const existing = await BranchCol.findOne({ code: hub.code });
    if (existing) {
      // Reuse and update to ensure standard schema fields
      await BranchCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: hub.name,
            city: hub.city,
            state: hub.state,
            country: hub.country,
            address: hub.address,
            phone: hub.phone,
            isActive: hub.isActive,
            updatedAt: new Date(),
          },
        }
      );
      branchMap.set(hub.code, { ...existing, ...hub });
      branchesReused++;
      console.log(`[REUSED] Branch: ${hub.code} — ${hub.name}`);
    } else {
      const now = new Date();
      const insertRes = await BranchCol.insertOne({
        ...hub,
        createdAt: now,
        updatedAt: now,
      });
      branchMap.set(hub.code, { _id: insertRes.insertedId, ...hub });
      branchesCreated++;
      console.log(`[CREATED] Branch: ${hub.code} — ${hub.name}`);
    }
  }

  let usersCreated = 0;
  let usersReused = 0;
  let agentsCreated = 0;
  let agentsReused = 0;

  // 2. Seed / Upsert Agent Users & Agent Profiles
  console.log('\n--- Seeding 12 Delivery Agents ---');
  for (const ag of AGENTS_DATA) {
    const branch = branchMap.get(ag.branchCode);
    if (!branch) {
      throw new Error(`Branch ${ag.branchCode} not found for agent ${ag.employeeId}!`);
    }

    // A. User Record (by lowercase email)
    const normalizedEmail = ag.email.toLowerCase().trim();
    let user = await UserCol.findOne({ email: normalizedEmail });

    if (user) {
      await UserCol.updateOne(
        { _id: user._id },
        {
          $set: {
            name: ag.name,
            phone: ag.phone,
            passwordHash,
            role: 'AGENT',
            avatar: ag.avatar,
            isActive: true,
            updatedAt: new Date(),
          },
        }
      );
      usersReused++;
      console.log(`[REUSED] User: ${normalizedEmail} (${ag.name})`);
    } else {
      const now = new Date();
      const userInsert = await UserCol.insertOne({
        name: ag.name,
        email: normalizedEmail,
        phone: ag.phone,
        passwordHash,
        role: 'AGENT',
        avatar: ag.avatar,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      user = { _id: userInsert.insertedId, email: normalizedEmail, name: ag.name };
      usersCreated++;
      console.log(`[CREATED] User: ${normalizedEmail} (${ag.name})`);
    }

    // B. Agent Profile Record (by employeeId or userId)
    let agentProfile = await AgentCol.findOne({
      $or: [{ employeeId: ag.employeeId }, { userId: user._id }],
    });

    if (agentProfile) {
      await AgentCol.updateOne(
        { _id: agentProfile._id },
        {
          $set: {
            userId: user._id,
            employeeId: ag.employeeId,
            branchId: branch._id,
            vehicleType: ag.vehicleType,
            vehicleNumber: ag.vehicleNumber,
            isAvailable: true,
            availability: 'AVAILABLE',
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        }
      );
      agentsReused++;
      console.log(`[REUSED] Agent: ${ag.employeeId} → ${ag.branchCode} (${ag.name})`);
    } else {
      const now = new Date();
      await AgentCol.insertOne({
        userId: user._id,
        employeeId: ag.employeeId,
        branchId: branch._id,
        vehicleType: ag.vehicleType,
        vehicleNumber: ag.vehicleNumber,
        isAvailable: true,
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });
      agentsCreated++;
      console.log(`[CREATED] Agent: ${ag.employeeId} → ${ag.branchCode} (${ag.name})`);
    }
  }

  // 3. Relationships & Data Integrity Verifications
  console.log('\n--- Verifying Database Integrity & Relationships ---');
  const allBranches = await BranchCol.find({}).toArray();
  const allAgents = await AgentCol.find({}).toArray();

  if (allBranches.length !== 6) {
    throw new Error(`Integrity check failed: Expected 6 branches, found ${allBranches.length}`);
  }
  if (allAgents.length !== 12) {
    throw new Error(`Integrity check failed: Expected 12 agents, found ${allAgents.length}`);
  }

  // Check unique constraints
  const branchCodes = allBranches.map((b) => b.code);
  const uniqueBranchCodes = new Set(branchCodes);
  if (branchCodes.length !== uniqueBranchCodes.size) {
    throw new Error('Duplicate branch codes detected!');
  }

  const agentEmpIds = allAgents.map((a) => a.employeeId);
  const uniqueAgentEmpIds = new Set(agentEmpIds);
  if (agentEmpIds.length !== uniqueAgentEmpIds.size) {
    throw new Error('Duplicate agent employee IDs detected!');
  }

  for (const agent of allAgents) {
    const userDoc = await UserCol.findOne({ _id: agent.userId });
    if (!userDoc) {
      throw new Error(`Agent ${agent.employeeId} has invalid or missing userId!`);
    }
    if (userDoc.role !== 'AGENT' || !userDoc.isActive) {
      throw new Error(`Agent ${agent.employeeId} user account is not active AGENT!`);
    }

    const branchDoc = await BranchCol.findOne({ _id: agent.branchId });
    if (!branchDoc || !branchDoc.isActive) {
      throw new Error(`Agent ${agent.employeeId} has invalid or inactive branchId!`);
    }

    if (!agent.isAvailable || agent.availability !== 'AVAILABLE' || agent.status !== 'ACTIVE') {
      throw new Error(`Agent ${agent.employeeId} is not in AVAILABLE/ACTIVE state!`);
    }
  }

  console.log('✓ All 6 branches verified active with unique codes.');
  console.log('✓ All 12 agents verified with valid user references, active AGENT roles, and correct branch links.');

  // 4. Output Summary
  console.log('\n====================================================');
  console.log('HUBS\n');
  for (const hub of HUBS_DATA) {
    console.log(`${hub.code} — ${hub.name}`);
  }

  console.log('\nAGENTS\n');
  const groupedAgents = {
    KOC: [],
    CCJ: [],
    BLR: [],
    MAA: [],
    HYD: [],
    BOM: [],
  };

  for (const ag of AGENTS_DATA) {
    const hubKey = ag.branchCode.split('-')[0];
    groupedAgents[hubKey].push(`${ag.employeeId} — ${ag.name}`);
  }

  for (const [hubKey, list] of Object.entries(groupedAgents)) {
    console.log(`${hubKey}:`);
    for (const item of list) {
      console.log(item);
    }
    console.log('');
  }

  console.log(`Branches created/reused: ${allBranches.length}`);
  console.log(`Agents created/reused: ${allAgents.length}`);
  console.log(`Users created/reused: ${AGENTS_DATA.length}`);

  console.log('\nTEST CREDENTIALS\n');
  console.log(`Development agent password:\n${AGENT_PASSWORD}\n`);
  console.log('Agent Emails:');
  for (const ag of AGENTS_DATA) {
    console.log(`${ag.employeeId}: ${ag.email}`);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}

seed().catch((err) => {
  console.error('\n❌ SEEDING ERROR:', err);
  process.exit(1);
});
