import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createAllianceAction } from '@/modules/sales/alliance/server-actions';

const selectClassName =
    'h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface AllianceDefaults {
    contactPersonName?: string;
    contactPersonRole?: string;
    notes?: string;
}

interface AllianceCreateFormProps {
    defaults?: AllianceDefaults;
    fromMeetingId?: string;
}

export function AllianceCreateForm({ defaults, fromMeetingId }: AllianceCreateFormProps = {}) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>アライアンス登録</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={createAllianceAction} className="grid gap-4 md:grid-cols-2">
                    {fromMeetingId ? (
                        <input type="hidden" name="fromMeeting" value={fromMeetingId} />
                    ) : null}
                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        名前 <span className="text-red-500">*</span>
                        <Input name="name" required placeholder="例: 株式会社パートナー or 山田 太郎" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        種別
                        <select name="allianceType" defaultValue="COMPANY" className={selectClassName}>
                            <option value="COMPANY">法人</option>
                            <option value="INDIVIDUAL">個人</option>
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        ステータス
                        <select name="relationshipStatus" defaultValue="PROSPECT" className={selectClassName}>
                            <option value="PROSPECT">候補</option>
                            <option value="ACTIVE">アクティブ</option>
                            <option value="INACTIVE">非アクティブ</option>
                        </select>
                    </label>

                    <div className="md:col-span-2">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">連絡先情報</p>
                    </div>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        担当者名
                        <Input name="contactPersonName" placeholder="例: 山田 太郎" defaultValue={defaults?.contactPersonName} />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        役職
                        <Input name="contactPersonRole" placeholder="例: 営業部長" defaultValue={defaults?.contactPersonRole} />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        メールアドレス
                        <Input name="contactPersonEmail" type="email" placeholder="example@company.com" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        電話番号
                        <Input name="contactPersonPhone" placeholder="03-1234-5678" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        合意・約束内容
                        <textarea
                            name="agreementSummary"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="紹介条件や報酬内容など"
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        備考
                        <textarea
                            name="notes"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="その他メモ..."
                            defaultValue={defaults?.notes}
                        />
                    </label>

                    <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end">
                        <Button asChild variant="outline" className="w-full px-6 md:w-auto">
                            <Link href="/sales/alliances">キャンセル</Link>
                        </Button>
                        <SubmitButton className="w-full bg-blue-600 px-6 text-white hover:bg-blue-700 md:w-auto" pendingText="登録中...">
                            アライアンスを登録
                        </SubmitButton>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
