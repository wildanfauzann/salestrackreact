import { db } from '../db/index.js';
import { user, session, account, attendance, leaveRequest, activity, deal, customer } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { auth } from '../auth/index.js';
import bcrypt from 'bcryptjs';

export class UserService {
  static async getMe(id: string) {
    const result = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return result[0];
  }

  static async updateMe(id: string, data: any) {
    const updateData = { ...data };


    if (Object.keys(updateData).length > 0) {
      const result = await db
        .update(user)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();
      if (result.length > 0) return result[0];
    }
    
    return await this.getMe(id);
  }

  static async getAllUsers() {
    return await db.select().from(user);
  }

  static async createUser(data: any) {
    // using better-auth api to create user and password securely
    const res = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'sales',
        status: data.status || 'active',
        phone: data.phone || ''
      },
      headers: new Headers() // Isolated request so it doesn't set cookies in manager's browser
    });
    return res;
  }

  static async updateUser(id: string, data: any) {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    if (data.password) {
      // Create a dummy user to let better-auth generate a valid compatible hash natively
      const dummyEmail = `dummy_hash_${Date.now()}@temp.com`;
      const dummy = await auth.api.signUpEmail({
        body: { email: dummyEmail, password: data.password, name: 'dummy' },
        headers: new Headers()
      });
      
      // Retrieve the generated hash
      const dummyAccount = await db.select().from(account).where(eq(account.userId, dummy.user.id)).limit(1);
      const validHash = dummyAccount[0].password;
      
      // Clean up the dummy user completely
      await db.delete(session).where(eq(session.userId, dummy.user.id));
      await db.delete(account).where(eq(account.userId, dummy.user.id));
      await db.delete(user).where(eq(user.id, dummy.user.id));
      
      // Apply the valid hash to the target user
      await db.update(account)
        .set({ password: validHash, updatedAt: new Date() })
        .where(eq(account.userId, id));
        
      delete updateData.password;
    }

    // Update user profile fields if any
    if (Object.keys(updateData).length > 1) { // more than just updatedAt
      const result = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, id))
        .returning();
      return result[0];
    }
    
    return await this.getMe(id);
  }

  static async deleteUser(id: string) {
    // Nullify references where the user acted as an approver or creator
    await db.update(leaveRequest).set({ approvedBy: null }).where(eq(leaveRequest.approvedBy, id));
    await db.update(deal).set({ approvedBy: null }).where(eq(deal.approvedBy, id));
    await db.update(customer).set({ createdBy: null }).where(eq(customer.createdBy, id));

    // Delete dependent records
    await db.delete(attendance).where(eq(attendance.userId, id));
    await db.delete(leaveRequest).where(eq(leaveRequest.userId, id));
    await db.delete(activity).where(eq(activity.userId, id));
    await db.delete(deal).where(eq(deal.userId, id));

    // Delete related auth records
    await db.delete(session).where(eq(session.userId, id));
    await db.delete(account).where(eq(account.userId, id));
    
    // Finally delete user
    const result = await db.delete(user).where(eq(user.id, id)).returning();
    return result[0];
  }

  static async toggleStatus(id: string, status: 'active' | 'inactive') {
    const result = await db
      .update(user)
      .set({ status, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    return result[0];
  }
}
