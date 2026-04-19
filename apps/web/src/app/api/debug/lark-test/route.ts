import { NextRequest, NextResponse } from 'next/server';
import { getTenantAccessToken } from '@/lib/lark/larkClient';
import { sendGroupMessage } from '@/lib/lark/larkMessaging';
import { isStrictLocalDevelopmentRequest } from '@/shared/server/request-guards';

/**
 * ローカル開発用 Lark 疎通確認エンドポイント
 * 本番では削除すること
 *
 * 使い方:
 *   GET /api/debug/lark-test
 *     → トークン取得のみ確認
 *   GET /api/debug/lark-test?chatId=oc_xxxx&msg=テスト
 *     → 指定チャットにメッセージ送信
 */
export async function GET(req: NextRequest) {
    if (!isStrictLocalDevelopmentRequest(req)) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const chatId = req.nextUrl.searchParams.get('chatId');
    const msg = req.nextUrl.searchParams.get('msg') ?? 'G-DX Lark連携テスト ✅';

    // Step 1: 環境変数確認
    const envCheck = {
        LARK_APP_ID: process.env.LARK_APP_ID ? `set (${process.env.LARK_APP_ID.slice(0, 8)}...)` : 'NOT SET ❌',
        LARK_APP_SECRET: process.env.LARK_APP_SECRET ? 'set ✅' : 'NOT SET ❌',
    };

    // Step 2: トークン取得
    let token: string | null = null;
    let tokenError: string | null = null;
    try {
        token = await getTenantAccessToken();
    } catch (e) {
        tokenError = e instanceof Error ? e.message : String(e);
    }

    // Step 3: メッセージ送信（chatId が指定されている場合）
    let sendResult: string | null = null;
    let sendError: string | null = null;
    if (chatId && token) {
        try {
            await sendGroupMessage(chatId, msg);
            sendResult = 'sent ✅';
        } catch (e) {
            sendError = e instanceof Error ? e.message : String(e);
        }
    }

    return NextResponse.json({
        env: envCheck,
        token: token ? `${token.slice(0, 12)}... ✅` : null,
        tokenError,
        sendResult,
        sendError,
        hint: chatId ? null : 'chatIdパラメータを付けるとメッセージ送信もテストできます: ?chatId=oc_xxxx',
    }, { status: 200 });
}
