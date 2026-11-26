import { Routes, Route, Navigate, useLocation } from 'react-router';

import { HardDrive, Layout, ListChecks, Ticket, Users } from 'phosphor-react';

import { NotFoundTemplate } from '@/components/pages/NotFoundTemplate';
import { TopBarNavigation } from '@/components/layout/TopBarNavigation';
import { RequestsPage } from './pages/requests';
import { AuditPages } from './pages/audit';
import { IndexPages } from './pages/index/index';
import { PartnersPages } from './pages/partners';

export default function AdminDashboard() {
  const { pathname } = useLocation();

  const nav = [
    { label: 'Dashboard', path: '/dashboard', icon: Layout, end: true },
    { label: 'Requests', path: '/requests', icon: ListChecks },
    { label: 'Partners', path: '/partners', icon: Users },
    { label: 'Vouchers', path: '/vouchers', icon: Ticket },
    { label: 'System Audit', path: '/audit', icon: HardDrive },
  ];

  return (
    <div className="flex flex-col screen-wrapper">
      <TopBarNavigation options={nav} subtitle="System Dashboard" />

      <div
        className="z-0 flex-1 min-h-0 m-4 mt-0 overflow-y-auto rounded-box p-2"
        key={pathname}
        style={{
          boxShadow:
            'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        }}
      >
        <Routes>
          <Route path="/requests/*" element={<RequestsPage />} />
          <Route path="/audit/*" element={<AuditPages />} />
          <Route path="/partners/*" element={<PartnersPages />} />

          <Route path="/dashboard" element={<IndexPages />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/*" element={<NotFoundTemplate />} />
        </Routes>
      </div>
    </div>
  );
}
