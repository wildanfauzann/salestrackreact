import { db } from '../db/index.js';
import { customer } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export class CustomerService {
  static async create(
    userId: string,
    data: {
      name: string;
      category?: 'enterprise' | 'sme' | 'saas';
      address?: string;
      phone?: string;
      email?: string;
    }
  ) {
    const result = await db
      .insert(customer)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();
    return result[0];
  }

  static async getAll() {
    return await db.select().from(customer).orderBy(desc(customer.createdAt));
  }

  static async getById(id: string) {
    const result = await db
      .select()
      .from(customer)
      .where(eq(customer.id, id))
      .limit(1);
    return result[0];
  }

  static async update(id: string, data: Partial<typeof customer.$inferInsert>) {
    const result = await db
      .update(customer)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customer.id, id))
      .returning();
    return result[0];
  }
}
