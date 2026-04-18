// Moved to /api/v1/auth/lark/start – this stub exists only to avoid 404s on
// any hard-coded references to the old path.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.redirect(new URL('/api/v1/auth/lark/start', process.env.APP_URL ?? 'http://localhost:3000'));
}
