import mongoose from 'mongoose';

async function checkLegacy() {
  await mongoose.connect('mongodb://localhost:27017/shipshaft');
  const db = mongoose.connection.db;
  const legacyIds = [
    new mongoose.Types.ObjectId('6abf32bbb7a00f62221c9c7b'),
    new mongoose.Types.ObjectId('6abf4dea33b7b200b748e432'),
    new mongoose.Types.ObjectId('6abf4dea33b7b200b748e434'),
    new mongoose.Types.ObjectId('6abfd00110aeab5c05f5c55b'),
    new mongoose.Types.ObjectId('6abfd00110aeab5c05f5c55d'),
  ];
  for (const col of ['shipments', 'trackingevents', 'payments', 'notifications', 'agentlocations', 'agents']) {
    const c1 = await db.collection(col).countDocuments({ agentId: { $in: legacyIds } });
    const c2 = await db.collection(col).countDocuments({ userId: { $in: legacyIds } });
    const c3 = await db.collection(col).countDocuments({ customerId: { $in: legacyIds } });
    console.log(col, 'agentId:', c1, 'userId:', c2, 'customerId:', c3);
  }
  await mongoose.disconnect();
}

checkLegacy().catch(console.error);
