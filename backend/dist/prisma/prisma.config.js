"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    migrate: {
        async adapter() {
            const { PrismaNeon } = await import('@prisma/adapter-neon');
            return new PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED });
        },
    },
});
//# sourceMappingURL=prisma.config.js.map