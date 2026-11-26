import { Button } from '@octap/shared/components';
import { wait } from '@octap/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ArrowClockwise } from 'phosphor-react';

function randint(min: number, max: number): number {
  const minC = Math.ceil(min);
  const maxF = Math.floor(max);
  return Math.floor(Math.random() * (maxF - minC + 1) + minC);
}

function syncrandsys() {
  return {
    cpu: randint(20, 100),
    mem: randint(40, 70),
    str: 50,
    net: randint(20, 90),
  };
}

async function randsys() {
  await wait(randint(800, 3000));
  return syncrandsys();
}

export function SystemUsage() {
  const metricQuery = useQuery({
    queryKey: ['system-usage'],
    queryFn: randsys,
  });

  const metric = metricQuery.data ?? syncrandsys();

  return (
    <div className="p-4 border h-fit shrink-0 rounded-box border-base-300 bg-base-100 w-78">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="font-bold">System usage</h2>
        {/* <span className="badge badge-ghost badge-sm">Sample</span> */}
      </div>

      <p>Last updated {formatDistanceToNow(metricQuery.dataUpdatedAt)}</p>

      <div className="my-4 space-y-8">
        <UsageMeter
          label="CPU"
          value={metric.cpu}
          detail="6 of 16 vCPU"
          color="progress-primary"
          count={4}
        />
        <UsageMeter
          label="Memory"
          value={metric.mem}
          detail="10.2 of 16 GB"
          color="progress-secondary"
        />
        <UsageMeter
          label="Storage"
          value={metric.str}
          detail="260 of 500 GB"
          color="progress-neutral"
        />
        <UsageMeter
          label="Network"
          value={metric.net}
          detail="270 Mbps of 1 Gbps"
          color="progress-info"
        />
      </div>

      <Button
        className="btn-block btn-primary"
        icon={ArrowClockwise}
        onClick={() => metricQuery.refetch()}
        loading={metricQuery.isFetching}
      >
        Reload
      </Button>
    </div>
  );
}

function UsageMeter({
  label,
  value,
  detail,
  color,
  count = 1,
}: {
  label: string;
  value: number;
  detail: string;
  color: string;
  count?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-base-content/70">{value}%</span>
      </div>
      {Array(count)
        .fill(1)
        .map((_, i) => (
          <progress
            key={i}
            className={`progress ${color} w-full h-2`}
            value={value + randint(i * -5, i * 5)}
            max={100}
            aria-label={`${label} usage`}
          />
        ))}
      <div className="mt-1 text-xs text-base-content/60">{detail}</div>
    </div>
  );
}
