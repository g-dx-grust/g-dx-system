import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLoading() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900">
            <aside className="hidden h-full w-64 border-r bg-white md:block">
                <div className="flex h-14 items-center border-b px-4">
                    <Skeleton className="h-8 w-28" />
                </div>
                <div className="space-y-4 px-4 py-5">
                    {Array.from({ length: 4 }).map((_, groupIndex) => (
                        <div key={groupIndex} className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    ))}
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center justify-between border-b bg-white px-4">
                    <Skeleton className="h-9 w-40 rounded-md" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="hidden h-9 w-64 rounded-md md:block" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3 md:px-6 md:py-5">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-44" />
                        <Skeleton className="h-4 w-72" />
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </div>
                        <Skeleton className="h-72 rounded-xl" />
                    </div>
                </main>
            </div>
        </div>
    );
}
