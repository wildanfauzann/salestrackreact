import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS sales_target;`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS global_target (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        month integer NOT NULL,
        year integer NOT NULL,
        target_amount numeric(15,2),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
