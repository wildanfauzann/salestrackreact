import { db } from '../db/index.js';
import { attendance, officeSettings, user, leaveRequest } from '../db/schema.js';
import { eq, and, desc, sql, lte, gte } from 'drizzle-orm';
import { checkGeofence } from '../lib/geofence.js';

export class AttendanceService {
  static async checkIn(
    userId: string,
    latitude: number,
    longitude: number,
    photoUrl?: string
  ) {
    // 1. Get office settings
    const offices = await db.select().from(officeSettings).where(eq(officeSettings.isActive, true));
    let isOutsideGeofence = false;
    let minDistance = 0;

    if (offices.length > 0) {
      // Find nearest office
      minDistance = Infinity;
      for (const office of offices) {
        const { isOutside, distanceMeters } = checkGeofence(
          latitude,
          longitude,
          parseFloat(office.latitude as any),
          parseFloat(office.longitude as any),
          office.radiusMeters
        );
        if (distanceMeters < minDistance) {
          minDistance = distanceMeters;
          isOutsideGeofence = isOutside;
        }
      }
    }

    // 2. Create attendance record
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();

    let currentStatus = 'hadir' as const;

    // Mark as late if checking in after 09:00
    if (hours > 9 || (hours === 9 && minutes > 0)) {
      currentStatus = 'late' as any;
    }

    const result = await db
      .insert(attendance)
      .values({
        userId,
        date: today,
        checkInTime: now,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        checkInPhoto: photoUrl,
        isOutsideGeofence,
        distanceFromOffice: minDistance.toString(),
        status: currentStatus,
      })
      .returning();

    return result[0];
  }

  static async checkOut(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    if (now.getHours() < 17) {
      throw new Error('Belum waktunya check-out');
    }

    const result = await db
      .update(attendance)
      .set({ checkOutTime: now })
      .where(and(eq(attendance.userId, userId), eq(attendance.date, today)))
      .returning();
    return result[0];
  }

  static async getToday(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, today)))
      .limit(1);
      
    if (result[0]) return result[0];

    // Check if there is an approved leave for today
    const leaves = await db
      .select()
      .from(leaveRequest)
      .where(
        and(
          eq(leaveRequest.userId, userId),
          eq(leaveRequest.status, 'approved'),
          lte(leaveRequest.startDate, today),
          gte(leaveRequest.endDate, today)
        )
      )
      .limit(1);

    if (leaves[0]) {
      return {
        id: `leave-${leaves[0].id}`,
        userId: userId,
        date: today,
        status: 'izin',
        checkInTime: null,
        checkOutTime: null,
      };
    }

    return undefined;
  }

  static async getHistory(userId: string) {
    const userRecord = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!userRecord[0]) return [];

    const attendances = await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));

    // Get all approved leaves for this user
    const leaves = await db
      .select()
      .from(leaveRequest)
      .where(
        and(
          eq(leaveRequest.userId, userId),
          eq(leaveRequest.status, 'approved')
        )
      );

    const startDate = userRecord[0].createdAt ? new Date(userRecord[0].createdAt) : new Date();
    startDate.setHours(0,0,0,0);
    const endDate = new Date();
    
    const result = [];
    let current = new Date(endDate);
    
    while (current >= startDate) {
      const dateStr = current.toISOString().split('T')[0];
      const att = attendances.find(a => a.date === dateStr);
      
      // Skip Sundays (0) and Saturdays (6) if they are typically days off
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (att) {
        result.push(att);
      } else {
        // Check if there is an approved leave for this date
        const leave = leaves.find(l => dateStr >= l.startDate && dateStr <= l.endDate);
        if (leave && !isWeekend) {
          result.push({
            id: `leave-${leave.id}-${dateStr}`,
            userId: userId,
            date: dateStr,
            status: 'izin',
            checkInTime: null,
            checkOutTime: null,
          });
        } else if (!isWeekend) {
        const now = new Date();
        const isToday = dateStr === now.toISOString().split('T')[0];
        const pastCutoff = now.getHours() >= 9 || (now.getHours() === 9 && now.getMinutes() > 0);

        // Treat as absent if it's a past day, or today past 9 AM
        if (!isToday || pastCutoff) {
          result.push({
            id: `absent-${dateStr}`,
            userId: userId,
            date: dateStr,
            status: 'absent',
            checkInTime: null,
            checkOutTime: null,
          });
        }
      }
      }
      current.setDate(current.getDate() - 1);
    }
    
    return result;
  }

  static async getTeamToday() {
    const today = new Date().toISOString().split('T')[0];
    
    const activeSales = await db.select().from(user).where(and(eq(user.role, 'sales'), eq(user.status, 'active')));
    const attendances = await db.select().from(attendance).where(eq(attendance.date, today));
    
    // Get all approved leaves for today
    const leaves = await db
      .select()
      .from(leaveRequest)
      .where(
        and(
          eq(leaveRequest.status, 'approved'),
          lte(leaveRequest.startDate, today),
          gte(leaveRequest.endDate, today)
        )
      );
    
    const now = new Date();
    const pastCutoff = now.getHours() >= 9 || (now.getHours() === 9 && now.getMinutes() > 0);

    const result = activeSales.map(sales => {
      const att = attendances.find(a => a.userId === sales.id);
      if (att) return att;

      // Check leave
      const leave = leaves.find(l => l.userId === sales.id);
      if (leave) {
        return {
          id: `leave-${leave.id}`,
          userId: sales.id,
          date: today,
          status: 'izin',
          checkInTime: null,
          checkOutTime: null,
        };
      }

      return {
        id: `absent-${sales.id}`,
        userId: sales.id,
        date: today,
        status: pastCutoff ? 'absent' : 'pending',
        checkInTime: null,
        checkOutTime: null,
      };
    });

    return result.sort((a, b) => {
      if (a.status !== 'absent' && b.status === 'absent') return -1;
      if (a.status === 'absent' && b.status !== 'absent') return 1;
      return 0;
    });
  }
}
