import { db } from '../db';
import { attendance, officeSettings, user } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkGeofence } from '../lib/geofence';
export class AttendanceService {
    static async checkIn(userId, latitude, longitude, photoUrl) {
        // 1. Get office settings
        const offices = await db.select().from(officeSettings).where(eq(officeSettings.isActive, true));
        let isOutsideGeofence = false;
        let minDistance = 0;
        if (offices.length > 0) {
            // Find nearest office
            minDistance = Infinity;
            for (const office of offices) {
                const { isOutside, distanceMeters } = checkGeofence(latitude, longitude, parseFloat(office.latitude), parseFloat(office.longitude), office.radiusMeters);
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
        // Check if time is between 08:00 and 09:00
        if (hours < 8 || hours > 9 || (hours === 9 && minutes > 0)) {
            throw new Error('Check-in hanya dapat dilakukan antara pukul 08:00 hingga 09:00');
        }
        let currentStatus = 'hadir';
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
    static async checkOut(userId) {
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
    static async getToday(userId) {
        const today = new Date().toISOString().split('T')[0];
        const result = await db
            .select()
            .from(attendance)
            .where(and(eq(attendance.userId, userId), eq(attendance.date, today)))
            .limit(1);
        return result[0];
    }
    static async getHistory(userId) {
        const userRecord = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        if (!userRecord[0])
            return [];
        const attendances = await db
            .select()
            .from(attendance)
            .where(eq(attendance.userId, userId))
            .orderBy(desc(attendance.date));
        const startDate = userRecord[0].createdAt ? new Date(userRecord[0].createdAt) : new Date();
        startDate.setHours(0, 0, 0, 0);
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
            }
            else if (!isWeekend) {
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
            current.setDate(current.getDate() - 1);
        }
        return result;
    }
    static async getTeamToday() {
        const today = new Date().toISOString().split('T')[0];
        const activeSales = await db.select().from(user).where(and(eq(user.role, 'sales'), eq(user.status, 'active')));
        const attendances = await db.select().from(attendance).where(eq(attendance.date, today));
        const now = new Date();
        const pastCutoff = now.getHours() >= 9 || (now.getHours() === 9 && now.getMinutes() > 0);
        const result = activeSales.map(sales => {
            const att = attendances.find(a => a.userId === sales.id);
            if (att)
                return att;
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
            if (a.status !== 'absent' && b.status === 'absent')
                return -1;
            if (a.status === 'absent' && b.status !== 'absent')
                return 1;
            return 0;
        });
    }
}
