import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as bcrypt from 'bcrypt';

// Configure Neon Serverless for Node.js WebSocket support
neonConfig.webSocketConstructor = ws;

// Set up Prisma Neon Driver Adapter directly with connection string (Prisma 7 pattern)
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Admin User
  const adminPhone = '0912345678';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      name: 'Mothanna Admin',
      email: 'admin@almothanna.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      name: 'Mothanna Admin',
      phone: adminPhone,
      email: 'admin@almothanna.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`👤 Upserted default admin user: ${admin.name} (${admin.phone})`);

  // 2. Create Sample Products
  console.log('📦 Seeding products...');
  const products = [
    {
      name: 'Amoxicillin 500mg',
      scientificName: 'Amoxicillin Trihydrate',
      barcode: '6251234567890',
      category: 'Antibiotic',
      unit: 'Box',
    },
    {
      name: 'Paracetamol 500mg',
      scientificName: 'Paracetamol',
      barcode: '6251234567891',
      category: 'Analgesic',
      unit: 'Box',
    },
    {
      name: 'Ciprofloxacin 500mg',
      scientificName: 'Ciprofloxacin Hydrochloride',
      barcode: '6251234567892',
      category: 'Antibiotic',
      unit: 'Box',
    },
    {
      name: 'Insulin Glargine 100 IU/ml',
      scientificName: 'Insulin Glargine',
      barcode: '6251234567893',
      category: 'Antidiabetic',
      unit: 'Vial',
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { barcode: prod.barcode },
      update: {},
      create: prod,
    });
  }
  console.log(`📦 Seeded ${products.length} products.`);

  // 3. Create Sample Customers
  console.log('👥 Seeding customers...');
  const customers = [
    {
      name: 'Al-Shefa Pharmacy',
      type: 'Pharmacy',
      state: 'Khartoum',
      phone: '0912111111',
      creditLimit: 500000,
    },
    {
      name: 'Omdurman Teaching Hospital',
      type: 'Hospital',
      state: 'Khartoum',
      phone: '0912222222',
      creditLimit: 2000000,
    },
    {
      name: 'El-Obeid Central Pharmacy',
      type: 'Pharmacy',
      state: 'North Kordofan',
      phone: '0912333333',
      creditLimit: 300000,
    },
    {
      name: 'Port Sudan Navy Pharmacy',
      type: 'Pharmacy',
      state: 'Red Sea',
      phone: '0912444444',
      creditLimit: 1000000,
    },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: {},
      create: cust,
    });
  }
  console.log(`👥 Seeded ${customers.length} customers.`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
