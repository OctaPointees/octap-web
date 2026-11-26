import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Field } from '@base-ui/react';
import {
  ArrowClockwise,
  Buildings,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  PaperPlaneRight,
} from 'phosphor-react';

import { Button } from '@octap/shared/components';

import { usePartnersData } from '../PartnersDataContext';

const DefaultFilterValue = { query: '' };
type FilterTypes = typeof DefaultFilterValue;

interface ISearchAndFilterProps {
  onSubmit?: (props: FilterTypes) => Promise<void>;
}

export function PartnerFiltersPanel({ onSubmit: handleSubmit }: ISearchAndFilterProps) {
  const [formLoading, setFormLoading] = useState(false);
  const { orgs, setSearchQuery, statusFilter, setStatusFilter, reload } = usePartnersData();

  const loading = orgs === 0;
  const hasError = orgs !== 0 && orgs.error !== null;

  const items = orgs !== 0 && !hasError ? (orgs.data?.items ?? []) : [];
  const count = loading ? '–' : hasError ? '!' : items.length.toLocaleString();

  const activeCount = items.filter((org) => org.status === 'ACTIVE').length;
  const pendingCount = items.filter((org) => org.status === 'PENDING_APPROVAL').length;

  const form = useForm({
    defaultValues: DefaultFilterValue,

    async onSubmit(state) {
      try {
        setFormLoading(true);
        setSearchQuery(state.value.query.trim());
        const pr = await handleSubmit?.(state.value);

        return pr;
      } catch (err) {
        console.error(err);
      } finally {
        setFormLoading(false);
      }
    },
  });

  return (
    <div className="w-80 rounded-box min-h-48 overflow-hidden flex flex-col p-1">
      <div className="p-3 font-bold text-primary-content bg-primary rounded-t-box">
        Partner Organization
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="query">
          {(f) => {
            return (
              <Field.Root className="input w-full rounded-t-none">
                <MagnifyingGlass />
                <Field.Control
                  value={f.state.value}
                  placeholder="Search & Filter"
                  onValueChange={(v) => f.setValue(v)}
                  autoComplete="false"
                  spellCheck="false"
                />
                <Field.Error
                  match={f.state.meta.isValid}
                  children={f.state.meta.errors.join(', ')}
                />
              </Field.Root>
            );
          }}
        </form.Field>

        <Button
          className="btn-block btn-primary mt-2"
          loading={formLoading}
          icon={PaperPlaneRight}
          type="submit"
        >
          Apply
        </Button>

        <Button className="btn-block mt-2" icon={ArrowClockwise} onClick={reload}>
          Reload Data
        </Button>
      </form>

      <div className="flex-1 min-h-8"></div>

      <div className="mt-2 flex flex-col gap-2 *:flex-1">
        <button
          type="button"
          aria-pressed={statusFilter === null}
          onClick={() => setStatusFilter(null)}
          className={`info-box info-box-compact border border-base-300 text-left hover:border-primary ${statusFilter === null ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="title">Total Organization</div>
          <div className="content flex items-center text-primary">
            <div className="figure-bold flex-1">{count}</div>
            <Buildings weight="fill" size={45} />
          </div>
          <div className="description">all statuses</div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? null : 'ACTIVE')}
          className={`info-box info-box-compact border border-base-300 text-left hover:border-primary ${statusFilter === 'ACTIVE' ? 'ring-2 ring-success' : ''}`}
        >
          <div className="title">Active</div>
          <div className="content flex items-center text-success">
            <div className="figure-bold flex-1">{loading || hasError ? '-' : activeCount}</div>
            <CheckCircle weight="fill" size={40} />
          </div>
          <div className="description">active organizations</div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'PENDING_APPROVAL'}
          onClick={() =>
            setStatusFilter(statusFilter === 'PENDING_APPROVAL' ? null : 'PENDING_APPROVAL')
          }
          className={`info-box info-box-compact border border-base-300 text-left hover:border-primary ${statusFilter === 'PENDING_APPROVAL' ? 'ring-2 ring-warning' : ''}`}
        >
          <div className="title">Pending Approval</div>
          <div className="content flex items-center text-warning">
            <div className="figure-bold flex-1">{loading || hasError ? '-' : pendingCount}</div>
            <Clock weight="fill" size={40} />
          </div>
          <div className="description">awaiting review</div>
        </button>
      </div>
    </div>
  );
}
