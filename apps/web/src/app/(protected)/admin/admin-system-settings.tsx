import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import type { DashboardSectionsConfig } from '@/modules/admin/infrastructure/app-settings-repository';
import { DASHBOARD_SECTION_LABELS } from '@/modules/admin/infrastructure/app-settings-repository';
import { saveDashboardAlertChatSettingsAction, resyncDealNextActionTasksAction, saveDashboardSectionsAction } from './server-actions';

interface AdminSystemSettingsProps {
    dashboardAlertLarkChatId: string | null;
    settingsSaved?: boolean;
    sectionsSaved?: boolean;
    tasksResyncedCount?: number | null;
    isSuperAdmin?: boolean;
    dashboardSections?: DashboardSectionsConfig;
}

export function AdminSystemSettings({
    dashboardAlertLarkChatId,
    settingsSaved = false,
    sectionsSaved = false,
    tasksResyncedCount = null,
    isSuperAdmin = false,
    dashboardSections,
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

                {sectionsSaved ? (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        ダッシュボードのセクション表示設定を保存しました。
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

                {isSuperAdmin && dashboardSections ? (
                    <div className="border-t border-gray-100 pt-6">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium text-gray-900">
                                案件ダッシュボード — セクション表示設定
                            </h2>
                            <p className="text-sm text-gray-500">
                                チェックを外したセクションは全ユーザーのダッシュボードで非表示になります。スーパー管理者のみ変更できます。
                            </p>
                        </div>
                        <form action={saveDashboardSectionsAction} className="mt-4 space-y-4">
                            <div className="grid gap-2 sm:grid-cols-2">
                                {(Object.entries(DASHBOARD_SECTION_LABELS) as [keyof typeof DASHBOARD_SECTION_LABELS, string][]).map(([key, label]) => (
                                    <label
                                        key={key}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            name={`section_${key}`}
                                            defaultChecked={dashboardSections[key]}
                                            className="h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900"
                                        />
                                        <span className="text-sm text-gray-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <SubmitButton pendingText="保存中..." className="bg-gray-900 text-white hover:bg-gray-800">
                                    表示設定を保存
                                </SubmitButton>
                            </div>
                        </form>
                    </div>
                ) : null}

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
