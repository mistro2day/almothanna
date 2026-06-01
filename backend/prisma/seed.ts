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
      name: 'Panadol 500mg (Panadol)',
      scientificName: 'Paracetamol',
      barcode: '6251234567891',
      category: 'Analgesic',
      unit: 'Box',
    },
    {
      name: 'Amoxil 500mg (Amoxil)',
      scientificName: 'Amoxicillin Trihydrate',
      barcode: '6251234567890',
      category: 'Antibiotic',
      unit: 'Box',
    },
    {
      name: 'Ciprobay 500mg (Ciprobay)',
      scientificName: 'Ciprofloxacin Hydrochloride',
      barcode: '6251234567892',
      category: 'Antibiotic',
      unit: 'Box',
    },
    {
      name: 'Insulin Glargine 100 IU/ml (Lantus)',
      scientificName: 'Insulin Glargine',
      barcode: '6251234567893',
      category: 'Antidiabetic',
      unit: 'Vial',
    },
    {
      name: 'Glucophage 850mg (Glucophage)',
      scientificName: 'Metformin Hydrochloride',
      barcode: '6251234567894',
      category: 'Antidiabetic',
      unit: 'Box',
    },
    {
      name: 'Losec 20mg (Losec)',
      scientificName: 'Omeprazole',
      barcode: '6251234567895',
      category: 'Antiulcer',
      unit: 'Box',
    },
    {
      name: 'Lipitor 20mg (Lipitor)',
      scientificName: 'Atorvastatin Calcium',
      barcode: '6251234567896',
      category: 'Lipid-lowering',
      unit: 'Box',
    },
    {
      name: 'Norvasc 5mg (Norvasc)',
      scientificName: 'Amlodipine Besylate',
      barcode: '6251234567897',
      category: 'Antihypertensive',
      unit: 'Box',
    },
    {
      name: 'Brufen 400mg (Brufen)',
      scientificName: 'Ibuprofen',
      barcode: '6251234567898',
      category: 'Analgesic / NSAID',
      unit: 'Box',
    },
    {
      name: 'Ventolin Inhaler 100mcg (Ventolin)',
      scientificName: 'Salbutamol Sulfate',
      barcode: '6251234567899',
      category: 'Bronchodilator',
      unit: 'Inhaler',
    },
    {
      name: 'Zithromax 500mg (Zithromax)',
      scientificName: 'Azithromycin Dihydrate',
      barcode: '6251234567900',
      category: 'Antibiotic',
      unit: 'Box',
    },
    {
      name: 'Voltaren 50mg (Voltaren)',
      scientificName: 'Diclofenac Sodium',
      barcode: '6251234567901',
      category: 'Analgesic / NSAID',
      unit: 'Box',
    },
    {
      name: 'Controloc 40mg (Controloc)',
      scientificName: 'Pantoprazole Sodium',
      barcode: '6251234567902',
      category: 'Antiulcer',
      unit: 'Box',
    },
    {
      name: 'Nexium 40mg (Nexium)',
      scientificName: 'Esomeprazole Magnesium',
      barcode: '6251234567903',
      category: 'Antiulcer',
      unit: 'Box',
    },
    {
      name: 'Cozaar 50mg (Cozaar)',
      scientificName: 'Losartan Potassium',
      barcode: '6251234567904',
      category: 'Antihypertensive',
      unit: 'Box',
    },
    {
      name: 'Concor 5mg (Concor)',
      scientificName: 'Bisoprolol Fumarate',
      barcode: '6251234567905',
      category: 'Antihypertensive',
      unit: 'Box',
    },
    {
      name: 'Amaryl 2mg (Amaryl)',
      scientificName: 'Glimepiride',
      barcode: '6251234567906',
      category: 'Antidiabetic',
      unit: 'Box',
    },
    {
      name: 'Crestor 10mg (Crestor)',
      scientificName: 'Rosuvastatin Calcium',
      barcode: '6251234567907',
      category: 'Lipid-lowering',
      unit: 'Box',
    },
    {
      name: 'Plavix 75mg (Plavix)',
      scientificName: 'Clopidogrel Bisulfate',
      barcode: '6251234567908',
      category: 'Antiplatelet',
      unit: 'Box',
    },
    {
      name: 'Augmentin 1g (Augmentin)',
      scientificName: 'Amoxicillin Clavulanate Potassium',
      barcode: '6251234567909',
      category: 'Antibiotic',
      unit: 'Box',
    }
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
