import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

const ADMIN_EMAIL    = 'admin@cnjohnsonventures.com';
const ADMIN_PASSWORD = 'Admin@CNJ2026!';
const ADMIN_NAME     = 'CN Johnson Admin';

async function seed() {
  console.log('Seeding default admin...');
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    await prisma.$disconnect();
    return;
  }
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, role: 'ADMIN', active: true, approved: true },
  });
  console.log('Admin created:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  await prisma.$disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
