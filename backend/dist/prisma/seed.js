"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_neon_1 = require("@prisma/adapter-neon");
const serverless_1 = require("@neondatabase/serverless");
const ws_1 = __importDefault(require("ws"));
const bcrypt = __importStar(require("bcrypt"));
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
const adapter = new adapter_neon_1.PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting database seeding...');
    const adminPhone = '0912345678';
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { phone: adminPhone },
        update: {
            name: 'Mothanna Admin',
            email: 'admin@almothanna.com',
            password: hashedPassword,
            role: client_1.Role.ADMIN,
        },
        create: {
            name: 'Mothanna Admin',
            phone: adminPhone,
            email: 'admin@almothanna.com',
            password: hashedPassword,
            role: client_1.Role.ADMIN,
        },
    });
    console.log(`👤 Upserted default admin user: ${admin.name} (${admin.phone})`);
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
//# sourceMappingURL=seed.js.map