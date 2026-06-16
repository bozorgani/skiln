/**
 * اسکریپت برای ایجاد اولین شماره admin در دیتابیس
 * 
 * استفاده:
 * node scripts/create-admin-phone.js <phone_number> [name]
 * 
 * مثال:
 * node scripts/create-admin-phone.js 09123456789 "مدیر سیستم"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminPhone = require('../src/modules/auth/admin-phone.model');
const { normalizePhone } = require('../src/modules/auth/../../utils/phone');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ Missing MONGO_URI in environment variables');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connection established');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const createAdminPhone = async (phone, name = 'مدیر سیستم') => {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.error('❌ Invalid phone number format');
      process.exit(1);
    }

    // بررسی تکراری نبودن
    const existing = await AdminPhone.findOne({ phone: normalized });
    if (existing) {
      console.log(`⚠️  Phone number ${normalized} already exists in admin list`);
      console.log(`   ID: ${existing._id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Active: ${existing.isActive}`);
      return;
    }

    const adminPhone = await AdminPhone.create({
      phone: normalized,
      name,
      isActive: true,
    });

    console.log('✅ Admin phone created successfully!');
    console.log(`   ID: ${adminPhone._id}`);
    console.log(`   Phone: ${adminPhone.phone}`);
    console.log(`   Name: ${adminPhone.name}`);
    console.log(`   Active: ${adminPhone.isActive}`);
  } catch (error) {
    console.error('❌ Error creating admin phone:', error.message);
    process.exit(1);
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/create-admin-phone.js <phone_number> [name]');
    console.log('Example: node scripts/create-admin-phone.js 09123456789 "مدیر سیستم"');
    process.exit(1);
  }

  const phone = args[0];
  const name = args[1] || 'مدیر سیستم';

  await connectDB();
  await createAdminPhone(phone, name);
  
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

main();

