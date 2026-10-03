import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from './password';
import { ROLES } from '@/lib/constants/roles';

/**
 * Seed initial test accounts for Admin, Agent, and Customer roles.
 * Runs idempotently (only creates accounts if they don't already exist).
 * Does NOT auto-create demo branches or demo agents.
 */
export async function seedInitialAuthUsers() {
  await connectDB();

  const defaultUsers = [
    {
      name: 'Marcus Vance',
      email: 'admin@shipshaft.com',
      phone: '+1 (555) 889-0123',
      role: ROLES.ADMIN,
      password: 'Admin@123456',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rahul Kumar',
      email: 'agent@shipshaft.com',
      phone: '+91 98460 77123',
      role: ROLES.AGENT,
      password: 'Agent@123456',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Sharma',
      email: 'agent.blr@shipshaft.com',
      phone: '+91 98460 88234',
      role: ROLES.AGENT,
      password: 'Agent@123456',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Jenkins',
      email: 'customer@shipshaft.com',
      phone: '+1 (555) 123-4567',
      role: ROLES.CUSTOMER,
      password: 'Customer@123456',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const item of defaultUsers) {
    const user = await User.findOne({ email: item.email.toLowerCase() });
    if (!user) {
      const passwordHash = await hashPassword(item.password);
      await User.create({
        name: item.name,
        email: item.email.toLowerCase(),
        phone: item.phone,
        passwordHash,
        role: item.role,
        avatar: item.avatar,
        isActive: true,
      });
    }
  }
}
