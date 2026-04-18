'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CompanyBarChartProps {
    data: { companyName: string; totalAmount: number; activeDeals: number }[];
}

function formatYAxis(value: number): string {
    if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}億`;
    if (value >= 10_000) return `${Math.round(value / 10_000)}万`;
    return String(value);
}

function formatTooltip(value: number): string {
    if (value >= 100_000_000) return `¥${(value / 100_000_000).toFixed(1)}億`;
    if (value >= 10_000) return `¥${Math.round(value / 10_000).toLocaleString()}万`;
    return `¥${value.toLocaleString()}`;
}

export function CompanyBarChart({ data }: CompanyBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatYAxis} />
                <YAxis type="category" dataKey="companyName" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value) => [formatTooltip(typeof value === 'number' ? value : 0), '進行中金額']} />
                <Bar dataKey="totalAmount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
