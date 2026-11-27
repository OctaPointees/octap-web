/**
 * What pages pass to a chart. These types never mention a chart library, so a chart can change
 * library without any page changing.
 */

/** Shared by every chart: its size and what to show instead of data. */
export interface ChartStateProps {
  loading?: boolean;
  error?: unknown;
  /** A retry is in progress. */
  retrying?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Height of the plot in pixels. */
  height?: number;
}

/** One period in a count chart. */
export interface CountPoint {
  /** Short text for the axis, such as "Nov 15". */
  label: string;
  value: number;
  /** Longer text for the tooltip, such as "Nov 15 to Nov 21". Defaults to `label`. */
  detail?: string;
}

export interface CountChartProps extends ChartStateProps {
  /** Oldest period first. The last one is highlighted as the latest. */
  data: CountPoint[];
  /** What is being counted, such as "New members". */
  label: string;
  formatValue?: (value: number) => string;
}
