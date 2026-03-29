import type { BusinessScopeType } from '@g-dx/contracts';
import type { AuthenticatedAppSession } from '@/shared/server/session';
import { Header } from './header';
import { LayoutShell } from './layout-shell';

interface GlobalLayoutProps {
    children: React.ReactNode;
    activeBusinessScope: BusinessScopeType;
    session: AuthenticatedAppSession;
}

export function GlobalLayout({ children, activeBusinessScope, session }: GlobalLayoutProps) {
    return (
        <LayoutShell header={<Header session={session} />} activeBusinessScope={activeBusinessScope}>
            {children}
        </LayoutShell>
    );
}
