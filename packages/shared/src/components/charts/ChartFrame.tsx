import { Suspense, type ReactNode } from 'react';
import { Button } from '../Button';
import type { ChartStateProps } from './types';

const DEFAULT_HEIGHT = 160;

interface ChartFrameProps extends ChartStateProps {
  label: string;
  /** The chart's values as text, read by screen readers in place of the drawing. */
  rows: { name: string; value: string }[];
  children: ReactNode;
}

/**
 * What every chart has around it, whichever library draws it: a fixed height, the loading, error
 * and empty states, and a table of its values for screen readers.
 */
export function ChartFrame({
  label,
  rows,
  loading,
  error,
  retrying,
  onRetry,
  emptyMessage = 'No data to show yet.',
  height = DEFAULT_HEIGHT,
  children,
}: ChartFrameProps) {
  const placeholder = <div className="skeleton size-full rounded-box" />;
  const ready = !error && !loading && rows.length > 0;

  return (
    <div className="w-full min-w-0">
      <div className="w-full" style={{ height }}>
        {error ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm"
          >
            <p className="opacity-70">Couldn’t load this chart.</p>
            {onRetry && (
              <Button className="btn-ghost btn-xs min-w-0" loading={retrying} onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        ) : loading ? (
          placeholder
        ) : !rows.length ? (
          <p className="flex h-full items-center justify-center text-center text-sm opacity-60">
            {emptyMessage}
          </p>
        ) : (
          <Suspense fallback={placeholder}>{children}</Suspense>
        )}
      </div>

      {ready && (
        // The wrapper hides it: a table ignores the 1px height and clipping `sr-only` relies on,
        // so on its own it keeps its full height and can stretch the page.
        <div className="sr-only">
          <table aria-label={label}>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.name}-${index}`}>
                  <th scope="row">{row.name}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
