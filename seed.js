// prisma/seed.js
// Run once with: node prisma/seed.js
// Creates the default admin account if it doesn't already exist.

import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

const ADMIN_EMAIL    = 'admin@cnjohnsonventures.com'; // 🔴 change if you want
const ADMIN_PASSWORD = 'Admin@CNJ2026!';              // 🔴 change after first login
const ADMIN_NAME     = 'CN Johnson Admin';

async function seed() {
  console.log('🌱 Seeding default admin...');

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      role:     'ADMIN',
      active:   true,
      approved: true,   // admin is pre-approved
    },
  });

  console.log('✅ Default admin created:');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   ⚠️  Change the password after first login!');

  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  prisma.$disconnect();
  process.exit(1);
});