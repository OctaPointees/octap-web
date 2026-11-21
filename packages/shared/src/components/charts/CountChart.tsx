import { lazy } from 'react';
import { ChartFrame } from './ChartFrame';
import { formatCount } from './theme';
import type { CountChartProps } from './types';

const CountPlot = lazy(() => import('./recharts/CountPlot'));

/** How many of something happened in each period, such as new members per week. */
export function CountChart({ data, label, formatValue = formatCount, ...state }: CountChartProps) {
  return (
    <ChartFrame
      label={label}
      rows={data.map((point) => ({
        name: point.detail ?? point.label,
        value: formatValue(point.value),
      }))}
      {...state}
    >
      <CountPlot data={data} label={label} formatValue={formatValue} />
    </ChartFrame>
  );
}
