import { connectDB } from '@/lib/db';
import Branch from '@/lib/models/Branch';

/**
 * Retrieve all active branches directly from MongoDB.
 * Never falls back to mock branches or auto-seeds demo data.
 * @returns {Promise<Array>}
 */
export async function getAllBranches() {
  await connectDB();
  return Branch.find({ isActive: true }).sort({ code: 1 }).lean();
}

/**
 * Find branch by MongoDB ObjectId or Branch Code.
 * @param {string} idOrCode MongoDB ObjectId string or Branch Code (e.g. 'KOC-01')
 * @returns {Promise<object|null>}
 */
export async function findBranch(idOrCode) {
  if (!idOrCode) return null;
  await connectDB();

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
  if (isObjectId) {
    const branch = await Branch.findById(idOrCode).lean();
    if (branch) return branch;
  }

  return Branch.findOne({ code: String(idOrCode).trim().toUpperCase() }).lean();
}
