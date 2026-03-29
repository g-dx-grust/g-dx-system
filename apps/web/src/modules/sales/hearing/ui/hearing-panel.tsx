import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HearingCompletionStatus, HearingRecord } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SubmitButton, FormAutoClose } from '@/components/ui/submit-button';
import { saveHearingAction } from '../server-actions';

interface HearingPanelProps {
    dealId: string;
    record: HearingRecord | null;
    completion: HearingCompletionStatus;
    canEdit: boolean;
}

export function HearingPanel({ dealId, record, completion, canEdit }: HearingPanelProps) {
    const values = {
        gapCurrentSituation: record?.gapCurrentSituation ?? '',
        gapIdealState: record?.gapIdealState ?? '',
        gapEffectGoal: record?.gapEffectGoal ?? '',
        gapAgreementMemo: record?.gapAgreementMemo ?? '',
        targetUserSegments: record?.targetUserSegments ?? '',
        targetIdEstimate: record?.targetIdEstimate !== null && record?.targetIdEstimate !== undefined ? String(record.targetIdEstimate) : '',
        targetPlanCandidate: record?.targetPlanCandidate ?? '',
        scopeIsStandard: record?.scopeIsStandard === true ? 'yes' : record?.scopeIsStandard === false ? 'no' : '',
        scopeOptionRequirements: record?.scopeOptionRequirements ?? '',
        subsidyInsuranceStatus: record?.subsidyInsuranceStatus ?? '',
        subsidyCompanyCategory: record?.subsidyCompanyCategory ?? '',
        subsidyApplicableProgram: record?.subsidyApplicableProgram ?? '',
        subsidyLaborConsultantOk: record?.subsidyLaborConsultantOk === true ? 'yes' : record?.subsidyLaborConsultantOk === false ? 'no' : '',
        decisionApproverInfo: record?.decisionApproverInfo ?? '',
        decisionTimeline: record?.decisionTimeline ?? '',
        decisionNextMeetingAttendee: record?.decisionNextMeetingAttendee ?? '',
        decisionCriteria: record?.decisionCriteria ?? '',
        decisionNextPlan: record?.decisionNextPlan ?? '',
    };

    return (
        <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-gray-900">ヒアリング</p>
                        <Badge variant={completion.allCompleted ? 'success' : 'outline'}>
                            {completion.completedCount} / {completion.totalCount} 完了
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">5つの必須論点を商談詳細上で整理できます。</p>
                    <Progress value={completion.completedCount} max={completion.totalCount} className="max-w-sm" />
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="border-t border-gray-100 px-6 pb-6 pt-5">
                {!canEdit ? (
                    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        現在のロールではヒアリングを編集できません。内容の閲覧のみ可能です。
                    </div>
                ) : null}

                <form action={saveHearingAction} className="space-y-6">
                    <FormAutoClose />
                    <input type="hidden" name="dealId" value={dealId} />

                    <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-100">
                        <HearingSection title="1. GAP" completedName="gapCompleted" completed={completion.gapCompleted}>
                            <Field label="現状">
                                <textarea name="gapCurrentSituation" defaultValue={values.gapCurrentSituation} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="理想状態">
                                <textarea name="gapIdealState" defaultValue={values.gapIdealState} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="効果・目標">
                                <textarea name="gapEffectGoal" defaultValue={values.gapEffectGoal} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="合意メモ">
                                <textarea name="gapAgreementMemo" defaultValue={values.gapAgreementMemo} rows={3} className={textareaClassName} />
                            </Field>
                        </HearingSection>

                        <HearingSection title="2. TARGET" completedName="targetCompleted" completed={completion.targetCompleted}>
                            <Field label="対象ユーザー">
                                <textarea name="targetUserSegments" defaultValue={values.targetUserSegments} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="ID想定数">
                                <input name="targetIdEstimate" type="number" min="0" defaultValue={values.targetIdEstimate} className={inputClassName} />
                            </Field>
                            <Field label="候補プラン">
                                <textarea name="targetPlanCandidate" defaultValue={values.targetPlanCandidate} rows={3} className={textareaClassName} />
                            </Field>
                        </HearingSection>

                        <HearingSection title="3. SCOPE" completedName="scopeCompleted" completed={completion.scopeCompleted}>
                            <Field label="標準スコープか">
                                <select name="scopeIsStandard" defaultValue={values.scopeIsStandard} className={inputClassName}>
                                    <option value="">未設定</option>
                                    <option value="yes">標準</option>
                                    <option value="no">個別調整あり</option>
                                </select>
                            </Field>
                            <Field label="オプション要件">
                                <textarea name="scopeOptionRequirements" defaultValue={values.scopeOptionRequirements} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="技術同席が必要">
                                <label className="inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" name="scopeTechLiaisonFlag" value="1" defaultChecked={record?.scopeTechLiaisonFlag ?? false} className="h-4 w-4 rounded border-gray-300" />
                                    必要
                                </label>
                            </Field>
                        </HearingSection>

                        <HearingSection title="4. SUBSIDY" completedName="subsidyCompleted" completed={completion.subsidyCompleted}>
                            <Field label="保険・助成金状況">
                                <textarea name="subsidyInsuranceStatus" defaultValue={values.subsidyInsuranceStatus} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="会社区分">
                                <input name="subsidyCompanyCategory" defaultValue={values.subsidyCompanyCategory} className={inputClassName} />
                            </Field>
                            <Field label="対象制度">
                                <textarea name="subsidyApplicableProgram" defaultValue={values.subsidyApplicableProgram} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="社労士確認">
                                <select name="subsidyLaborConsultantOk" defaultValue={values.subsidyLaborConsultantOk} className={inputClassName}>
                                    <option value="">未設定</option>
                                    <option value="yes">確認済み</option>
                                    <option value="no">未確認</option>
                                </select>
                            </Field>
                        </HearingSection>

                        <HearingSection title="5. DECISION" completedName="decisionCompleted" completed={completion.decisionCompleted}>
                            <Field label="決裁者情報">
                                <textarea name="decisionApproverInfo" defaultValue={values.decisionApproverInfo} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="決裁タイムライン">
                                <input name="decisionTimeline" type="date" defaultValue={values.decisionTimeline} className={inputClassName} />
                            </Field>
                            <Field label="次回同席者">
                                <input name="decisionNextMeetingAttendee" defaultValue={values.decisionNextMeetingAttendee} className={inputClassName} />
                            </Field>
                            <Field label="判断基準">
                                <textarea name="decisionCriteria" defaultValue={values.decisionCriteria} rows={3} className={textareaClassName} />
                            </Field>
                            <Field label="次回プラン">
                                <textarea name="decisionNextPlan" defaultValue={values.decisionNextPlan} rows={3} className={textareaClassName} />
                            </Field>
                        </HearingSection>
                    </fieldset>

                    {canEdit ? (
                        <div className="flex justify-end">
                            <SubmitButton className="bg-blue-600 text-white hover:bg-blue-700">
                                ヒアリングを保存
                            </SubmitButton>
                        </div>
                    ) : null}
                </form>
            </div>
        </details>
    );
}

function HearingSection({
    title,
    completedName,
    completed,
    children,
}: {
    title: string;
    completedName: string;
    completed: boolean;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    <Badge variant={completed ? 'success' : 'outline'}>
                        {completed ? '完了' : '未完了'}
                    </Badge>
                </div>
                <label className="inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name={completedName} value="1" defaultChecked={completed} className="h-4 w-4 rounded border-gray-300" />
                    この論点を完了にする
                </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="grid gap-2 text-sm font-medium text-gray-700">
            {label}
            {children}
        </label>
    );
}

const inputClassName =
    'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-gray-50';

const textareaClassName =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-gray-50';
