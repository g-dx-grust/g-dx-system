import { NextResponse } from 'next/server';
import { globalSearch } from '@/modules/search/infrastructure/search-repository';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export async function GET(request: Request) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    if (!q || q.length < 2) {
        return NextResponse.json({ success: true, data: [] });
    }

    const results = await globalSearch(q, session.activeBusinessScope, 5);
    return NextResponse.json({ success: true, data: results });
}
