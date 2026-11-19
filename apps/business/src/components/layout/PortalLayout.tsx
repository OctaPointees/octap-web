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
  sideFooter?: ReactNode;
  /** Full-width pages such as the organization picker: no side panel, centered content. */
  hideSidebar?: boolean;
};

/**
 * The window scrolls: the full-width top bar sticks to the top, and the side panel sticks right
 * below it, flush with the window's left edge and bottom (`--toolbar` is the bar's height, its
 * bottom border included in `h-14`). Only the page content has padding.
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

      <div className="flex flex-1">
        {!hideSidebar && (
          <SidePanel
            options={nav}
            footer={sideFooter}
            className="sticky top-(--toolbar) h-[calc(100dvh-var(--toolbar))]"
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
