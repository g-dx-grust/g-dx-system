'use client';

import { useMemo, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompanyImportPreview, CompanyImportResult, TsrFieldMapping } from '../domain/company-import';
import { executeTsrCompanyImportAction, previewTsrCompanyImportAction } from '../server-actions';

interface CompanyImportProps {
    fieldMappings: TsrFieldMapping[];
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return '処理中にエラーが発生しました。';
}

function badgeClassName(kind: 'new' | 'duplicate' | 'skip' | 'success' | 'failure') {
    switch (kind) {
        case 'new':
        case 'success':
            return 'bg-emerald-100 text-emerald-700';
        case 'duplicate':
            return 'bg-amber-100 text-amber-800';
        case 'skip':
            return 'bg-gray-100 text-gray-700';
        case 'failure':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

function statusLabel(kind: 'new' | 'duplicate' | 'skip' | 'success' | 'failure') {
    switch (kind) {
        case 'new':
            return '新規';
        case 'duplicate':
            return '重複';
        case 'skip':
            return 'スキップ';
        case 'success':
            return '成功';
        case 'failure':
            return '失敗';
        default:
            return kind;
    }
}

export function CompanyImport({ fieldMappings }: CompanyImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<CompanyImportPreview | null>(null);
    const [result, setResult] = useState<CompanyImportResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const sortedMappings = useMemo(
        () => fieldMappings.filter((mapping) => mapping.tsrFieldName).slice(),
        [fieldMappings],
    );

    function handleFileChange(nextFile: File | null) {
        setFile(nextFile);
        setPreview(null);
        setResult(null);
        setErrorMessage(null);
    }

    function handlePreview() {
        if (!file) {
            setErrorMessage('CSV ファイルを選択してください。');
            return;
        }

        setErrorMessage(null);
        setResult(null);

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.set('file', file);
                const nextPreview = await previewTsrCompanyImportAction(formData);
                setPreview(nextPreview);
            } catch (error) {
                setPreview(null);
                setErrorMessage(getErrorMessage(error));
            }
        });
    }

    function handleImport() {
        if (!file || !preview) {
            setErrorMessage('先にプレビューを実行してください。');
            return;
        }

        setErrorMessage(null);

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.set('file', file);
                const importResult = await executeTsrCompanyImportAction(formData);
                setResult(importResult);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
            }
        });
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">CSV アップロード</CardTitle>
                    <CardDescription>
                        TSR 企業リスト CSV を選択し、先頭 10 件のプレビューと重複判定を確認してから一括登録します。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-5">
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            TSR CSV ファイル
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                            />
                        </label>
                        {file ? (
                            <p className="mt-3 text-xs text-gray-500">
                                選択中: {file.name}
                            </p>
                        ) : null}
                    </div>

                    {errorMessage ? (
                        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={handlePreview}
                            disabled={!file || isPending}
                            className="gap-2 bg-blue-600 px-6 text-white hover:bg-blue-700"
                        >
                            <Upload className="h-4 w-4" />
                            {isPending ? '解析中...' : 'プレビューを表示'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleImport}
                            disabled={!file || !preview || isPending}
                            className="px-6"
                        >
                            {isPending ? '実行中...' : '確認して一括インポート'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">カラムマッピング</CardTitle>
                    <CardDescription>
                        `masters/tsr_field_mapping.csv` の定義に従って取込対象を判定します。
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">TSR項目名</th>
                                    <th className="px-4 py-3 font-medium">システム格納先</th>
                                    <th className="px-4 py-3 font-medium">優先度</th>
                                    <th className="px-4 py-3 font-medium">備考</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                {sortedMappings.map((mapping) => (
                                    <tr key={`${mapping.tsrFieldName}-${mapping.systemTarget}`}>
                                        <td className="px-4 py-3">{mapping.tsrFieldName}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{mapping.systemTarget}</td>
                                        <td className="px-4 py-3">{mapping.priority}</td>
                                        <td className="px-4 py-3">{mapping.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {preview ? (
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg text-gray-900">プレビュー</CardTitle>
                        </div>
                        <CardDescription>
                            {preview.fileName} / 事業部: {preview.activeBusinessScope}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-3 md:grid-cols-4">
                            <SummaryCard label="総件数" value={String(preview.summary.totalRows)} />
                            <SummaryCard label="新規" value={String(preview.summary.newCount)} />
                            <SummaryCard label="重複" value={String(preview.summary.duplicateCount)} />
                            <SummaryCard label="スキップ" value={String(preview.summary.skipCount)} />
                        </div>

                        <div className="overflow-x-auto rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">行</th>
                                        <th className="px-4 py-3 font-medium">会社名</th>
                                        <th className="px-4 py-3 font-medium">業種</th>
                                        <th className="px-4 py-3 font-medium">電話番号</th>
                                        <th className="px-4 py-3 font-medium">状態</th>
                                        <th className="px-4 py-3 font-medium">判定メモ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {preview.previewRows.map((row) => (
                                        <tr key={`${row.rowNumber}-${row.normalizedName ?? row.name ?? 'row'}`}>
                                            <td className="px-4 py-3">{row.rowNumber}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.name ?? '-'}</td>
                                            <td className="px-4 py-3">{row.industry ?? '-'}</td>
                                            <td className="px-4 py-3">{row.phone ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClassName(row.status)}`}>
                                                    {statusLabel(row.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{row.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {result ? (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">インポート結果</CardTitle>
                        <CardDescription>
                            {result.fileName} / 事業部: {result.activeBusinessScope}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-3 md:grid-cols-4">
                            <SummaryCard label="成功" value={String(result.summary.successCount)} />
                            <SummaryCard label="失敗" value={String(result.summary.failureCount)} />
                            <SummaryCard label="重複" value={String(result.summary.duplicateCount)} />
                            <SummaryCard label="スキップ" value={String(result.summary.skipCount)} />
                        </div>

                        <div className="overflow-x-auto rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">行</th>
                                        <th className="px-4 py-3 font-medium">会社名</th>
                                        <th className="px-4 py-3 font-medium">結果</th>
                                        <th className="px-4 py-3 font-medium">詳細</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {result.logs.map((log) => (
                                        <tr key={`${log.rowNumber}-${log.name}-${log.status}`}>
                                            <td className="px-4 py-3">{log.rowNumber}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{log.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClassName(log.status)}`}>
                                                    {statusLabel(log.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{log.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
    );
}
