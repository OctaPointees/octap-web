import { Route, Routes } from 'react-router';

import { PartnersDataProvider } from './PartnersDataContext';
import { PartnerActionsPanel } from './components/PartnerActionsPanel';
import { PartnerDataTable } from './components/PartnerDataTable';
import { PartnerDetailsPanel } from './components/PartnerDetailsPanel';
import { PartnerFiltersPanel } from './components/PartnerFiltersPanel';
import { PartnerMembersTable } from './components/PartnerMembersTable';

export function PartnersPages() {
  return (
    <PartnersDataProvider>
      <Routes>
        <Route path="/:id/members" element={<PartnerMembersTable />} />
        <Route path="/:id" element={<PartnerDetailsPage />} />
        <Route path="/" element={<PartnerListPage />} />
      </Routes>
    </PartnersDataProvider>
  );
}

function PartnerListPage() {
  return (
    <div className="screen-wrapper flex gap-4">
      <PartnerFiltersPanel />
      <PartnerDataTable />
    </div>
  );
}

function PartnerDetailsPage() {
  return (
    <div className="screen-wrapper flex gap-4">
      <PartnerActionsPanel />
      <PartnerDetailsPanel />
    </div>
  );
}
