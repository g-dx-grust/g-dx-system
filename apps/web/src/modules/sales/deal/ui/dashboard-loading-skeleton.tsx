import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardContentSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index} className="border-gray-200 bg-white shadow-sm">
                        <CardHeader className="space-y-2 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-2 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardChartSkeleton />
                <DashboardChartSkeleton />
            </div>

            <DashboardChartSkeleton className="min-h-[320px]" />

            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-56" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-md border border-gray-200 px-3 py-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="mt-3 h-3 w-5/6" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export function DashboardPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <DashboardContentSkeleton />
        </div>
    );
}

function DashboardChartSkeleton({ className = 'min-h-[260px]' }: { className?: string }) {
    return (
        <Card className={`border-gray-200 shadow-sm ${className}`}>
            <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
