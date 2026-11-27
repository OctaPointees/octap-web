import { useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
  Check,
  DotsSixVertical,
  EyeSlash,
  Plus,
  SquaresFour,
} from 'phosphor-react';
import { Button } from '@octap/shared/components';
import { cn } from '@/utils/cn';
import {
  useGridColumns,
  type DashboardLayoutControls,
  type PartSize,
  type PartSpec,
} from '../hooks/useDashboardLayout';
import { GRID } from '../grid';

/** One part of a dashboard that its viewer can move, resize or hide. */
export interface DashboardPart extends PartSpec {
  /** Names the part's controls while arranging, and the button that brings it back. */
  title: string;
  node: ReactNode;
}

/** Arrange, or Reset and Done while arranging. Goes in the page header. */
export function ArrangeControls({
  arranging,
  onArrangingChange,
  layout,
}: {
  arranging: boolean;
  onArrangingChange: (arranging: boolean) => void;
  layout: DashboardLayoutControls;
}) {
  if (!arranging)
    return (
      <Button className="btn-ghost btn-sm" onClick={() => onArrangingChange(true)}>
        <SquaresFour size={16} className="mr-1.5" /> Arrange
      </Button>
    );
  return (
    <>
      <Button className="btn-ghost btn-sm" disabled={layout.isDefault} onClick={layout.reset}>
        <ArrowCounterClockwise size={16} className="mr-1.5" /> Reset
      </Button>
      <Button className="btn-primary btn-sm" onClick={() => onArrangingChange(false)}>
        <Check size={16} className="mr-1.5" /> Done
      </Button>
    </>
  );
}

const tool = 'btn btn-ghost btn-xs btn-square';
/** Sortable without shuffling the others while dragging: the drop target lights up instead. */
const noShuffle = () => null;

/** The size of one grid cell and the gap between cells, in pixels, read from the grid itself. */
function measureCell(grid: HTMLElement, columns: number) {
  const style = getComputedStyle(grid);
  const gap = parseFloat(style.columnGap) || 0;
  const row = parseFloat(style.gridAutoRows) || 80;
  const width = (grid.clientWidth - gap * (columns - 1)) / columns;
  return { width, row, gap };
}

function SortablePart({
  part,
  arranging,
  columns,
  first,
  last,
  layout,
  grid,
}: {
  part: DashboardPart;
  arranging: boolean;
  columns: number;
  first: boolean;
  last: boolean;
  layout: DashboardLayoutControls;
  grid: RefObject<HTMLDivElement | null>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, isOver, node } =
    useSortable({ id: part.id, disabled: !arranging });
  // While resizing, a silhouette shows the size it will snap to; the part changes on release.
  const [preview, setPreview] = useState<{ size: PartSize; width: number; height: number } | null>(
    null,
  );
  const size = layout.sizeOf(part.id);
  const sized = columns > 1;

  /** The whole-cell size under the pointer, kept to the columns left of this part's row. */
  const previewFromPointer = (event: React.PointerEvent) => {
    if (!grid.current || !node.current) return null;
    const cell = measureCell(grid.current, columns);
    const box = node.current.getBoundingClientRect();
    const column = Math.round(
      (box.left - grid.current.getBoundingClientRect().left) / (cell.width + cell.gap),
    );
    const fitted = layout.fit(part.id, {
      w: (event.clientX - box.left + cell.gap) / (cell.width + cell.gap),
      h: (event.clientY - box.top + cell.gap) / (cell.row + cell.gap),
    });
    const next = { w: Math.min(fitted.w, columns - column), h: fitted.h };
    return {
      size: next,
      width: next.w * cell.width + (next.w - 1) * cell.gap,
      height: next.h * cell.row + (next.h - 1) * cell.gap,
    };
  };
  const label = `${part.title}, ${Math.min(size.w, columns)} of ${columns} columns wide, ${size.h} rows tall`;

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `span ${Math.min(size.w, columns)}`,
        gridRow: sized ? `span ${size.h}` : undefined,
      }}
      className={cn(
        'relative min-w-0 rounded-box',
        arranging && 'outline-2 outline-offset-2 outline-base-content/20 outline-dashed',
        (isOver || preview) && !isDragging && 'outline-primary outline-solid',
        preview && 'z-20',
        // The slot it leaves behind, like a placeholder, until it lands.
        isDragging && 'bg-primary/10 outline-primary',
      )}
    >
      {/* While arranging, the part is a preview: nothing inside it can be clicked or focused. */}
      <div
        inert={arranging}
        className={cn(
          '@container',
          // `relative` so positioned content inside scrolls and clips with the part too.
          sized && 'relative h-full overflow-auto rounded-box [&>*]:min-h-full',
          arranging && 'pointer-events-none select-none',
          isDragging && 'invisible',
        )}
      >
        {part.node}
      </div>

      {arranging && !isDragging && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-field border border-base-300 bg-base-100 p-0.5 shadow-sm">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className={cn(tool, 'cursor-grab touch-none active:cursor-grabbing')}
            aria-label={`Drag ${part.title}`}
            title="Drag to move"
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical size={18} weight="bold" />
          </button>
          <button
            type="button"
            className={tool}
            disabled={first}
            aria-label={`Move ${part.title} earlier`}
            title="Move earlier"
            onClick={() => layout.step(part.id, -1)}
          >
            <CaretUp size={16} />
          </button>
          <button
            type="button"
            className={tool}
            disabled={last}
            aria-label={`Move ${part.title} later`}
            title="Move later"
            onClick={() => layout.step(part.id, 1)}
          >
            <CaretDown size={16} />
          </button>
          <button
            type="button"
            className={tool}
            aria-label={`Hide ${part.title}`}
            title="Hide"
            onClick={() => layout.hide(part.id)}
          >
            <EyeSlash size={16} />
          </button>
        </div>
      )}

      {preview && (
        // The size it will take, from its top-left corner, snapped to whole cells.
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-20 flex items-center justify-center rounded-box border-2 border-primary bg-primary/15 motion-safe:transition-[width,height] motion-safe:duration-100 motion-safe:ease-out"
          style={{ width: preview.width, height: preview.height }}
        >
          <span className="badge badge-primary tabular-nums shadow-sm">
            {preview.size.w} × {preview.size.h}
          </span>
        </span>
      )}

      {arranging && sized && !isDragging && (
        // Drag to resize in whole cells, or use the arrow keys: left and right for width, up and
        // down for height.
        <button
          type="button"
          aria-label={`Resize ${label}`}
          title="Drag to resize"
          className="absolute right-0 bottom-0 z-10 flex size-6 cursor-nwse-resize touch-none items-end justify-end rounded-br-box p-1 text-base-content/60 outline-none hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary"
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setPreview(previewFromPointer(event));
          }}
          onPointerMove={(event) => {
            if (preview) setPreview(previewFromPointer(event));
          }}
          onPointerUp={(event) => {
            if (!preview) return;
            layout.resize(part.id, previewFromPointer(event)?.size ?? preview.size);
            setPreview(null);
          }}
          onPointerCancel={() => setPreview(null)}
          onKeyDown={(event) => {
            const change: Record<string, PartSize> = {
              ArrowLeft: { w: -1, h: 0 },
              ArrowRight: { w: 1, h: 0 },
              ArrowUp: { w: 0, h: -1 },
              ArrowDown: { w: 0, h: 1 },
            };
            const by = change[event.key];
            if (!by) return;
            event.preventDefault();
            layout.resize(part.id, {
              w: Math.min(size.w + by.w, columns),
              h: size.h + by.h,
            });
          }}
        >
          <svg viewBox="0 0 10 10" className="size-3" aria-hidden>
            <path d="M9 1 1 9M9 5 5 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * A dashboard's parts on a grid, in the viewer's order and sizes: four columns on wide screens,
 * two on tablets, one on phones. While arranging, the grid shows, and each part can be dragged
 * (or moved with its arrows or the keyboard on its handle), resized by whole cells from its
 * corner, and hidden; hidden parts are listed underneath to bring back.
 */
export function ArrangeableParts({
  parts,
  layout,
  arranging,
}: {
  parts: DashboardPart[];
  layout: DashboardLayoutControls;
  arranging: boolean;
}) {
  const columns = useGridColumns();
  const grid = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const sensors = useSensors(
    // A few pixels of movement first, so a click on the handle doesn't start a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const byId = new Map(parts.map((part) => [part.id, part]));
  const visible = layout.visible.flatMap((id) => byId.get(id) ?? []);
  const hidden = layout.hidden.flatMap((id) => byId.get(id) ?? []);
  const active = dragging ? byId.get(dragging) : undefined;
  const sized = columns > 1;
  const template = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: sized ? 'var(--dash-row)' : 'auto',
  };

  return (
    <>
      {!visible.length && !arranging && (
        <p className="rounded-box border border-dashed border-base-300 p-6 text-center text-sm opacity-65">
          Every part of this dashboard is hidden. Choose Arrange to show them again.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active: start }) => setDragging(String(start.id))}
        onDragCancel={() => setDragging(null)}
        onDragEnd={({ active: end, over }) => {
          setDragging(null);
          if (over) layout.moveTo(String(end.id), String(over.id));
        }}
      >
        <SortableContext items={visible.map((part) => part.id)} strategy={noShuffle}>
          <div
            className={cn(
              'relative',
              arranging && sized && 'pb-[calc(var(--dash-row)+var(--dash-gap))]',
            )}
            style={{ '--dash-row': GRID.rowHeight, '--dash-gap': GRID.gap } as CSSProperties}
          >
            {arranging && sized && (
              // The empty grid behind the parts, so sizes and places read in whole cells.
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid gap-(--dash-gap) overflow-hidden"
                style={template}
              >
                {Array.from({ length: columns * 40 }, (_, cell) => (
                  <span
                    key={cell}
                    className="rounded-box border border-dashed border-base-content/10 bg-base-content/[0.02]"
                  />
                ))}
              </div>
            )}
            <div
              ref={grid}
              className="relative grid grid-flow-dense gap-(--dash-gap)"
              style={template}
            >
              {visible.map((part, index) => (
                <SortablePart
                  key={part.id}
                  part={part}
                  arranging={arranging}
                  columns={columns}
                  first={index === 0}
                  last={index === visible.length - 1}
                  layout={layout}
                  grid={grid}
                />
              ))}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {active && (
            <div className="flex size-full cursor-grabbing items-start gap-2 rounded-box border-2 border-primary bg-base-100/90 p-4 shadow-xl">
              <DotsSixVertical size={18} weight="bold" className="text-primary" aria-hidden />
              <span className="font-semibold">{active.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {arranging && hidden.length > 0 && (
        <section
          aria-label="Hidden parts"
          className="flex flex-wrap items-center gap-2 rounded-box border border-dashed border-base-300 p-4"
        >
          <span className="mr-1 text-sm opacity-65">Hidden</span>
          {hidden.map((part) => (
            <Button
              key={part.id}
              className="btn-sm btn-outline font-normal"
              onClick={() => layout.show(part.id)}
            >
              <Plus size={14} className="mr-1" /> {part.title}
            </Button>
          ))}
        </section>
      )}
    </>
  );
}
