import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
export class UserService {
    static async getMe(id) {
        const result = await db.select().from(user).where(eq(user.id, id)).limit(1);
        return result[0];
    }
    static async updateMe(id, data) {
        const result = await db
            .update(user)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(user.id, id))
            .returning();
        return result[0];
    }
    static async getAllUsers() {
        return await db.select().from(user);
    }
    static async updateUser(id, data) {
        const result = await db
            .update(user)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(user.id, id))
            .returning();
        return result[0];
    }
    static async toggleStatus(id, status) {
        const result = await db
            .update(user)
            .set({ status, updatedAt: new Date() })
            .where(eq(user.id, id))
            .returning();
        return result[0];
    }
}
