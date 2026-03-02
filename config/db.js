import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  logging: false,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false, // Required for Railway
    },
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    await sequelize.sync({ alter: true }); // syncs your models
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
export default prisma;
