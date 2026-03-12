'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OwnerBarChartProps {
    data: { ownerName: string; totalDeals: number; activeDeals: number; contractedDeals: number }[];
}

export function OwnerBarChart({ data }: OwnerBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="ownerName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="totalDeals" name="全案件" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeDeals" name="進行中" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contractedDeals" name="契約済" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
