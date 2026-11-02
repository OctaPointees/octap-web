import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import MockApiConsole from '../dev/MockApiConsole';
import MainToolbar, { type SearchResult } from './MainToolbar';
import SidePanel, { type NavOption } from './SidePanel';

type Props = {
  subtitle: string;
  roleLabel: string;
  nav: NavOption[];
  useSearch: (q: string) => { data?: SearchResult[]; isFetching: boolean };
  searchPlaceholder?: string;
  sideFooter?: ReactNode;
};

export default function PortalLayout({
  subtitle,
  roleLabel,
  nav,
  useSearch,
  searchPlaceholder,
  sideFooter,
}: Props) {
  // return (
  //     <div className="flex min-h-0 min-w-0 flex-1 flex-col">
  //       <MainToolbar nav={nav} useResults={useSearch} placeholder={searchPlaceholder} actions={<MockApiConsole />} />
  //       <main className="min-h-0 w-full flex-1 overflow-y-auto rounded-box bg-base-200 p-4 md:p-6">
  //         <div className="mx-auto flex max-w-[1920px] flex-col gap-6">
  //           <Outlet />
  //         </div>
  //       </main>
  //     </div>
  // );

  return (
    <div className="app-wrapper flex flex-col gap-2 p-4">
      <div className="fixed w-full left-0 top-0 p-4 z-10 select-none">
        <MainToolbar
          nav={nav}
          useResults={useSearch}
          subtitle={subtitle}
          placeholder={searchPlaceholder}
          actions={<MockApiConsole />}
        />
      </div>

      <div className="flex gap-6 flex-1 min-h-0 pt-18 overflow-y-scroll">
        <SidePanel
          options={nav}
          roleLabel={roleLabel}
          footer={sideFooter}
          className="sticky top-0"
        />

        <main className="flex-1 pr-4 *:max-w-[1920px] flex flex-col gap-4">
          <Outlet />

          {/* <footer className="mt-32 h-1/3 max-h-80 rounded-box bg-base-200"></footer> */}
        </main>
      </div>
    </div>
  );
}
