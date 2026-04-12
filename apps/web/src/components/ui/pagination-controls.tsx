import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    pathname: string;
    page: number;
    pageSize: number;
    total: number;
    query?: Record<string, string | number | null | undefined>;
}

function buildPageHref(
    pathname: string,
    page: number,
    query: Record<string, string | number | null | undefined>,
): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value === null || value === undefined || value === '') continue;
        params.set(key, String(value));
    }

    if (page > 1) {
        params.set('page', String(page));
    } else {
        params.delete('page');
    }

    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
}

export function PaginationControls({
    pathname,
    page,
    pageSize,
    total,
    query = {},
}: PaginationControlsProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (totalPages <= 1) {
        return null;
    }

    const currentPage = Math.min(page, totalPages);
    const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, total);

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1,
    ).filter((pageNumber) => {
        if (totalPages <= 5) return true;
        if (pageNumber === 1 || pageNumber === totalPages) return true;
        return Math.abs(pageNumber - currentPage) <= 1;
    });

    return (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
                {startItem}-{endItem} / {total}件
            </p>

            <div className="flex flex-wrap items-center gap-2">
                {currentPage > 1 ? (
                    <Button asChild variant="outline" size="sm">
                        <Link href={buildPageHref(pathname, currentPage - 1, query)}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            前へ
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        前へ
                    </Button>
                )}

                <div className="flex flex-wrap items-center gap-1">
                    {pageNumbers.map((pageNumber, index) => {
                        const previousPageNumber = pageNumbers[index - 1];
                        const hasGap =
                            previousPageNumber !== undefined &&
                            pageNumber - previousPageNumber > 1;

                        return (
                            <div key={pageNumber} className="flex items-center gap-1">
                                {hasGap ? (
                                    <span className="px-1 text-sm text-gray-400">…</span>
                                ) : null}
                                {pageNumber === currentPage ? (
                                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-gray-900 px-3 text-sm font-medium text-white">
                                        {pageNumber}
                                    </span>
                                ) : (
                                    <Button asChild variant="outline" size="sm" className="min-w-9 px-3">
                                        <Link href={buildPageHref(pathname, pageNumber, query)}>
                                            {pageNumber}
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {currentPage < totalPages ? (
                    <Button asChild variant="outline" size="sm">
                        <Link href={buildPageHref(pathname, currentPage + 1, query)}>
                            次へ
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        次へ
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
