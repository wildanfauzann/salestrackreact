import { db } from '../db/index.js';
import { deal, user, customer } from '../db/schema.js';
import { eq, desc, sum, sql, inArray } from 'drizzle-orm';

export class DealService {
  static async create(
    userId: string,
    data: {
      customerId?: string;
      customerName?: string;
      title?: string;
      value: number;
      category?: 'enterprise' | 'sme' | 'saas' | 'software' | 'hardware';
      stage: 'prospek' | 'negosiasi' | 'closing' | 'lose';
      priority?: 'normal' | 'hot';
      expectedCloseDate?: string;
      attachmentUrl?: string;
    }
  ) {
    let finalCustomerId = data.customerId;

    if (data.customerName && !finalCustomerId) {
      const newCustomer = await db.insert(customer).values({
        name: data.customerName,
        createdBy: userId
      }).returning();
      finalCustomerId = newCustomer[0].id;
    }

    // Exclude customerName from deal insertion payload
    const { customerName, ...insertData } = data;

    const result = await db
      .insert(deal)
      .values({
        userId,
        ...insertData,
        customerId: finalCustomerId,
        value: data.value.toString(),
      })
      .returning();
    return result[0];
  }

  static async getMe(userId: string) {
    return await db
      .select()
      .from(deal)
      .where(eq(deal.userId, userId))
      .orderBy(desc(deal.createdAt));
  }

  static async getTeam() {
    return await db
      .select()
      .from(deal)
      .orderBy(desc(deal.createdAt));
  }

  static async update(id: string, data: Partial<typeof deal.$inferInsert>) {
    const result = await db
      .update(deal)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deal.id, id))
      .returning();
    return result[0];
  }

  static async updateStage(id: string, stage: 'prospek' | 'negosiasi' | 'closing' | 'lose') {
    const updateData: any = { stage, updatedAt: new Date() };
    if (stage === 'closing' || stage === 'lose') {
      updateData.closedAt = new Date();
      if (stage === 'closing') {
        updateData.approvalStatus = 'pending';
      }
    }

    const result = await db
      .update(deal)
      .set(updateData)
      .where(eq(deal.id, id))
      .returning();
    return result[0];
  }

  static async getPendingApproval() {
    const records = await db
      .select({
        deal: deal,
        customerName: customer.name,
        userName: user.name,
      })
      .from(deal)
      .leftJoin(customer, eq(deal.customerId, customer.id))
      .leftJoin(user, eq(deal.userId, user.id))
      .where(eq(deal.approvalStatus, 'pending'))
      .orderBy(desc(deal.updatedAt));

    return records.map(r => ({
      ...r.deal,
      customer: { name: r.customerName },
      user: { name: r.userName },
    }));
  }

  static async getPendingApprovalCount() {
    const pending = await db
      .select()
      .from(deal)
      .where(eq(deal.approvalStatus, 'pending'));
    return pending.length;
  }

  static async updateApprovalStatus(
    id: string,
    status: 'approved' | 'rejected',
    managerId: string
  ) {
    const updateData: any = {
      approvalStatus: status,
      approvedBy: managerId,
      updatedAt: new Date(),
    };

    if (status === 'rejected') {
      updateData.stage = 'negosiasi';
    }

    const result = await db
      .update(deal)
      .set(updateData)
      .where(eq(deal.id, id))
      .returning();
    return result[0];
  }

  static async getPipelineSummary(userId?: string) {
    const query = db
      .select({
        stage: deal.stage,
        count: sql<number>`cast(count(${deal.id}) as int)`,
        totalValue: sql<number>`sum(cast(${deal.value} as numeric))`,
      })
      .from(deal);

    if (userId) {
      query.where(eq(deal.userId, userId));
    }

    const result = await query.groupBy(deal.stage);

    let activeDealsCount = 0;
    let potentialValue = 0;

    for (const row of result) {
      if (row.stage === 'prospek' || row.stage === 'negosiasi') {
        activeDealsCount += Number(row.count) || 0;
        potentialValue += Number(row.totalValue) || 0;
      }
    }

    return { activeDealsCount, potentialValue, breakdown: result };
  }

  static async delete(dealId: string) {
    const result = await db
      .delete(deal)
      .where(eq(deal.id, dealId))
      .returning();
    return result[0];
  }

  static async getApprovalHistory() {
    return await db
      .select({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        approvalStatus: deal.approvalStatus,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        attachmentUrl: deal.attachmentUrl,
        customer: {
          name: customer.name,
        },
        user: {
          name: user.name,
        },
      })
      .from(deal)
      .leftJoin(customer, eq(deal.customerId, customer.id))
      .leftJoin(user, eq(deal.userId, user.id))
      .where(inArray(deal.approvalStatus, ['approved', 'rejected']))
      .orderBy(desc(deal.updatedAt))
      .limit(20);
  }
}
