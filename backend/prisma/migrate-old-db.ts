import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import sql from 'mssql';
import { randomUUID } from 'crypto';

// Configure Neon Serverless for Node.js WebSocket support
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const prisma = new PrismaClient({ adapter });

// MSSQL Connection Configuration
const mssqlConfig: sql.config = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'YourPasswordHere',
  server: process.env.MSSQL_HOST || 'localhost',
  database: process.env.MSSQL_DATABASE || 'MicroPOS',
  requestTimeout: 300000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const supplierAliases: Record<string, string> = {
  'amipharma': 'شركة اميفارما المحدودة',
  'اميفارما': 'شركة اميفارما المحدودة',
  'امي فارما': 'شركة اميفارما المحدودة',
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/limited/g, '')
    .replace(/الحدوده/g, '')
    .replace(/الحديثه/g, '')
    .replace(/شركه/g, '')
    .replace(/شركة/g, '');
}

if (process.env.MSSQL_INSTANCE) {
  mssqlConfig.options = {
    ...mssqlConfig.options,
    instanceName: process.env.MSSQL_INSTANCE,
  };
} else {
  mssqlConfig.port = parseInt(process.env.MSSQL_PORT || '1433', 10);
}

async function migrate() {
  console.log('🔄 Connecting to MSSQL Database...');
  const pool = await sql.connect(mssqlConfig);
  console.log('✅ Connected to MSSQL Database successfully.');

  console.log('🌱 Connecting to PostgreSQL Database...');
  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL Database successfully.');

  try {
    // ==========================================
    // 0. Clean Existing Test Data in PostgreSQL
    // ==========================================
    console.log('🧹 Clearing existing test/sample data in PostgreSQL...');
    await prisma.expense.deleteMany();
    await prisma.expenseCategory.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.installment.deleteMany();
    await prisma.deliveryOrder.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplierPayment.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.representative.deleteMany();
    console.log('✅ PostgreSQL database cleared successfully.');

    // ==========================================
    // 1. Fetch Categories (tbl_grouping_cod)
    // ==========================================
    console.log('🔄 Fetching categories from tbl_grouping_cod...');
    const categoriesResult = await pool.request().query('SELECT * FROM tbl_grouping_cod');
    const categoriesMap = new Map<number, string>();
    for (const cat of categoriesResult.recordset) {
      categoriesMap.set(cat.grouping_id, cat.grouping_name);
    }
    console.log(`📋 Loaded ${categoriesMap.size} categories into memory.`);

    // ==========================================
    // 2. Migrate Suppliers (tbl_supplier_mst)
    // ==========================================
    console.log('🔄 Migrating Suppliers from tbl_supplier_mst...');
    const suppliersResult = await pool.request().query('SELECT * FROM tbl_supplier_mst');
    const oldSuppliers = suppliersResult.recordset;
    console.log(`ℹ️ Found ${oldSuppliers.length} suppliers in old database.`);

    const supplierIdMap = new Map<string, string>(); // Maps old supplierid (string/number) to new Postgres Supplier UUID
    const supplierByNameMap = new Map<string, string>(); // Maps normalized supplier name to UUID

    for (const supplier of oldSuppliers) {
      // Ensure phone is unique and valid
      let phone = (supplier.suppliermobile || '').trim();
      if (!phone || phone.length < 5) {
        phone = `0000000_${supplier.supplierid}`;
      }

      // Upsert supplier
      const upsertedSupplier = await prisma.supplier.upsert({
        where: { phone },
        update: {
          name: supplier.suppliername || 'Unnamed Supplier',
          companyName: supplier.suppliername || null,
          type: 'pharma_company',
          address: supplier.supplieraddress || null,
          commercialReg: supplier.supplierregno || null,
          notes: supplier.notes || null,
          isActive: !supplier.deleted,
        },
        create: {
          name: supplier.suppliername || 'Unnamed Supplier',
          companyName: supplier.suppliername || null,
          type: 'pharma_company',
          phone,
          address: supplier.supplieraddress || null,
          commercialReg: supplier.supplierregno || null,
          notes: supplier.notes || null,
          isActive: !supplier.deleted,
        },
      });

      supplierIdMap.set(String(supplier.supplierid), upsertedSupplier.id);
      supplierByNameMap.set(normalizeName(upsertedSupplier.name), upsertedSupplier.id);
    }
    console.log(`✅ Suppliers migration completed. Migrated ${supplierIdMap.size} suppliers.`);

    // ==========================================
    // 3. Migrate Products (tbl_products_trn)
    // ==========================================
    console.log('🔄 Migrating Products from tbl_products_trn...');
    const productsResult = await pool.request().query('SELECT * FROM tbl_products_trn');
    const oldProducts = productsResult.recordset;
    console.log(`ℹ️ Found ${oldProducts.length} products in old database.`);

    let productsCount = 0;
    for (const product of oldProducts) {
      // Resolve category
      const categoryName = categoriesMap.get(product.grouping_id) || 'General';

      // Resolve supplier UUID (fallback to productsup_id)
      let supplierUuid = supplierIdMap.get(String(product.productsup_id)) || null;

      // Resolve supplier by category name (grouping name)
      if (categoryName && categoryName !== 'General') {
        const normCategory = normalizeName(categoryName);
        
        // 1. Check alias dictionary
        const aliasTarget = supplierAliases[normCategory];
        if (aliasTarget) {
          const matchedUuid = supplierByNameMap.get(normalizeName(aliasTarget));
          if (matchedUuid) {
            supplierUuid = matchedUuid;
          }
        } else {
          // 2. Direct normalized check
          const matchedUuid = supplierByNameMap.get(normCategory);
          if (matchedUuid) {
            supplierUuid = matchedUuid;
          } else {
            // 3. Substring check: check if any supplier name contains the category name or vice versa
            for (const [supName, uuid] of supplierByNameMap.entries()) {
              if (supName.includes(normCategory) || normCategory.includes(supName)) {
                supplierUuid = uuid;
                break;
              }
            }
          }
        }
      }

      // Ensure barcode/product ID is unique
      let barcode = (product.products_id || '').trim();
      if (!barcode) {
        barcode = `GEN_BARCODE_${product.ID}`;
      }

      await prisma.product.upsert({
        where: { barcode },
        update: {
          name: product.product_name || 'Unnamed Product',
          scientificName: product.product_desc || null,
          category: categoryName,
          unit: product.productunit || 'Box',
          supplierId: supplierUuid,
        },
        create: {
          name: product.product_name || 'Unnamed Product',
          scientificName: product.product_desc || null,
          barcode,
          category: categoryName,
          unit: product.productunit || 'Box',
          supplierId: supplierUuid,
        },
      });
      productsCount++;
    }
    console.log(`✅ Products migration completed. Migrated ${productsCount} products.`);

    // ==========================================
    // 4. Migrate Customers (tbl_customers_mst)
    // ==========================================
    console.log('🔄 Migrating Customers from tbl_customers_mst...');
    const customersResult = await pool.request().query('SELECT * FROM tbl_customers_mst');
    const oldCustomers = customersResult.recordset;
    console.log(`ℹ️ Found ${oldCustomers.length} customers in old database.`);

    const customerIdMap = new Map<string, string>(); // Maps old customerid to new Postgres Customer UUID
    let customersCount = 0;
    for (const customer of oldCustomers) {
      // Ensure phone is unique and valid
      let phone = (customer.customermobile || '').trim();
      if (!phone || phone.length < 5) {
        phone = `0000000_${customer.customerid}`;
      }

      const upsertedCustomer = await prisma.customer.upsert({
        where: { phone },
        update: {
          name: customer.customername || 'Unnamed Customer',
          type: customer.customerstatus || 'Pharmacy',
          state: customer.CustomerPartyCityName || 'Khartoum',
          creditLimit: parseFloat(customer.credit_amount) || 0,
        },
        create: {
          name: customer.customername || 'Unnamed Customer',
          type: customer.customerstatus || 'Pharmacy',
          state: customer.CustomerPartyCityName || 'Khartoum',
          phone,
          creditLimit: parseFloat(customer.credit_amount) || 0,
        },
      });
      customerIdMap.set(String(customer.customerid), upsertedCustomer.id);
      customersCount++;
    }
    console.log(`✅ Customers migration completed. Migrated ${customersCount} customers.`);

    // ==========================================
    // 5. Migrate Inventory (tbl_inventory)
    // ==========================================
    console.log('🔄 Migrating Inventory (Batches) from tbl_inventory...');
    const inventoryResult = await pool.request().query(
      "SELECT * FROM tbl_inventory WHERE product_quantity > 0 AND (deleted = 0 OR deleted IS NULL)"
    );
    const oldInventory = inventoryResult.recordset;
    console.log(`ℹ️ Found ${oldInventory.length} inventory records with positive quantity.`);

    const allProducts = await prisma.product.findMany();
    const productByBarcodeMap = new Map(allProducts.map(p => [p.barcode, p]));

    console.log('🔄 Grouping inventory records by product and expiry date in memory...');
    const batchGroupMap = new Map<string, {
      productId: string;
      batchNumber: string;
      qty: number;
      costPrice: number;
      expiryDate: Date;
      manufactureDate: Date;
      supplierId: string | null;
    }>();

    for (const inv of oldInventory) {
      const barcode = (inv.products_id || '').trim();
      if (!barcode) continue;

      const product = productByBarcodeMap.get(barcode);
      if (!product) continue;

      const expiryDate = inv.expire_date ? new Date(inv.expire_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const expiryDateStr = expiryDate.toISOString().split('T')[0];
      const batchNumber = `BCH-${expiryDateStr}`;

      const key = `${product.id}_${batchNumber}`;
      const qty = Math.round(parseFloat(inv.product_quantity || '0'));
      const costPrice = parseFloat(inv.price_cost || '0');
      const manufactureDate = inv.cDate ? new Date(inv.cDate) : new Date(expiryDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

      const existing = batchGroupMap.get(key);
      if (existing) {
        existing.qty += qty;
        existing.costPrice = costPrice > 0 ? costPrice : existing.costPrice;
      } else {
        batchGroupMap.set(key, {
          productId: product.id,
          batchNumber,
          qty,
          costPrice,
          expiryDate,
          manufactureDate,
          supplierId: product.supplierId,
        });
      }
    }
    console.log(`📋 Grouped into ${batchGroupMap.size} unique batches.`);

    let batchesCount = 0;
    const createdBatches: any[] = [];
    for (const b of batchGroupMap.values()) {
      const batch = await prisma.batch.upsert({
        where: {
          productId_batchNumber: {
            productId: b.productId,
            batchNumber: b.batchNumber,
          },
        },
        update: {
          qty: b.qty,
          costPrice: b.costPrice,
          expiryDate: b.expiryDate,
          manufactureDate: b.manufactureDate,
          supplierId: b.supplierId,
        },
        create: {
          productId: b.productId,
          batchNumber: b.batchNumber,
          qty: b.qty,
          costPrice: b.costPrice,
          expiryDate: b.expiryDate,
          manufactureDate: b.manufactureDate,
          supplierId: b.supplierId,
        },
      });

      createdBatches.push(batch);

      // Insert Initial Stock Movement if it doesn't exist
      const existingMovement = await prisma.stockMovement.findFirst({
        where: {
          batchId: batch.id,
          reason: 'Initial Import',
        },
      });

      if (!existingMovement) {
        await prisma.stockMovement.create({
          data: {
            batchId: batch.id,
            type: 'IN',
            qty: b.qty,
            reason: 'Initial Import',
          },
        });
      }

      batchesCount++;
    }
    console.log(`✅ Inventory migration completed. Migrated/Updated ${batchesCount} batches.`);

    // ==========================================
    // 6. Pre-generate Legacy Batches for Sales
    // ==========================================
    console.log('🔄 Ensuring legacy batches exist for products without any batch...');
    const allExistingBatches = await prisma.batch.findMany();
    const productsWithBatches = new Set(allExistingBatches.map(b => b.productId));
    let legacyBatchesCreated = 0;

    for (const product of allProducts) {
      if (!productsWithBatches.has(product.id)) {
        const legacyBatch = await prisma.batch.create({
          data: {
            productId: product.id,
            batchNumber: 'BCH-LEGACY',
            qty: 0,
            costPrice: 0,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            manufactureDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            supplierId: product.supplierId,
          }
        });
        allExistingBatches.push(legacyBatch);
        legacyBatchesCreated++;
      }
    }
    console.log(`✅ Legacy batches generated: ${legacyBatchesCreated} batches.`);

    // Create rapid lookup map for batch IDs
    const productToBatchIdMap = new Map<string, string>();
    for (const b of allExistingBatches) {
      if (!productToBatchIdMap.has(b.productId) || b.batchNumber !== 'BCH-LEGACY') {
        productToBatchIdMap.set(b.productId, b.id);
      }
    }

    // ==========================================
    // 7. Migrate Sales History & Invoices
    // ==========================================
    console.log('🔄 Migrating Sales Invoices from tbl_inventory (trx_type_id = 3)...');
    const salesResult = await pool.request().query(
      "SELECT * FROM tbl_inventory WHERE trx_type_id = 3 AND (deleted = 0 OR deleted IS NULL)"
    );
    const oldSalesRows = salesResult.recordset;
    console.log(`ℹ️ Found ${oldSalesRows.length} sales inventory records.`);

    // Group rows by serial (invoice number)
    const salesGroupMap = new Map<string, {
      customerId: string;
      trxDate: Date;
      total: number;
      paid: number;
      items: Array<{
        barcode: string;
        qty: number;
        price: number;
      }>;
    }>();

    for (const row of oldSalesRows) {
      const serial = (row.serial || '').trim();
      if (!serial) continue;

      const customerUuid = customerIdMap.get(String(row.account_id)) || null;
      if (!customerUuid) continue; // Skip sales with unknown customer accounts

      const trxDate = row.trx_date ? new Date(row.trx_date) : new Date();
      const qty = Math.round(parseFloat(row.product_quantity || '0'));
      const price = parseFloat(row.product_price || '0');
      const total = parseFloat(row.total || '0');
      const paid = parseFloat(row.paid_amount || '0');

      const existing = salesGroupMap.get(serial);
      if (existing) {
        existing.items.push({
          barcode: (row.products_id || '').trim(),
          qty,
          price,
        });
      } else {
        salesGroupMap.set(serial, {
          customerId: customerUuid,
          trxDate,
          total,
          paid,
          items: [{
            barcode: (row.products_id || '').trim(),
            qty,
            price,
          }],
        });
      }
    }

    console.log(`📋 Grouped into ${salesGroupMap.size} unique sales invoices. Inserting into PostgreSQL...`);

    const salesToInsert: any[] = [];
    const itemsToInsert: any[] = [];
    const stockMovementsToInsert: any[] = [];

    for (const [serial, data] of salesGroupMap.entries()) {
      const saleId = randomUUID();
      let status: 'PENDING' | 'PAID' | 'PARTIAL' = 'PENDING';
      if (data.paid >= data.total) {
        status = 'PAID';
      } else if (data.paid > 0) {
        status = 'PARTIAL';
      }

      salesToInsert.push({
        id: saleId,
        customerId: data.customerId,
        total: data.total,
        paid: data.paid,
        status,
        createdAt: data.trxDate,
        updatedAt: data.trxDate,
      });

      for (const item of data.items) {
        const product = productByBarcodeMap.get(item.barcode);
        if (!product) continue;

        const batchId = productToBatchIdMap.get(product.id);
        if (!batchId) continue;

        const saleItemId = randomUUID();
        itemsToInsert.push({
          id: saleItemId,
          saleId,
          productId: product.id,
          batchId,
          qty: item.qty,
          price: item.price,
          createdAt: data.trxDate,
        });

        // Also track as a stock movement OUT
        stockMovementsToInsert.push({
          id: randomUUID(),
          batchId,
          type: 'OUT',
          qty: item.qty,
          reason: 'Sale',
          createdAt: data.trxDate,
        });
      }
    }

    // Insert sales in chunks of 500
    console.log(`🚀 Inserting ${salesToInsert.length} Sales...`);
    for (let i = 0; i < salesToInsert.length; i += 500) {
      const chunk = salesToInsert.slice(i, i + 500);
      await prisma.sale.createMany({ data: chunk });
    }

    // Insert items in chunks of 1000
    console.log(`🚀 Inserting ${itemsToInsert.length} SaleItems...`);
    for (let i = 0; i < itemsToInsert.length; i += 1000) {
      const chunk = itemsToInsert.slice(i, i + 1000);
      await prisma.saleItem.createMany({ data: chunk });
    }

    // Insert stock movements in chunks of 1000
    console.log(`🚀 Inserting ${stockMovementsToInsert.length} StockMovements...`);
    for (let i = 0; i < stockMovementsToInsert.length; i += 1000) {
      const chunk = stockMovementsToInsert.slice(i, i + 1000);
      await prisma.stockMovement.createMany({ data: chunk });
    }

    // ==========================================
    // 8. Migrate Expenses (tbl_expenditure_mst)
    // ==========================================
    console.log('🔄 Migrating Expenses from tbl_expenditure_mst...');
    const expensesResult = await pool.request().query(
      "SELECT * FROM tbl_expenditure_mst WHERE (deleted = 0 OR deleted IS NULL)"
    );
    const oldExpenses = expensesResult.recordset;
    console.log(`ℹ️ Found ${oldExpenses.length} expenses in old database.`);

    // Find or create a default user for linking
    const defaultUser = await prisma.user.findFirst();
    const categoryCache = new Map<string, string>();
    let expensesCount = 0;

    for (const exp of oldExpenses) {
      const categoryName = (exp.expendituretxt || 'مصاريف عامة').trim();
      let categoryId = categoryCache.get(categoryName);
      
      if (!categoryId) {
        const cat = await prisma.expenseCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });
        categoryId = cat.id;
        categoryCache.set(categoryName, categoryId);
      }

      await prisma.expense.create({
        data: {
          amount: parseFloat(exp.paid_amount || '0'),
          description: exp.extranote || null,
          date: exp.expenditure_date ? new Date(exp.expenditure_date) : new Date(),
          categoryId,
          userId: defaultUser?.id || null,
          createdAt: exp.cDate ? new Date(exp.cDate) : new Date(),
          updatedAt: exp.eDate ? new Date(exp.eDate) : new Date(),
        },
      });
      expensesCount++;
    }
    console.log(`✅ Expenses migration completed. Migrated ${expensesCount} expenses.`);

    console.log('🎉 Database migration finished successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await pool.close();
    await prisma.$disconnect();
  }
}

migrate();
