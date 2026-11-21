/** Chart colors, taken from the app's theme so charts follow it. */
export const chartTheme = {
  mark: 'var(--color-primary)',
  /** Opacity of marks that aren't the latest or the one being hovered. */
  markMutedOpacity: 0.6,
  grid: 'var(--color-base-300)',
  ink: 'var(--color-base-content)',
  inkOpacity: 0.55,
  cursorOpacity: 0.05,
};

const fullNumber = new Intl.NumberFormat('en-US');
const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCount = (value: number) => fullNumber.format(value);

/** Axis labels stay in full below 10,000 and shorten above it. */
export const formatAxisCount = (value: number) =>
  value >= 10_000 ? compactNumber.format(value) : fullNumber.format(value);

/** A round top for a count axis, with a whole number halfway up. */
export function countAxisTop(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 4, 6, 8, 10].find((step) => step * magnitude >= value)! * magnitude;
}
