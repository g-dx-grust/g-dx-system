import type { BusinessScopeType } from '@g-dx/contracts';
import { Header } from './header';
import { LayoutShell } from './layout-shell';

interface GlobalLayoutProps {
    children: React.ReactNode;
    activeBusinessScope: BusinessScopeType;
}

export function GlobalLayout({ children, activeBusinessScope }: GlobalLayoutProps) {
    return (
        <LayoutShell header={<Header />} activeBusinessScope={activeBusinessScope}>
            {children}
        </LayoutShell>
    );
}
