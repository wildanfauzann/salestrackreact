import { db } from '../db/index.js';
import { activity, customer, deal } from '../db/schema.js';
import { eq, desc, and, ne } from 'drizzle-orm';
import { user } from '../db/schema.js';

export class ActivityService {
  static async create(
    userId: string,
    data: {
      customerName?: string;
      type: 'visit' | 'call' | 'meeting' | 'demo';
      summary?: string;
      notes?: string;
      attachmentUrls?: string[];
      activityDate: Date;
    }
  ) {
    let customerId = undefined;

    // 1. Find or create customer
    if (data.customerName) {
      const existingCustomer = await db
        .select()
        .from(customer)
        .where(
          and(
            eq(customer.name, data.customerName),
            eq(customer.createdBy, userId)
          )
        )
        .limit(1);

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
      } else {
        const newCustomer = await db
          .insert(customer)
          .values({
            name: data.customerName,
            createdBy: userId,
          })
          .returning();
        customerId = newCustomer[0].id;
      }
    }

    // 2. Create activity
    const result = await db
      .insert(activity)
      .values({
        userId,
        customerId,
        type: data.type,
        summary: data.summary,
        notes: data.notes,
        attachmentUrls: data.attachmentUrls,
        activityDate: data.activityDate,
      })
      .returning();



    return result[0];
  }

  static async getMe(userId: string) {
    const records = await db
      .select({
        activity: activity,
        customerName: customer.name,
      })
      .from(activity)
      .leftJoin(customer, eq(activity.customerId, customer.id))
      .where(eq(activity.userId, userId))
      .orderBy(desc(activity.activityDate));
      
    return records.map(r => ({ ...r.activity, customer: { name: r.customerName } }));
  }

  static async getToday(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const records = await db
      .select({
        activity: activity,
        customerName: customer.name,
      })
      .from(activity)
      .leftJoin(customer, eq(activity.customerId, customer.id))
      .where(eq(activity.userId, userId))
      .orderBy(desc(activity.activityDate));
      
    return records.map(r => ({ ...r.activity, customer: { name: r.customerName } }));
  }

  static async getTeam() {
    const records = await db
      .select({
        activity: activity,
        customerName: customer.name,
        userName: user.name,
      })
      .from(activity)
      .leftJoin(customer, eq(activity.customerId, customer.id))
      .leftJoin(user, eq(activity.userId, user.id))
      .orderBy(desc(activity.activityDate));
      
    return records.map(r => ({ ...r.activity, customer: { name: r.customerName }, user: { name: r.userName } }));
  }

  static async getById(id: string) {
    const result = await db
      .select()
      .from(activity)
      .where(eq(activity.id, id))
      .limit(1);
    return result[0];
  }
}
