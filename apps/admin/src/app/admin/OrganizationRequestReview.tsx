import { organizationTypeLabel } from '@octap/shared/console-api';
import { notify } from '../../utils/toast';
import {
  useDecideOrganizationRequest,
  usePlatformOrganizationRequests,
} from '../../queries/organizationRequests';

/** Organization requests for a System Admin to approve or reject. */
export function OrganizationRequestReview() {
  const requests = usePlatformOrganizationRequests();
  const decide = useDecideOrganizationRequest();
  const busy = decide.isPending;
  const run = (
    variables: Parameters<typeof decide.mutate>[0],
    success: string,
    onSuccess?: () => void,
  ) =>
    decide.mutate(variables, {
      onSuccess: () => {
        notify.success(success);
        onSuccess?.();
      },
      onError: (cause) => notify.error(cause, 'That did not work'),
    });

  return (
    <section className="bg-base-100 border border-base-300 rounded-box p-6 space-y-5">
      <h1 className="text-2xl font-bold">Organization requests</h1>
      <p>Approve a new organization to activate it and assign its applicant as Business Owner.</p>
      {requests.isPending && <p role="status">Loading organization requests…</p>}
      {requests.error && (
        <p role="alert" className="alert alert-error">
          {requests.error.message}
        </p>
      )}
      {requests.data?.length === 0 && <p>No organization requests.</p>}
      {requests.data?.map((request) => (
        <article key={request.id} className="border border-base-300 rounded-box p-4 space-y-3">
          <h2 className="font-semibold">
            {request.name} · {request.slug}
          </h2>
          <p>
            {request.applicantEmail} · {request.status}
          </p>
          <p className="text-sm">{organizationTypeLabel(request.organizationType)}</p>
          {request.legalName && <p>Legal name: {request.legalName}</p>}
          {request.taxId && <p>Business registration / tax number: {request.taxId}</p>}
          {request.representativeName && (
            <p>Owner / representative: {request.representativeName}</p>
          )}
          {request.nationalIdLast4 && (
            <p>
              CCCD: {'•'.repeat(8)}
              {request.nationalIdLast4} {'—'} not verified
            </p>
          )}
          {request.reason && <p>{request.reason}</p>}
          {request.status === 'PENDING' && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() =>
                  run({ id: request.id, decision: 'approve' }, 'Organization approved')
                }
              >
                Approve {request.name}
              </button>
              <form
                className="flex gap-2 flex-wrap"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  run(
                    {
                      id: request.id,
                      decision: 'reject',
                      reason: String(new FormData(form).get('reason')),
                    },
                    'Organization rejected',
                    () => form.reset(),
                  );
                }}
              >
                <input
                  name="reason"
                  aria-label={`Rejection reason for ${request.name}`}
                  className="input input-bordered"
                  required
                  maxLength={1000}
                  placeholder="Rejection reason"
                />
                <button className="btn btn-outline btn-sm" disabled={busy}>
                  Reject
                </button>
              </form>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
