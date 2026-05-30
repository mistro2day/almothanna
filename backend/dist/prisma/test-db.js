"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const serverless_1 = require("@neondatabase/serverless");
const ws_1 = __importDefault(require("ws"));
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
console.log('Testing connection with:', process.env.DATABASE_URL_UNPOOLED);
const pool = new serverless_1.Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
async function test() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('SUCCESS! Server time is:', res.rows[0]);
    }
    catch (err) {
        console.error('FAILED to connect:', err);
    }
    finally {
        await pool.end();
    }
}
test();
//# sourceMappingURL=test-db.js.map