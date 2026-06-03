import 'dotenv/config';
import sql from 'mssql';

const mssqlConfig: sql.config = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'YourPasswordHere',
  server: process.env.MSSQL_HOST || 'localhost',
  database: process.env.MSSQL_DATABASE || 'MicroPOS',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

if (process.env.MSSQL_INSTANCE) {
  mssqlConfig.options = {
    ...mssqlConfig.options,
    instanceName: process.env.MSSQL_INSTANCE,
  };
} else {
  mssqlConfig.port = parseInt(process.env.MSSQL_PORT || '1433', 10);
}

async function main() {
  const pool = await sql.connect(mssqlConfig);
  try {
    console.log('--- Checking match for DocNo 31 or DocNo 32 ---');
    const res = await pool.request().query(`
      SELECT TOP 5 ID, trx_type_id, serial, trx_date, account_id, total, paid_amount, DocNo
      FROM tbl_inventory 
      WHERE serial = '31' OR DocNo = '31' OR serial = '32' OR DocNo = '32'
    `);
    console.log(res.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.close();
  }
}

main();
