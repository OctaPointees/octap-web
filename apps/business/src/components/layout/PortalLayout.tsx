import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import MainToolbar, { type SearchResult } from './MainToolbar';
import SidePanel, { type NavOption } from './SidePanel';
import { AccountMenu } from './ToolbarMenus';

type Props = {
  subtitle: string;
  nav: NavOption[];
  useSearch: (q: string) => { data?: SearchResult[]; isFetching: boolean };
  searchPlaceholder?: string;
  sideFooter?: ReactNode;
  /** Full-width pages such as the organization picker: no side panel, centered content. */
  hideSidebar?: boolean;
};

/**
 * The window scrolls: the full-width top bar sticks to the top, and the side panel sticks just
 * below it at the same 1rem gap it has before scrolling (`--toolbar` is the bar's height, its
 * bottom border included in `h-14`).
 */
export default function PortalLayout({
  subtitle,
  nav,
  useSearch,
  searchPlaceholder,
  sideFooter,
  hideSidebar = false,
}: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-base-100 [--toolbar:3.5rem]">
      <header className="sticky top-0 z-30 select-none">
        <MainToolbar
          nav={nav}
          useResults={useSearch}
          subtitle={subtitle}
          placeholder={searchPlaceholder}
          actions={<AccountMenu />}
        />
      </header>

      <div className="flex flex-1 gap-6 p-4">
        {!hideSidebar && (
          <SidePanel
            options={nav}
            footer={sideFooter}
            className="sticky top-[calc(var(--toolbar)+1rem)] h-[calc(100dvh-var(--toolbar)-2rem)]"
          />
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-[1920px] flex-col gap-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
