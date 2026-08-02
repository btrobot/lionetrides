import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN = {
  email: 'admin@ridex.com',
  password: 'Admin123!',
  name: 'System Admin',
  role: 'super_admin' as const,
  company: 'RideX Manufacturing',
  phone: '+86-400-888-0000',
};

async function seed() {
  console.log('🔍 Checking if admin account exists...');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, DEFAULT_ADMIN.email))
    .limit(1);

  if (existing.length > 0) {
    console.log('✅ Admin account already exists, skipping.');
    console.log('   Email:', DEFAULT_ADMIN.email);
    return;
  }

  console.log('📝 Creating admin account...');

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

  await db.insert(users).values({
    email: DEFAULT_ADMIN.email,
    password_hash: passwordHash,
    name: DEFAULT_ADMIN.name,
    role: DEFAULT_ADMIN.role,
    company: DEFAULT_ADMIN.company,
    phone: DEFAULT_ADMIN.phone,
    login_attempts: 0,
  });

  console.log('✅ Admin account created successfully!');
  console.log('   Email:    ', DEFAULT_ADMIN.email);
  console.log('   Password: ', DEFAULT_ADMIN.password);
  console.log('   Role:     ', DEFAULT_ADMIN.role);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed to create admin account:', err);
    process.exit(1);
  });