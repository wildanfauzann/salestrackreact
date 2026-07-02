import { db } from './src/db';
import { user, account } from './src/db/schema';
import { auth } from './src/auth';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("Creating dummy user...");
    const dummy = await auth.api.signUpEmail({
      body: {
        email: 'dummy@test.com',
        password: 'password123',
        name: 'Dummy'
      }
    });

    const dummyAccount = await db.select().from(account).where(eq(account.userId, dummy.user.id)).limit(1);
    const validHash = dummyAccount[0].password;
    console.log("Generated valid hash:", validHash);

    console.log("Applying hash to all users...");
    await db.update(account).set({ password: validHash });

    console.log("Deleting dummy user...");
    await db.delete(account).where(eq(account.userId, dummy.user.id));
    await db.delete(user).where(eq(user.id, dummy.user.id));

    console.log("All passwords reset to: password123");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
