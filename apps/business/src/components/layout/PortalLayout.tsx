import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { cn } from '../../utils/cn';
import MainToolbar, { type SearchResult } from './MainToolbar';
import SidePanel, { type NavOption } from './SidePanel';
import { AccountMenu } from './ToolbarMenus';

type Props = {
  subtitle: string;
  nav: NavOption[];
  useSearch: (q: string) => { data?: SearchResult[]; isFetching: boolean };
  searchPlaceholder?: string;
  /** Above the sidebar's pages; told whether the sidebar is a rail. */
  sideHeader?: (retracted: boolean) => ReactNode;
  sideFooter?: ReactNode;
  /** Full-width pages such as the organization picker: no side panel, centered content. */
  hideSidebar?: boolean;
  /** The bar along the bottom of the window. */
  statusBar: ReactNode;
};

export default function PortalLayout({
  subtitle,
  nav,
  useSearch,
  searchPlaceholder,
  sideHeader,
  sideFooter,
  hideSidebar = false,
  statusBar,
}: Props) {
  // `/organizations/:slug/<feature>`: a new feature fades in, its own sub-pages don't.
  const feature = useLocation().pathname.split('/').slice(0, 4).join('/');

  return (
    <div className="flex min-h-dvh flex-col bg-base-200">
      <header className="sticky top-0 z-30 select-none">
        <MainToolbar
          nav={nav}
          useResults={useSearch}
          subtitle={subtitle}
          placeholder={searchPlaceholder}
          actions={<AccountMenu />}
        />
      </header>

      <div className="flex flex-1 min-h-0">
        {!hideSidebar && (
          <SidePanel
            options={nav}
            header={sideHeader}
            footer={sideFooter}
            className="sticky top-(--size-main-toolbar) h-[calc(100dvh-var(--size-main-toolbar)-var(--size-status-bar))]"
          />
        )}

        <main className={cn('min-w-0 flex-1 p-4 bg-pattern-top-glow', !hideSidebar && 'md:pl-6')}>
          <div
            key={feature}
            className="animate-page-in flex max-w-(--size-article) flex-col gap-4 mx-auto"
          >
            <Outlet />
          </div>
        </main>
      </div>

      {statusBar}
    </div>
  );
}
