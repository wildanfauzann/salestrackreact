import { db } from './src/db';
import { account, user } from './src/db/schema';

async function main() {
  const users = await db.select().from(user);
  const accounts = await db.select().from(account);
  console.log("USERS:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  console.log("ACCOUNTS:", accounts.map(a => ({ id: a.id, providerId: a.providerId, userId: a.userId, password: a.password })));
  process.exit(0);
}
main();
