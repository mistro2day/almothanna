import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

console.log('Testing connection with:', process.env.DATABASE_URL_UNPOOLED);

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS! Server time is:', res.rows[0]);
  } catch (err) {
    console.error('FAILED to connect:', err);
  } finally {
    await pool.end();
  }
}

test();
