import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.sale.count();
  console.log('Total sales count in DB:', count);
  const sample = await prisma.sale.findMany({
    take: 5,
    select: { id: true, invoiceNumber: true, total: true, paid: true, status: true }
  });
  console.log('Sample sales:', sample);
}
run().finally(() => prisma.$disconnect());
