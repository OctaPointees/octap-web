import { Menu } from '@base-ui/react';
import { Button } from '@octap/shared/components';
import { cn } from '@octap/shared/utils';
import { CheckCircle, Circle } from 'phosphor-react';

/** A side panel button that opens a list of table columns to show or hide. */
export function ColumnMenu({
  columns,
  hidden,
  onToggle,
}: {
  columns: readonly string[];
  hidden: ReadonlySet<string>;
  onToggle: (column: string) => void;
}) {
  const shown = columns.filter((column) => !hidden.has(column)).length;

  return (
    <Menu.Root>
      <Menu.Trigger
        render={(props) => (
          <Button {...props}>
            <div className="flex-1 text-left">Display Columns</div>
            <div>{shown}</div>
          </Button>
        )}
      />

      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup className="menu rounded-box z-5 w-(--anchor-width) *:btn-sm">
            {columns.map((column) => {
              const visible = !hidden.has(column);
              const Icon = visible ? CheckCircle : Circle;
              return (
                <Menu.Item
                  key={column}
                  closeOnClick={false}
                  onClick={() => onToggle(column)}
                  render={(props) => (
                    <Button {...props} className={cn({ 'text-primary': visible })}>
                      <div className="flex-1 text-left">{column}</div>
                      <Icon size="1.5em" />
                    </Button>
                  )}
                />
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
