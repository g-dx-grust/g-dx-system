import Link from 'next/link';
import type { PersonalLastWeekCompanyActionGroup } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonalCompanyActionHighlightsProps {
    memberName: string;
    groups: PersonalLastWeekCompanyActionGroup[];
}

function formatActionDate(value: string): string {
    const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'numeric',
        day: 'numeric',
    });
}

export function PersonalCompanyActionHighlights({
    memberName,
    groups,
}: PersonalCompanyActionHighlightsProps) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">先週アクションした会社</CardTitle>
                <CardDescription>
                    {memberName}の先週アクション企業
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {groups.map((group) => (
                    <section
                        key={group.actionType}
                        className="rounded-lg border border-gray-200 bg-gray-50/80 p-4"
                    >
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                                <p className="text-xs text-gray-500">{group.companies.length}社</p>
                            </div>
                            <Badge variant={group.companies.length > 0 ? 'default' : 'outline'}>
                                {group.companies.length}件
                            </Badge>
                        </div>

                        {group.companies.length === 0 ? (
                            <p className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                                該当する会社はありません。
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {group.companies.map((company) => (
                                    <Link
                                        key={`${group.actionType}-${company.companyId}`}
                                        href={`/sales/deals/${company.dealId}`}
                                        className="flex items-start justify-between gap-3 rounded-md border border-white bg-white px-3 py-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-gray-900">
                                                {company.companyName}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {company.dealName}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-gray-400">
                                            <div>{formatActionDate(company.latestActedAt)}</div>
                                            {company.occurrenceCount > 1 ? (
                                                <div>{company.occurrenceCount}回</div>
                                            ) : null}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </CardContent>
        </Card>
    );
}
