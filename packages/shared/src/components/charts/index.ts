/*
 * Reusable charts, named by the shape of their data rather than what they count. Import them from
 * `@octap/shared/components/charts`, not the main components index, so pages without charts never
 * load a chart library. Each library's code stays in its own folder here, such as `recharts/`.
 */
export { CountChart } from './CountChart';
export type { ChartStateProps, CountChartProps, CountPoint } from './types';
