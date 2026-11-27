import { useNavigate } from 'react-router';
import { format } from 'date-fns';

import {
  ArchiveBox,
  ArrowClockwise,
  CheckCircle,
  Copy,
  DotsThree,
  DotsThreeCircle,
  StopCircle,
  Warning,
  XCircle,
} from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { Table } from '@octap/shared/components';
import { cn } from '@octap/shared/utils';

import type { ColumnDef } from '@tanstack/react-table';

import { usePartnersData } from '../PartnersDataContext';
import type { OrganizationList, PartnerColumn } from '../types';

type Organization = NonNullable<
  NonNullable<Extract<OrganizationList, { error: null }>['data']>['items']
>[number];

export function PartnerDataTable() {
  const navigate = useNavigate();
  const { orgs, timestamp, reload, searchQuery, statusFilter, isCompact, hiddenColumns } =
    usePartnersData();

  if (orgs === 0) {
    return (
      <div className="flex-1 w-auto flex flex-col place-center gap-4">
        <span className="loading loading-spinner"></span>
        Loading partner organizations
      </div>
    );
  }

  if (orgs.error) {
    return (
      <div className="flex-1 w-auto flex flex-col place-center gap-6">
        <Warning size={60} />

        <div className="text-center">
          <div className="font-bold">
            An error has occured while fetching organizations. See below for more details
          </div>
          <div>Timestamp: {timestamp}</div>
        </div>

        <div className="*:min-w-40 flex gap-2">
          <Button icon={ArrowClockwise} className="btn-primary" onClick={reload}>
            Retry
          </Button>
          <Button
            icon={Copy}
            onClick={() => void navigator.clipboard.writeText(JSON.stringify(orgs.error, null, 2))}
          >
            Copy Content
          </Button>
        </div>

        <textarea className="w-1/2 h-1/2 min-h-32 textarea textarea-error font-mono">
          {JSON.stringify(orgs.error, null, 4)}
        </textarea>
      </div>
    );
  }

  const normalizedQuery = searchQuery.toLocaleLowerCase();
  const items = (orgs.data.items ?? []).filter((organization) => {
    const matchesStatus = !statusFilter || organization.status === statusFilter;
    const searchableText = [
      organization.name,
      organization.id,
      organization.slug,
      organization.legalName,
      organization.taxId,
      organization.representativeName,
      organization.organizationType,
      organization.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();

    return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  const columns: Array<ColumnDef<Organization> & { name: PartnerColumn }> = [
    {
      accessorKey: 'id',
      name: 'Organization Details',
      header: () => 'Organization Details',
      cell: ({ row }) => {
        const organization = row.original;
        if (isCompact) return <div className="font-bold truncate">{organization.name}</div>;

        return (
          <div className="space-y-1 py-1">
            <div className="font-bold">{organization.name}</div>
            <div className="text-xs">ID: {organization.id}</div>
            <div className="text-xs">Slug: {organization.slug}</div>
            {organization.legalName && (
              <div className="text-xs">Legal name: {organization.legalName}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'representativeName',
      name: 'Company Information',
      header: () => 'Company Information',
      cell: ({ row }) => {
        const organization = row.original;
        if (isCompact)
          return <div className="truncate">{organization.representativeName ?? 'Unknown'}</div>;

        return (
          <div className="space-y-1 py-1">
            <div className="font-bold">{organization.representativeName ?? 'Unknown'}</div>
            <div className="text-xs">Type: {organization.organizationType ?? 'Unknown'}</div>
            <div className="text-xs">Tax ID: {organization.taxId ?? 'Unknown'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      name: 'Created At',
      header: () => 'Created At',
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        if (!v) return <div className="italic text-base-content/67">Unknown</div>;

        return <div>{format(v, 'dd/MM/yyyy - hh:mm:ss aa')}</div>;
      },
    },
    {
      accessorKey: 'provisioning.updatedAt',
      name: 'Program & Provisioning',
      header: () => 'Program & Provisioning',
      cell: ({ row }) => {
        const organization = row.original;
        const provisioning = organization.provisioning;
        if (isCompact)
          return (
            <div className="truncate">
              {organization.programStatus ?? 'Not configured'}
              {provisioning && `, ${provisioning.status}`}
            </div>
          );

        return (
          <div className="space-y-1 py-1">
            <div>Program: {organization.programStatus ?? 'Not configured'}</div>
            {organization.programControlId && (
              <div className="text-xs">Control ID: {organization.programControlId}</div>
            )}
            {provisioning ? (
              <>
                <div className="text-xs">Provisioning: {provisioning.status}</div>
                {provisioning.tenantId && (
                  <div className="text-xs">Tenant: {provisioning.tenantId}</div>
                )}
                {provisioning.operationId && (
                  <div className="text-xs">Operation: {provisioning.operationId}</div>
                )}
                {provisioning.updatedAt && (
                  <div className="text-xs">
                    Updated: {format(provisioning.updatedAt, 'dd/MM/yyyy - hh:mm:ss aa')}
                  </div>
                )}
                {provisioning.errorMessage && (
                  <div className="text-xs text-error">{provisioning.errorMessage}</div>
                )}
              </>
            ) : (
              <div className="text-xs">Provisioning unavailable</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      name: 'Status',
      header: () => 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      enableColumnFilter: true,
    },
  ];

  return (
    <div className="flex-1 w-auto">
      <Table
        className="h-full overflow-y-scroll"
        data={items}
        columns={columns.filter((column) => !hiddenColumns.has(column.name))}
        emptyMessage="No organizations found."
        rowProps={(item) => ({
          className: 'hover:bg-base-200 active:bg-base-300 cursor-pointer',
          onClick: () => navigate('/partners/' + item.id),
        })}
      />
    </div>
  );
}

const StatusBadge = (props: { status: string }) => {
  const status = props.status.toLowerCase();
  const text = status.split('_').join(' ');

  let color = 'text-primary',
    Icon = DotsThree;

  switch (status) {
    case 'active': {
      color = 'text-success';
      Icon = CheckCircle;
      break;
    }
    case 'rejected': {
      color = 'text-error';
      Icon = XCircle;
      break;
    }
    case 'pending_approval': {
      color = 'text-warning';
      Icon = DotsThreeCircle;
      break;
    }
    case 'archived': {
      color = '';
      Icon = ArchiveBox;
      break;
    }
    case 'suspended': {
      color = 'text-error';
      Icon = StopCircle;
    }
  }

  return (
    <div className={cn('flex items-center capitalize font-bold gap-2', color)}>
      <Icon size="2em" weight="fill" />
      <div className="flex-1">{text}</div>
    </div>
  );
};
