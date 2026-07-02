import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.FRONTEND_URL ? ['http://localhost:5173', process.env.FRONTEND_URL, 'https://salestrackreact2.netlify.app'] : ['http://localhost:5173', 'https://salestrackreact2.netlify.app'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: false,
      },
      status: {
        type: 'string',
        required: false,
      },
    },
  },
});
