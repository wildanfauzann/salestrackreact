import { db } from '../db';
import { user, attendance, deal, globalTarget, activity } from '../db/schema';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
export class DashboardService {
    static async getSalesDashboard(userId) {
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        // 1. Current Month Target (Global)
        const target = await db
            .select()
            .from(globalTarget)
            .where(and(eq(globalTarget.month, month), eq(globalTarget.year, year)))
            .limit(1);
        const targetAmount = target.length > 0 ? parseFloat(target[0].targetAmount) : 0;
        // 2. Closings this month
        const closings = await db
            .select({ total: sql `sum(cast(${deal.value} as numeric))` })
            .from(deal)
            .where(and(eq(deal.userId, userId), eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none'])));
        const closingValue = closings[0]?.total || 0;
        const percentage = targetAmount > 0 ? (closingValue / targetAmount) * 100 : 0;
        // 3. Trend Penjualan (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        const closedDealsTrend = await db
            .select({
            month: sql `extract(month from ${deal.closedAt})`,
            count: sql `count(*)`,
        })
            .from(deal)
            .where(and(eq(deal.userId, userId), eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none']), gte(deal.closedAt, sixMonthsAgo)))
            .groupBy(sql `extract(month from ${deal.closedAt})`);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const trendData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1;
            const found = closedDealsTrend.find((row) => Number(row.month) === m);
            trendData.push({
                name: monthNames[m - 1],
                deals: found ? Number(found.count) : 0,
            });
        }
        return {
            targetAmount,
            closingValue,
            percentage: Math.min(percentage, 100).toFixed(1),
            trendData,
        };
    }
    static async getManagerDashboard(month, year, period = '6months') {
        const today = new Date().toISOString().split('T')[0];
        const referenceDate = new Date();
        if (year)
            referenceDate.setFullYear(year);
        if (month)
            referenceDate.setMonth(month - 1);
        // 1. Active Sales Count
        const activeSales = await db
            .select({ count: sql `count(*)` })
            .from(user)
            .where(and(eq(user.role, 'sales'), eq(user.status, 'active')));
        // 2. Total Attendance Today
        const attendanceToday = await db
            .select({ count: sql `count(*)` })
            .from(attendance)
            .where(eq(attendance.date, today));
        // 3. Total Closings (All time, v1 simplified)
        const closings = await db
            .select({ total: sql `sum(cast(${deal.value} as numeric))` })
            .from(deal)
            .where(and(eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none'])));
        // 4. Deals Pending Approval
        const pendingDeals = await db
            .select({ count: sql `count(*)` })
            .from(deal)
            .where(eq(deal.approvalStatus, 'pending'));
        // 5. Trend Penjualan
        const trendData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        if (period === 'month') {
            const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
            const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
            const closedDealsTrend = await db
                .select({
                day: sql `extract(day from ${deal.closedAt})`,
                count: sql `count(*)`,
                revenue: sql `sum(cast(${deal.value} as numeric))`,
            })
                .from(deal)
                .where(and(eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none']), gte(deal.closedAt, startOfMonth), lte(deal.closedAt, endOfMonth)))
                .groupBy(sql `extract(day from ${deal.closedAt})`);
            const daysInMonth = endOfMonth.getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const found = closedDealsTrend.find((row) => Number(row.day) === i);
                trendData.push({
                    name: `${i} ${monthNames[referenceDate.getMonth()]}`,
                    deals: found ? Number(found.count) : 0,
                    revenue: found ? Number(found.revenue) : 0,
                });
            }
        }
        else {
            const is1Year = period === '1year';
            const monthsBack = is1Year ? 11 : 5;
            const periodAgo = new Date(referenceDate);
            periodAgo.setMonth(periodAgo.getMonth() - monthsBack);
            periodAgo.setDate(1);
            periodAgo.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
            const closedDealsTrend = await db
                .select({
                month: sql `extract(month from ${deal.closedAt})`,
                year: sql `extract(year from ${deal.closedAt})`,
                count: sql `count(*)`,
                revenue: sql `sum(cast(${deal.value} as numeric))`,
            })
                .from(deal)
                .where(and(eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none']), gte(deal.closedAt, periodAgo), lte(deal.closedAt, endOfMonth)))
                .groupBy(sql `extract(year from ${deal.closedAt})`, sql `extract(month from ${deal.closedAt})`);
            for (let i = monthsBack; i >= 0; i--) {
                const d = new Date(referenceDate);
                d.setMonth(d.getMonth() - i);
                const m = d.getMonth() + 1;
                const y = d.getFullYear();
                const found = closedDealsTrend.find((row) => Number(row.month) === m && Number(row.year) === y);
                trendData.push({
                    name: monthNames[m - 1] + (is1Year ? ` '${y.toString().slice(-2)}` : ''),
                    deals: found ? Number(found.count) : 0,
                    revenue: found ? Number(found.revenue) : 0,
                });
            }
        }
        // 6. Top 5 Sales (This Month)
        const currentMonth = referenceDate.getMonth() + 1;
        const currentYear = referenceDate.getFullYear();
        const topSalesData = await db
            .select({
            id: user.id,
            name: user.name,
            closings: sql `count(${deal.id})::int`,
            revenue: sql `sum(cast(${deal.value} as numeric))`,
        })
            .from(deal)
            .innerJoin(user, eq(deal.userId, user.id))
            .where(and(eq(deal.stage, 'closing'), inArray(deal.approvalStatus, ['approved', 'none']), sql `extract(month from ${deal.closedAt}) = ${currentMonth}`, sql `extract(year from ${deal.closedAt}) = ${currentYear}`))
            .groupBy(user.id, user.name)
            .orderBy(desc(sql `count(${deal.id})`));
        // 7. Funnel Data (Deals by Stage this month)
        const funnelQuery = await db
            .select({
            stage: deal.stage,
            count: sql `count(${deal.id})::int`,
        })
            .from(deal)
            .where(and(sql `extract(month from ${deal.createdAt}) = ${currentMonth}`, sql `extract(year from ${deal.createdAt}) = ${currentYear}`))
            .groupBy(deal.stage);
        const funnelData = {
            prospek: funnelQuery.find(d => d.stage === 'prospek')?.count || 0,
            negosiasi: funnelQuery.find(d => d.stage === 'negosiasi')?.count || 0,
            closing: funnelQuery.find(d => d.stage === 'closing')?.count || 0,
            lose: funnelQuery.find(d => d.stage === 'lose')?.count || 0,
        };
        // 8. Activity Data (Count by type this month)
        const activityQuery = await db
            .select({
            type: activity.type,
            count: sql `count(${activity.id})::int`,
        })
            .from(activity)
            .where(and(sql `extract(month from ${activity.activityDate}) = ${currentMonth}`, sql `extract(year from ${activity.activityDate}) = ${currentYear}`))
            .groupBy(activity.type);
        const activityData = activityQuery.map(a => ({
            name: a.type.charAt(0).toUpperCase() + a.type.slice(1),
            value: a.count
        }));
        // 9. Total Target Sales this month
        const targetData = await db
            .select()
            .from(globalTarget)
            .where(and(eq(globalTarget.month, currentMonth), eq(globalTarget.year, currentYear)))
            .limit(1);
        const totalTargetValue = targetData.length > 0 ? parseFloat(targetData[0].targetAmount) : 0;
        return {
            activeSales: activeSales[0]?.count || 0,
            attendanceToday: attendanceToday[0]?.count || 0,
            totalClosingValue: closings[0]?.total || 0,
            pendingDealsCount: pendingDeals[0]?.count || 0,
            trendData,
            topSales: topSalesData,
            funnelData,
            activityData,
            totalTargetValue,
        };
    }
}
// force reload
