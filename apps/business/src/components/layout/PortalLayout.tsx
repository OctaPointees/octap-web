import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
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
};

export default function PortalLayout({
  subtitle,
  nav,
  useSearch,
  searchPlaceholder,
  sideHeader,
  sideFooter,
  hideSidebar = false,
}: Props) {
  return (
    <div className="flex flex-col bg-base-100">
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
            className="sticky top-(--size-main-toolbar) h-[calc(100dvh-var(--size-main-toolbar))]"
          />
        )}

        <main className={cn('min-w-0 flex-1 p-4', !hideSidebar && 'md:pl-6')}>
          <div className="flex max-w-(--size-article) flex-col gap-4 mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
