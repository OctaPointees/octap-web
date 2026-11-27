import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArchiveBox,
  ArrowClockwise,
  ArrowLeft,
  Check,
  CheckCircle,
  DotsThree,
  DotsThreeCircle,
  Warning,
  XCircle,
} from 'phosphor-react';
import type { OctapClient, PlatformOrganizationsDetailResponse } from '@octap/internal-sdk';
import { cn } from '@octap/shared/utils';

import { Button, Modal, Table } from '@octap/shared/components';
import { useAuth } from '@octap/shared/authentication';

function displayValue(value: string | null | undefined) {
  return value || 'Not provided';
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-base-content/60">{label}</dt>
      <dd className="mt-1 wrap-break-word font-medium">{displayValue(value)}</dd>
    </div>
  );
}

export function PartnerDetailsPanel() {
  const { id } = useParams<{ id: string }>();
  const { api: client } = useAuth();

  const detailsQuery = useQuery({
    queryKey: ['partners', 'organization', id],
    queryFn: async () => {
      if (!id) throw new Error('Organization ID is missing');
      const result = await client.platform.detailOrganizations({ id });
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

  if (id && detailsQuery.isPending) {
    return (
      <div className="screen-wrapper flex flex-col place-center gap-4">
        <span className="loading loading-spinner" />
        Loading partner details
      </div>
    );
  }

  if (!id || detailsQuery.isError) {
    return (
      <div className="screen-wrapper flex flex-col place-center gap-4">
        <Warning size={56} className="text-error" />
        <div className="text-center">
          <h1 className="text-lg font-bold">Could not load this organization</h1>
          <p className="text-sm text-base-content/60">Organization ID: {id ?? 'Unknown'}</p>
        </div>
        <div className="flex gap-2">
          <Button icon={ArrowLeft} className="btn-ghost" render={<Link to="/partners" />}>
            Back to partners
          </Button>
          <Button
            icon={ArrowClockwise}
            className="btn-primary"
            disabled={!id}
            onClick={() => void detailsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const organization = detailsQuery.data!;

  return (
    <div className="screen-wrapper space-y-5">
      <div>
        <OrganizationBanner org={organization} />
        <PartnerBasicInfo org={organization} />
      </div>

      <PartnerProvisioningInfo org={organization} />
      <OrganizationRequestsTable organizationId={organization.id} />
    </div>
  );
}

export type OrganizationRequest = NonNullable<
  Awaited<ReturnType<OctapClient['platform']['listOrganizationRequests']>>['data']
>[number];

function OrganizationRequestsTable({ organizationId }: { organizationId: string }) {
  const { api: client } = useAuth();
  const requestsQuery = useQuery({
    queryKey: ['partners', 'organization-requests', organizationId],
    queryFn: async () => {
      const response = await client.platform.listOrganizationRequests();
      if (response.error) throw response.error;
      return response.data.filter((request) => request.organizationId === organizationId);
    },
    staleTime: 5 * 60 * 1000,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const requests = (requestsQuery.data ?? []).filter((request) =>
    [
      request.id,
      request.name,
      request.slug,
      request.applicantEmail,
      request.initialOwnerName,
      request.initialOwnerEmail,
      request.organizationType,
      request.status,
      request.reason,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedSearchQuery),
  );

  return (
    <section className="py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Organization Requests ({requests.length})</h2>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <input
            className="input input-bordered input-sm w-full max-w-xs"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search requests"
            aria-label="Search organization requests"
          />
          <Button
            icon={ArrowClockwise}
            className="btn-outline btn-sm"
            loading={requestsQuery.isFetching}
            onClick={() => void requestsQuery.refetch()}
          >
            Reload
          </Button>
        </div>
      </div>

      {requestsQuery.isPending ? (
        <div className="flex items-center gap-3 py-6 text-sm text-base-content/70">
          <span className="loading loading-spinner" />
          Loading organization requests
        </div>
      ) : requestsQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-sm text-error">
            {requestsQuery.error instanceof Error
              ? requestsQuery.error.message
              : 'Could not load organization requests.'}
          </p>
        </div>
      ) : (
        <Table<OrganizationRequest>
          data={requests}
          emptyMessage="No requests found for this organization."
          columns={[
            {
              accessorKey: 'id',
              header: () => 'Request',
              cell: ({ row }) => {
                return (
                  <div>
                    <div>{row.original.initialOwnerName || 'Unknown applicant'}</div>
                    <div className="text-xs text-base-content/60">
                      {row.original.applicantEmail}
                    </div>
                    <div className="text-xs text-base-content/60">{row.original.id}</div>
                  </div>
                );
              },
            },
            {
              accessorKey: 'organizationType',
              header: () => 'Organization Type',
              cell: ({ getValue }) => getValue<string | null>() ?? 'Unknown',
            },
            {
              accessorKey: 'createdAt',
              header: () => 'Submitted',
              cell: ({ getValue }) =>
                format(new Date(getValue<string>()), 'dd/MM/yyyy - hh:mm:ss aa'),
            },
            {
              accessorKey: 'status',
              header: () => 'Status & Reason',
              cell: ({ row }) => {
                return (
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="font-bold">STATUS: {row.original.status}</div>
                      <div>{row.original.reason ?? 'Not provided'}</div>
                    </div>

                    <OrganizationRequestActions
                      request={row.original}
                      organizationId={organizationId}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </section>
  );
}

export function OrganizationRequestActions({
  request,
  organizationId,
}: {
  request: OrganizationRequest;
  organizationId: string;
}) {
  const { api: client } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (input: { action: 'APPROVE' | 'REJECT'; message: string }) => {
      const response =
        input.action === 'APPROVE'
          ? await client.platform.approveOrganizationRequests({
              id: request.id,
              body: { reason: input.message },
            })
          : await client.platform.rejectOrganizationRequests({
              id: request.id,
              body: { reason: input.message },
            });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: async () => {
      setIsOpen(false);
      setActiveAction(null);
      setMessage('');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['partners', 'organization-requests', organizationId],
        }),
        queryClient.invalidateQueries({ queryKey: ['requests', 'organization-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'organization', organizationId] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'organizations'] }),
      ]);
    },
  });

  const isPending = reviewMutation.isPending;
  const closeModal = () => {
    if (isPending) return;
    setIsOpen(false);
    setActiveAction(null);
    setMessage('');
    reviewMutation.reset();
  };

  return (
    <>
      <Button
        type="button"
        icon={DotsThree}
        className="btn-sm btn-outline"
        disabled={request.status !== 'PENDING'}
        onClick={() => {
          reviewMutation.reset();
          setMessage('');
          setIsOpen(true);
        }}
      >
        Actions
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={(open) => !open && closeModal()}
        size="xl"
        title="Review organization request"
        description={
          <>
            Choose whether to approve or reject the request from{' '}
            <strong>{request.initialOwnerName || request.applicantEmail}</strong>.
          </>
        }
        footer={
          <>
            <Button type="button" className="btn-ghost" disabled={isPending} onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-error btn-outline"
              icon={XCircle}
              disabled={!message.trim() || isPending}
              loading={isPending && activeAction === 'REJECT'}
              onClick={() => {
                setActiveAction('REJECT');
                reviewMutation.mutate({ action: 'REJECT', message: message.trim() });
              }}
            >
              Reject
            </Button>
            <Button
              type="button"
              className="btn-success"
              icon={Check}
              disabled={!message.trim() || isPending}
              loading={isPending && activeAction === 'APPROVE'}
              onClick={() => {
                setActiveAction('APPROVE');
                reviewMutation.mutate({ action: 'APPROVE', message: message.trim() });
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4" aria-busy={isPending}>
          <label className="flex w-full flex-col gap-2">
            <span className="font-medium">Message</span>
            <textarea
              className="textarea textarea-bordered min-h-24 w-full"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isPending}
              maxLength={1000}
              placeholder="Add a message explaining your decision"
            />
          </label>

          {reviewMutation.isError && (
            <div className="alert alert-error" role="alert">
              {reviewMutation.error instanceof Error
                ? reviewMutation.error.message
                : 'Could not review this request. Please try again.'}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

type PropsWithOrg<T = unknown> = { org: PlatformOrganizationsDetailResponse } & T;

function PartnerBasicInfo({ org }: PropsWithOrg) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 flex-3">
      {/* <h2 className="mb-4 text-lg font-semibold">Company Information</h2> */}
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Organization ID" value={org.id} />
        <Detail label="Slug" value={org.slug} />
        <Detail label="Organization type" value={org.organizationType} />
        <Detail label="Legal name" value={org.legalName} />
        <Detail label="Tax ID" value={org.taxId} />
        <Detail label="Representative" value={org.representativeName} />
        <Detail
          label="Created at"
          value={format(new Date(org.createdAt), 'dd/MM/yyyy - hh:mm:ss aa')}
        />
        <Detail label="Program status" value={org.programStatus} />
        <Detail label="Program control ID" value={org.programControlId} />
      </dl>
    </section>
  );
}

function PartnerProvisioningInfo({ org }: PropsWithOrg) {
  const { provisioning: p } = org;

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 flex-2">
      <h2 className="mb-4 text-lg font-semibold">Provisioning</h2>
      {p ? (
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Status" value={p.status} />
          <Detail label="Tenant ID" value={p.tenantId} />
          <Detail label="Operation ID" value={p.operationId} />
          <Detail
            label="Last updated"
            value={format(new Date(p.updatedAt), 'dd/MM/yyyy - hh:mm:ss aa')}
          />
          <Detail label="Error" value={p.errorMessage} />
        </dl>
      ) : (
        <p className="text-sm text-base-content/60">Provisioning information is unavailable.</p>
      )}
    </section>
  );
}

function OrganizationBanner({ org }: PropsWithOrg) {
  const nav = useNavigate();

  const CLSS =
    'flex gap-4 bg-primary text-primary-content rounded-t-box items-center p-4 -mb-2 pb-6';

  return (
    <div className={CLSS}>
      <Button className="btn-primary" onClick={() => nav(-1)}>
        <ArrowLeft size="1.5em" />
        <div className="ml-4 flex-1 text-left">Back</div>
      </Button>

      <div className="flex-1">
        <div>Partner Organization Details</div>
        <h1 className="text-2xl font-bold">{org.name}</h1>
      </div>

      <StatusBadge status={org.status} />
    </div>
  );
}

const StatusBadge = (props: { status: string }) => {
  const status = props.status.toLowerCase();
  const text = status.split('_').join(' ');

  let color = 'badge-primary',
    Icon = DotsThree;

  switch (status) {
    case 'active': {
      color = 'badge-success';
      Icon = CheckCircle;
      break;
    }
    case 'rejected': {
      color = 'badge-error';
      Icon = XCircle;
      break;
    }
    case 'pending_approval': {
      color = 'badge-warning';
      Icon = DotsThreeCircle;
      break;
    }
    case 'archived': {
      color = '';
      Icon = ArchiveBox;
    }
  }

  return (
    <div className={cn('badge badge-soft py-4 rounded-field uppercase font-bold', color)}>
      <div className="flex-1 min-w-36">{text}</div>
      <Icon size="1.5em" weight="fill" />
    </div>
  );
};
