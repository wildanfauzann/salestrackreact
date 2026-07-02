import { db } from '../db/index.js';
import { leaveRequest } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export class LeaveService {
  static async submit(
    userId: string,
    data: {
      type: 'sakit' | 'cuti' | 'keperluan';
      startDate: string;
      endDate: string;
      reason?: string;
      attachmentUrl?: string;
    }
  ) {
    const result = await db
      .insert(leaveRequest)
      .values({
        userId,
        ...data,
      })
      .returning();
    return result[0];
  }

  static async getMe(userId: string) {
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

  static async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    managerId: string
  ) {
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
