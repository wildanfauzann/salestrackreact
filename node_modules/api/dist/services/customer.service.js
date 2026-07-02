import { db } from '../db';
import { customer } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
export class CustomerService {
    static async create(userId, data) {
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
    static async getById(id) {
        const result = await db
            .select()
            .from(customer)
            .where(eq(customer.id, id))
            .limit(1);
        return result[0];
    }
    static async update(id, data) {
        const result = await db
            .update(customer)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(customer.id, id))
            .returning();
        return result[0];
    }
}
