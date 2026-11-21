import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';
import { ChartTooltip } from '../ChartTooltip';
import { chartTheme, countAxisTop, formatAxisCount } from '../theme';
import type { CountChartProps, CountPoint } from '../types';

const AXIS_TEXT = {
  fill: chartTheme.ink,
  fillOpacity: chartTheme.inkOpacity,
  fontSize: 12,
};

type CountPlotProps = Pick<CountChartProps, 'data' | 'label'> & {
  formatValue: (value: number) => string;
};

/** The Recharts drawing behind CountChart. Loaded on demand, so only pages with charts pay for it. */
export default function CountPlot({ data, label, formatValue }: CountPlotProps) {
  const top = countAxisTop(Math.max(...data.map((point) => point.value)));
  const latest = data.length - 1;

  return (
    <BarChart
      responsive
      data={data}
      title={label}
      barCategoryGap="12%"
      margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
      style={{ width: '100%', height: '100%' }}
    >
      <CartesianGrid vertical={false} stroke={chartTheme.grid} />
      <XAxis
        dataKey="label"
        axisLine={{ stroke: chartTheme.grid }}
        tickLine={false}
        tickMargin={8}
        tick={AXIS_TEXT}
        interval="preserveStartEnd"
        minTickGap={16}
      />
      <YAxis
        domain={[0, top]}
        ticks={[0, top / 2, top]}
        allowDecimals={false}
        axisLine={false}
        tickLine={false}
        tick={AXIS_TEXT}
        tickFormatter={formatAxisCount}
        width={40}
      />
      <Tooltip
        isAnimationActive={false}
        cursor={{ fill: chartTheme.ink, fillOpacity: chartTheme.cursorOpacity }}
        content={({ active, payload }: TooltipContentProps) => {
          const point = payload?.[0]?.payload as CountPoint | undefined;
          if (!active || !point) return null;
          return (
            <ChartTooltip
              title={point.detail ?? point.label}
              label={label}
              value={formatValue(point.value)}
            />
          );
        }}
      />
      <Bar
        dataKey="value"
        name={label}
        fill={chartTheme.mark}
        maxBarSize={24}
        radius={[4, 4, 0, 0]}
        // A small count stays visible next to a large one; zero draws nothing.
        minPointSize={(value) => (value ? 2 : 0)}
        shape={(bar: BarShapeProps) => (
          <Rectangle
            {...bar}
            fillOpacity={bar.isActive || bar.index === latest ? 1 : chartTheme.markMutedOpacity}
          />
        )}
      />
    </BarChart>
  );
}
