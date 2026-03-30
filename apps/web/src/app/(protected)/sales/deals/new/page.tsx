import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BusinessScope, type DealStageKey, type PipelineStageDefinition } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import {
    listAcquisitionMethodOptions,
    listJetCreditStatusOptions,
    listJetDealStatusOptions,
    listJetStatus2Options,
    listMasterPipelineStageOptions,
    type MasterPipelineStageOption,
} from '@/modules/master/infrastructure/form-master-repository';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { DealCreateForm } from '@/modules/sales/deal/ui/deal-create-form';
import { isAppError } from '@/shared/server/errors';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewDealPageProps {
    searchParams?: {
        error?: string;
    };
}

function getErrorMessage(errorCode?: string): string | undefined {
    switch (errorCode) {
        case 'validation':
            return '会社・ステージは必須です。';
        case 'pipeline':
            return '利用できるパイプラインが見つかりません。設定を確認してください。';
        default:
            return undefined;
    }
}

function isLostMasterStage(stage: Pick<MasterPipelineStageOption, 'key' | 'label'>): boolean {
    const normalized = `${stage.key} ${stage.label}`.toLowerCase();
    return normalized.includes('lost') || stage.label.includes('失注');
}

function isWonMasterStage(stage: Pick<MasterPipelineStageOption, 'key' | 'label'>): boolean {
    const normalized = `${stage.key} ${stage.label}`.toLowerCase();
    return (
        normalized.includes('won') ||
        normalized.includes('contract') ||
        stage.label.includes('成約') ||
        stage.label.includes('契約')
    );
}

function buildStageOptions(
    pipelineStages: PipelineStageDefinition[],
    masterStages: MasterPipelineStageOption[],
): Array<{ key: DealStageKey; label: string }> {
    const labelByKey = new Map<DealStageKey, string>();

    const openPipelineStages = pipelineStages.filter(
        (stage) => stage.key !== 'LOST' && stage.key !== 'CONTRACTED',
    );
    const openMasterStages = masterStages.filter(
        (stage) => !stage.isClosedStage && !isLostMasterStage(stage) && !isWonMasterStage(stage),
    );

    openPipelineStages.forEach((stage, index) => {
        labelByKey.set(stage.key, openMasterStages[index]?.label ?? stage.label);
    });

    const lostStage = pipelineStages.find((stage) => stage.key === 'LOST');
    if (lostStage) {
        labelByKey.set(lostStage.key, masterStages.find(isLostMasterStage)?.label ?? lostStage.label);
    }

    const contractedStage = pipelineStages.find((stage) => stage.key === 'CONTRACTED');
    if (contractedStage) {
        labelByKey.set(
            contractedStage.key,
            masterStages.find(isWonMasterStage)?.label ?? contractedStage.label,
        );
    }

    return pipelineStages.map((stage) => ({
        key: stage.key,
        label: labelByKey.get(stage.key) ?? stage.label,
    }));
}

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'sales.deal.create');
    } catch {
        redirect('/unauthorized');
    }

    const isWaterSavingScope = session.activeBusinessScope === BusinessScope.WATER_SAVING;

    let pipeline;
    let companies;
    let acquisitionMethods;
    let masterStages;
    let jetDealStatuses;
    let jetCreditStatuses;
    let jetStatus2Options;

    try {
        [
            pipeline,
            companies,
            acquisitionMethods,
            masterStages,
            jetDealStatuses,
            jetCreditStatuses,
            jetStatus2Options,
        ] = await Promise.all([
            getPipeline(),
            listCompanies({ pageSize: 100 }),
            listAcquisitionMethodOptions(session.activeBusinessScope),
            listMasterPipelineStageOptions(session.activeBusinessScope),
            isWaterSavingScope ? listJetDealStatusOptions() : Promise.resolve([]),
            isWaterSavingScope ? listJetCreditStatusOptions() : Promise.resolve([]),
            isWaterSavingScope ? listJetStatus2Options() : Promise.resolve([]),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">案件登録</h1>
                    <p className="text-sm text-gray-500">案件登録</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/deals">一覧へ戻る</Link>
                </Button>
            </div>
            <DealCreateForm
                companies={companies.data.map((company) => ({ id: company.id, name: company.name }))}
                stages={buildStageOptions(pipeline.stages, masterStages)}
                acquisitionMethods={acquisitionMethods}
                showJetFields={isWaterSavingScope}
                jetDealStatuses={jetDealStatuses}
                jetCreditStatuses={jetCreditStatuses}
                jetStatus2Options={jetStatus2Options}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
