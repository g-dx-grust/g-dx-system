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
    const primaryRole = session.user.roles.includes('SUPER_ADMIN')
        ? 'SUPER_ADMIN'
        : session.user.roles.includes('ADMIN')
          ? 'ADMIN'
          : (session.user.roles[0] ?? undefined);

    return (
        <LayoutShell header={<Header session={session} />} activeBusinessScope={activeBusinessScope} userRole={primaryRole}>
            {children}
        </LayoutShell>
    );
}
