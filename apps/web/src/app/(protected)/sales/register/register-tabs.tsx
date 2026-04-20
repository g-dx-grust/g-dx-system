'use client';

import { useState } from 'react';
import type { DealStageKey } from '@g-dx/contracts';
import { DealCreateForm } from '@/modules/sales/deal/ui/deal-create-form';
import { AllianceCreateForm } from '@/modules/sales/alliance/ui/alliance-create-form';
import { MeetingCreateForm } from '@/modules/sales/meeting/ui/meeting-create-form';
import { cn } from '@/lib/utils';

type TabKey = 'deal' | 'alliance' | 'meeting';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'deal', label: '商談' },
    { key: 'alliance', label: 'アライアンス' },
    { key: 'meeting', label: '面談' },
];

interface DealProps {
    companies: { id: string; name: string }[];
    stages: { key: DealStageKey; label: string }[];
    acquisitionMethods: { value: string; label: string }[];
    showJetFields: boolean;
    jetDealStatuses: { value: string; label: string }[];
    jetCreditStatuses: { value: string; label: string }[];
    jetStatus2Options: { value: string; label: string }[];
    allianceOptions: { value: string; label: string }[];
    users: { id: string; name: string }[];
    currentUserId: string;
}

interface MeetingProps {
    companies: { value: string; label: string }[];
    alliances: { value: string; label: string }[];
    users: { id: string; name: string }[];
    currentUserId: string;
    onCreateCompany?: (name: string) => Promise<{ id: string; label: string }>;
    onCreateAlliance?: (name: string) => Promise<{ id: string; label: string }>;
}

interface RegisterTabsProps {
    initialTab: TabKey;
    dealProps: DealProps;
    meetingProps: MeetingProps;
}

export function RegisterTabs({ initialTab, dealProps, meetingProps }: RegisterTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    return (
        <div className="space-y-6 pt-4">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'border-b-2 px-6 py-3 text-sm font-medium transition-colors',
                                activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'deal' && (
                <DealCreateForm
                    companies={dealProps.companies}
                    stages={dealProps.stages}
                    acquisitionMethods={dealProps.acquisitionMethods}
                    showJetFields={dealProps.showJetFields}
                    jetDealStatuses={dealProps.jetDealStatuses}
                    jetCreditStatuses={dealProps.jetCreditStatuses}
                    jetStatus2Options={dealProps.jetStatus2Options}
                    allianceOptions={dealProps.allianceOptions}
                    users={dealProps.users}
                    currentUserId={dealProps.currentUserId}
                />
            )}

            {activeTab === 'alliance' && <AllianceCreateForm />}

            {activeTab === 'meeting' && (
                <MeetingCreateForm
                    companies={meetingProps.companies}
                    alliances={meetingProps.alliances}
                    users={meetingProps.users}
                    currentUserId={meetingProps.currentUserId}
                    onCreateCompany={meetingProps.onCreateCompany}
                    onCreateAlliance={meetingProps.onCreateAlliance}
                />
            )}
        </div>
    );
}
