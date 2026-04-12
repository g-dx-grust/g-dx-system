import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import { saveDashboardAlertChatSettingsAction, resyncDealNextActionTasksAction } from './server-actions';

interface AdminSystemSettingsProps {
    dashboardAlertLarkChatId: string | null;
    settingsSaved?: boolean;
    tasksResyncedCount?: number | null;
}

export function AdminSystemSettings({
    dashboardAlertLarkChatId,
    settingsSaved = false,
    tasksResyncedCount = null,
}: AdminSystemSettingsProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">運用設定</CardTitle>
                <CardDescription>商談ダッシュボード通知と次回アクション運用の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {settingsSaved ? (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        ダッシュボード通知の送信先を保存しました。
                    </div>
                ) : null}

                {tasksResyncedCount !== null ? (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        次回アクションタスクを再同期しました。対象: {tasksResyncedCount}件
                    </div>
                ) : null}

                <form action={saveDashboardAlertChatSettingsAction} className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-sm font-medium text-gray-900">Lark通知先</h2>
                        <p className="text-sm text-gray-500">
                            毎日 8:55 JST に「次回アクション未設定」と「期限超過」の案件をまとめて送信します。毎週日曜 22:00 JST に AI 週次サマリーも同じチャットへ送信されます。
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="dashboardAlertLarkChatId">
                            グループチャットID
                        </label>
                        <input
                            id="dashboardAlertLarkChatId"
                            name="dashboardAlertLarkChatId"
                            defaultValue={dashboardAlertLarkChatId ?? ''}
                            placeholder="oc_xxxxxxxxxxxxxxxx"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <p className="text-xs text-gray-500">空欄で保存すると、この通知は停止します。</p>
                    </div>
                    <div className="flex justify-end">
                        <SubmitButton pendingText="保存中..." className="bg-gray-900 text-white hover:bg-gray-800">
                            保存する
                        </SubmitButton>
                    </div>
                </form>

                <div className="border-t border-gray-100 pt-6">
                    <div className="space-y-1">
                        <h2 className="text-sm font-medium text-gray-900">次回アクションタスク再同期</h2>
                        <p className="text-sm text-gray-500">
                            既存商談の次回アクションを tasks テーブルへ再同期します。今回追加したタスク運用を既存データにも反映したいときに使います。
                        </p>
                    </div>
                    <form action={resyncDealNextActionTasksAction} className="mt-4 flex justify-end">
                        <SubmitButton pendingText="再同期中..." variant="outline">
                            再同期を実行
                        </SubmitButton>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
