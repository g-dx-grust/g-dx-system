'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StageBarChartProps {
    data: { stageName: string; count: number; totalAmount: number; color: string }[];
}

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}万`;
    return amount.toLocaleString();
}

export function StageBarChart({ data }: StageBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stageName" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value}件`, '件数']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
