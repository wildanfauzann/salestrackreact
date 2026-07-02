import { db } from '../db';
import { leaveRequest } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
export class LeaveService {
    static async submit(userId, data) {
        const result = await db
            .insert(leaveRequest)
            .values({
            userId,
            ...data,
        })
            .returning();
        return result[0];
    }
    static async getMe(userId) {
        return await db
            .select()
            .from(leaveRequest)
            .where(eq(leaveRequest.userId, userId))
            .orderBy(desc(leaveRequest.createdAt));
    }
    static async getPending() {
        return await db
            .select()
            .from(leaveRequest)
            .where(eq(leaveRequest.status, 'pending'))
            .orderBy(desc(leaveRequest.createdAt));
    }
    static async getAll() {
        return await db
            .select()
            .from(leaveRequest)
            .orderBy(desc(leaveRequest.createdAt));
    }
    static async getPendingCount() {
        const pending = await db
            .select()
            .from(leaveRequest)
            .where(eq(leaveRequest.status, 'pending'));
        return pending.length;
    }
    static async updateStatus(id, status, managerId) {
        const result = await db
            .update(leaveRequest)
            .set({
            status,
            approvedBy: managerId,
            approvedAt: new Date(),
            updatedAt: new Date(),
        })
            .where(eq(leaveRequest.id, id))
            .returning();
        return result[0];
    }
}
