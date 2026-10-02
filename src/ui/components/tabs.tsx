import { Tabs as TabsPrimitive } from 'radix-ui';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';

const Context = createContext<{
  value: string;
  hasPanels: boolean;
  setHasPanels: (next: boolean) => void;
} | null>(null);

function useTabs() {
  const c = useContext(Context);
  if (!c) throw new Error('Tabs children require Tabs');
  return c;
}

export interface TabsProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'dir'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: 'automatic' | 'manual';
  orientation?: 'horizontal' | 'vertical';
}

/** Switch between views of the same thing (shadcn Tabs). Arrow keys move between tabs. */
export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  activationMode = 'automatic',
  orientation = 'horizontal',
  className,
  children,
  ...props
}: TabsProps) {
  const [local, setLocal] = useState(defaultValue);
  const [hasPanels, setHasPanels] = useState(false);
  const current = value ?? local;
  return (
    <Context.Provider value={{ value: current, hasPanels, setHasPanels }}>
      <TabsPrimitive.Root
        value={current}
        onValueChange={(next) => {
          if (value === undefined) setLocal(next);
          onValueChange?.(next);
        }}
        activationMode={activationMode}
        orientation={orientation}
        className={cn('flex flex-col gap-3', className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </Context.Provider>
  );
}

export interface TabsListProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Stretch the tabs to fill the row. */
  fitted?: boolean;
}

export function TabsList({ fitted, children, className, ...props }: TabsListProps) {
  const c = useTabs();
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as React.ReactElement<TabsTriggerProps>[];
  return (
    <div className={cn('max-w-full overflow-x-auto', fitted && 'w-full')}>
      <TabsPrimitive.List
        className={cn(
          'inline-flex h-9 items-center rounded-lg bg-muted p-[3px] text-muted-foreground',
          fitted && 'grid w-full auto-cols-fr grid-flow-col',
          className,
        )}
        {...props}
      >
        {tabs.map((tab) => {
          const { value, badge, badgeLabel, className: tabClass, children: label, ...rest } = tab.props;
          return (
            <TabsPrimitive.Trigger
              key={value}
              value={value}
              {...rest}
              // Tabs used as a view filter render no panels; don't point at panels that don't exist.
              {...(c.hasPanels ? {} : { 'aria-controls': undefined })}
              className={cn(
                'inline-flex h-full items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap',
                'transition-colors duration-(--a-duration-fast) ease-standard hover:text-foreground',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs',
                'disabled:pointer-events-none disabled:opacity-50',
                tabClass,
              )}
            >
              {label}
              {badge !== undefined ? (
                <span
                  aria-label={badgeLabel}
                  className="rounded-full bg-background px-1.5 text-xs tabular-nums text-foreground"
                >
                  {badge}
                </span>
              ) : null}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
    </div>
  );
}

export interface TabsTriggerProps extends ComponentPropsWithRef<'button'> {
  value: string;
  badge?: ReactNode;
  badgeLabel?: string;
}

/** Declares a tab; TabsList renders it. */
export function TabsTrigger(_props: TabsTriggerProps) {
  return null;
}

export function TabsContent({
  value,
  forceMount,
  children,
  className,
  ...props
}: ComponentPropsWithRef<'div'> & { value: string; forceMount?: boolean }) {
  const { setHasPanels } = useTabs();
  useEffect(() => setHasPanels(true), [setHasPanels]);
  return (
    <TabsPrimitive.Content
      value={value}
      forceMount={forceMount || undefined}
      className={cn(
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=inactive]:hidden',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
