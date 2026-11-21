/** The tooltip every chart uses, whichever library draws it. */
export function ChartTooltip({
  title,
  label,
  value,
}: {
  title: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-field bg-neutral px-2.5 py-1.5 text-xs whitespace-nowrap text-neutral-content shadow-sm">
      <p className="opacity-70">{title}</p>
      <p className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </p>
    </div>
  );
}
