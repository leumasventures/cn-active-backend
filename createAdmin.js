import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const email    = 'admin@cnjohnson.com';
const password = 'Admin1234!';
const hashed   = await bcrypt.hash(password, 10);

try {
  const user = await prisma.user.create({
    data: {
      name:     'Admin',
      email,
      password: hashed,
      role:     'ADMIN',
    },
  });
  console.log('✅ Admin user created!');
  console.log('   Email:   ', email);
  console.log('   Password:', password);
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await prisma.$disconnect();
}