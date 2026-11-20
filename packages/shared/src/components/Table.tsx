import { useState, type ComponentProps } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type ColumnDef,
  type FilterFn,
  type Row,
  type RowData,
  type SortingState,
  type TableState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, DotsThree } from 'phosphor-react';
import { Menu } from '@base-ui/react/menu';
import { cn } from '@octap/shared/utils';

const CLSS = {
  wrapper: 'w-full overflow-x-auto rounded-box border border-base-300',
  table: 'table table-zebra table-pin-rows table-fixed w-full',
  thead: 'bg-base-100 text-primary',
  header: 'relative group',
  headerContent: 'flex min-w-0 items-center',
  sortButton: 'flex min-w-0 flex-1 items-center gap-1 text-left',
  sortButtonActive: 'cursor-pointer select-none',
  headerLabel: 'truncate mr-2',
  headerActions: 'flex shrink-0 items-center',
  filterButton: 'btn btn-xs btn-square ml-1 shrink-0',
  filterButtonActive: 'text-primary',
  filterIcon: 'text-[current]',
  menuPositioner: 'z-50 outline-none',
  menu: 'menu rounded-box border border-base-300 bg-base-100 p-2 shadow-lg min-w-52 max-h-72 overflow-y-auto',
  menuHeading: 'flex items-center justify-between gap-3 px-2 py-1',
  menuTitle: 'text-xs font-semibold',
  clearButton: 'btn btn-ghost btn-xs',
  filterOption:
    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-base-200 focus:bg-base-200 outline-none',
  filterOptionSelected: 'bg-primary/10 font-medium text-primary',
  checkbox: 'checkbox checkbox-xs',
  filterLabel: 'truncate',
  selectedBadge: 'badge badge-primary badge-xs ml-auto',
  filterCount: 'text-xs opacity-60',
  noValues: 'px-2 py-2 text-xs opacity-60',
  activeFilterBadge: 'badge badge-secondary badge-xs ml-1',
  resizer:
    'absolute right-0 top-0 h-full w-3 cursor-col-resize touch-none select-none bg-transparent hover:bg-primary/50',
  resizerActive: 'bg-primary',
  cell: 'truncate p-1 pl-2',
  emptyCell: 'py-8 text-center text-sm opacity-60',
} as const;

const multiValueFilter: FilterFn<any> = (row, columnId, filterValue: unknown) => {
  const selectedValues = Array.isArray(filterValue) ? filterValue : [filterValue];
  return selectedValues.some((value) => Object.is(value, row.getValue(columnId)));
};

interface TableProps<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;
  /** Message shown when the current filters leave no rows to display. */
  emptyMessage?: string;
  /** Initial TanStack Table state, such as sorting, filters, or column sizing. */
  initialState?: Partial<TableState>;
  /** Props applied to each visible data row. */
  rowProps?: (item: TData, index: number, row: Row<TData>) => ComponentProps<'tr'>;
}

function ColumnFilter<TData extends RowData>({
  column,
  values,
  selectedValues,
  onSelectionChange,
}: {
  column: Column<TData, unknown>;
  values: [unknown, number][];
  selectedValues: unknown[];
  onSelectionChange: (selectedValues: unknown[]) => void;
}) {
  const canFilter = column.getCanFilter();
  const hasActiveFilter = selectedValues.length > 0;

  if (!canFilter) return null;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Filter ${column.id}`}
        title={`Filter ${column.id}`}
        className={cn(CLSS.filterButton, hasActiveFilter && CLSS.filterButtonActive)}
        onClick={(event) => event.stopPropagation()}
      >
        <DotsThree size={18} weight="bold" className={CLSS.filterIcon} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={CLSS.menuPositioner} sideOffset={6}>
          <Menu.Popup className={CLSS.menu}>
            <div className={CLSS.menuHeading}>
              <span className={CLSS.menuTitle}>Filter values</span>
              <button
                type="button"
                className={CLSS.clearButton}
                disabled={!hasActiveFilter}
                onClick={() => onSelectionChange([])}
              >
                Clear
              </button>
            </div>
            {values.length ? (
              values.map(([value, count]) => {
                const label = value == null ? '(empty)' : String(value);
                const selected = selectedValues.some((selectedValue) =>
                  Object.is(selectedValue, value),
                );
                return (
                  <Menu.Item
                    key={`${typeof value}:${label}`}
                    closeOnClick={false}
                    className={cn(CLSS.filterOption, selected && CLSS.filterOptionSelected)}
                    onClick={() => {
                      const nextValues = selected
                        ? selectedValues.filter((selectedValue) => !Object.is(selectedValue, value))
                        : [...selectedValues, value];
                      onSelectionChange(nextValues);
                    }}
                  >
                    <input className={CLSS.checkbox} type="checkbox" checked={selected} readOnly />
                    <span className={CLSS.filterLabel} title={label}>
                      {label}
                    </span>
                    {/* {selected && <span className={CLSS.selectedBadge}>Selected</span>} */}
                    <span className={CLSS.filterCount}>{count}</span>
                  </Menu.Item>
                );
              })
            ) : (
              <div className={CLSS.noValues}>No values available</div>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function Table<TData extends RowData>({
  data,
  columns,
  className,
  emptyMessage = 'No results.',
  initialState,
  rowProps,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(() => initialState?.sorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    () => initialState?.columnFilters ?? [],
  );
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
    () => initialState?.columnSizing ?? {},
  );
  const [filterSelections, setFilterSelections] = useState<Record<string, unknown[]>>(() =>
    Object.fromEntries(
      (initialState?.columnFilters ?? []).map(({ id, value }) => [
        id,
        Array.isArray(value) ? value : [value],
      ]),
    ),
  );

  const table = useReactTable({
    data,
    columns,
    initialState,
    defaultColumn: { enableColumnFilter: false, filterFn: multiValueFilter },
    state: { sorting, columnFilters, columnSizing },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className={cn(CLSS.wrapper, className)}>
      <table className={CLSS.table}>
        <thead className="z-1">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={CLSS.thead}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const columnValues = header.column.getCanFilter()
                  ? Array.from(header.column.getFacetedUniqueValues().entries())
                  : [];
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                    className={CLSS.header}
                  >
                    {header.isPlaceholder ? null : (
                      <div className={CLSS.headerContent}>
                        <button
                          type="button"
                          className={cn(
                            CLSS.sortButton,
                            header.column.getCanSort() && CLSS.sortButtonActive,
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          title={header.column.getCanSort() ? 'Toggle sorting' : undefined}
                        >
                          <span className={CLSS.headerLabel}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {sorted === 'asc' && <ArrowUp size="1.2em" weight="bold" />}
                          {sorted === 'desc' && <ArrowDown size="1.2em" weight="bold" />}
                        </button>

                        <div className={CLSS.headerActions}>
                          {header.column.getIsFiltered() && (
                            <span className={CLSS.activeFilterBadge} title="Active filter values">
                              {Array.isArray(header.column.getFilterValue())
                                ? (header.column.getFilterValue() as unknown[]).length
                                : 1}
                            </span>
                          )}
                          <ColumnFilter
                            column={header.column}
                            selectedValues={filterSelections[header.column.id] ?? []}
                            values={columnValues}
                            onSelectionChange={(nextValues) => {
                              setFilterSelections((current) => ({
                                ...current,
                                [header.column.id]: nextValues,
                              }));
                              const allOptionsSelected =
                                nextValues.length > 0 &&
                                columnValues.length > 0 &&
                                columnValues.every(([option]) =>
                                  nextValues.some((selectedValue) =>
                                    Object.is(selectedValue, option),
                                  ),
                                );
                              header.column.setFilterValue(
                                nextValues.length && !allOptionsSelected ? nextValues : undefined,
                              );
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          CLSS.resizer,
                          header.column.getIsResizing() && CLSS.resizerActive,
                        )}
                        title="Drag to resize; double-click to reset"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="z-0">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row, index) => (
              <tr {...rowProps?.(row.original, index, row)} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }} className={CLSS.cell}>
                    <div
                      className={CLSS.cell}
                      title={
                        typeof cell.getValue() === 'string'
                          ? (cell.getValue() as string)
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length} className={CLSS.emptyCell}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
