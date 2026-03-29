export type RollingKpiPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

export interface RollingPeriodBounds {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    label: string;
}

export const ALL_ROLLING_PERIODS: RollingKpiPeriod[] = ['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];

function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addUTCDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

// Returns a Date whose UTC y/m/d represents today in JST (UTC+9)
export function getTodayInJST(): Date {
    const now = new Date();
    const jstMs = now.getTime() + 9 * 60 * 60 * 1000;
    const jst = new Date(jstMs);
    return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()));
}

export function getRollingPeriodBounds(period: RollingKpiPeriod, todayJST?: Date): RollingPeriodBounds {
    const today = todayJST ?? getTodayInJST();

    switch (period) {
        case 'thisWeek': {
            const dow = today.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const daysSinceMonday = dow === 0 ? 6 : dow - 1;
            const monday = addUTCDays(today, -daysSinceMonday);
            const sunday = addUTCDays(monday, 6);
            const mm = monday.getUTCMonth() + 1;
            const md = monday.getUTCDate();
            const sm = sunday.getUTCMonth() + 1;
            const sd = sunday.getUTCDate();
            return {
                startDate: toDateStr(monday.getUTCFullYear(), mm, md),
                endDate: toDateStr(sunday.getUTCFullYear(), sm, sd),
                label: `今週 (${mm}/${md}〜${sm}/${sd})`,
            };
        }
        case 'lastWeek': {
            const dow = today.getUTCDay();
            const daysSinceMonday = dow === 0 ? 6 : dow - 1;
            const thisMonday = addUTCDays(today, -daysSinceMonday);
            const lastMonday = addUTCDays(thisMonday, -7);
            const lastSunday = addUTCDays(thisMonday, -1);
            const lmm = lastMonday.getUTCMonth() + 1;
            const lmd = lastMonday.getUTCDate();
            const lsm = lastSunday.getUTCMonth() + 1;
            const lsd = lastSunday.getUTCDate();
            return {
                startDate: toDateStr(lastMonday.getUTCFullYear(), lmm, lmd),
                endDate: toDateStr(lastSunday.getUTCFullYear(), lsm, lsd),
                label: `先週 (${lmm}/${lmd}〜${lsm}/${lsd})`,
            };
        }
        case 'thisMonth': {
            const year = today.getUTCFullYear();
            const month = today.getUTCMonth() + 1;
            const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
            return {
                startDate: toDateStr(year, month, 1),
                endDate: toDateStr(year, month, lastDay),
                label: `今月 (${year}年${month}月)`,
            };
        }
        case 'lastMonth': {
            const lastMonthDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
            const ly = lastMonthDate.getUTCFullYear();
            const lm = lastMonthDate.getUTCMonth() + 1;
            const lastDay = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
            return {
                startDate: toDateStr(ly, lm, 1),
                endDate: toDateStr(ly, lm, lastDay),
                label: `先月 (${ly}年${lm}月)`,
            };
        }
    }
}
