import 'dotenv/config';
import { db } from './db';
import { auth } from './auth';

async function seed() {
  console.log('Seeding initial users...');
  
  try {
    // 1. Create a Manager User
    const manager = await auth.api.signUpEmail({
      body: {
        email: 'manager@salestrack.com',
        password: 'password123',
        name: 'Budi Manager',
      }
    });

    // Update role manually (since signUp API might default to 'user')
    // Wait, better auth uses the user table directly. Let's just create through auth API and then update role via drizzle
    await db.execute(`UPDATE "user" SET role = 'manager' WHERE email = 'manager@salestrack.com'`);

    // 2. Create a Sales User
    const sales = await auth.api.signUpEmail({
      body: {
        email: 'sales@salestrack.com',
        password: 'password123',
        name: 'Andi Sales',
      }
    });

    await db.execute(`UPDATE "user" SET role = 'sales' WHERE email = 'sales@salestrack.com'`);

    console.log('✅ Seeding complete!');
    console.log('Manager Login: manager@salestrack.com / password123');
    console.log('Sales Login: sales@salestrack.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
