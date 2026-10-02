import { Tabs as MuiTabs, Tab, Box } from '@mui/material';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
const Context = createContext<{
  value: string;
  setValue: (value: string) => void;
  id: string;
  manual: boolean;
} | null>(null);
function useTabs() {
  const c = useContext(Context);
  if (!c) throw new Error('Tabs children require Tabs');
  return c;
}
export interface TabsProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: 'automatic' | 'manual';
  orientation?: 'horizontal' | 'vertical';
}
export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  activationMode = 'automatic',
  orientation: _orientation,
  className,
  children,
  ...props
}: TabsProps) {
  const [local, setLocal] = useState(defaultValue);
  const id = useId();
  return (
    <Context.Provider
      value={{
        value: value ?? local,
        setValue: (next) => {
          if (value === undefined) setLocal(next);
          onValueChange?.(next);
        },
        id,
        manual: activationMode === 'manual',
      }}
    >
      <div className={className} {...props}>
        {children}
      </div>
    </Context.Provider>
  );
}
export interface TabsListProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  fitted?: boolean;
}
export function TabsList({
  fitted,
  children,
  className,
  ...props
}: TabsListProps) {
  const c = useTabs();
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as React.ReactElement<TabsTriggerProps>[];
  return (
    <MuiTabs
      value={tabs.some((t) => t.props.value === c.value) ? c.value : false}
      onChange={(_, value: string) => c.setValue(value)}
      variant={fitted ? 'fullWidth' : 'scrollable'}
      scrollButtons={false}
      allowScrollButtonsMobile
      selectionFollowsFocus={!c.manual}
      className={className}
      sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
      {...props}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.props.value}
          value={tab.props.value}
          id={`${c.id}-tab-${tab.props.value}`}
          aria-controls={`${c.id}-panel-${tab.props.value}`}
          disabled={tab.props.disabled}
          className={tab.props.className}
          label={
            <span className="inline-flex items-center gap-2">
              {tab.props.children}
              {tab.props.badge !== undefined ? (
                <span
                  aria-label={tab.props.badgeLabel}
                  className="rounded-full bg-surface-sunken px-1.5 text-xs tabular-nums"
                >
                  {tab.props.badge}
                </span>
              ) : null}
            </span>
          }
        />
      ))}
    </MuiTabs>
  );
}
export interface TabsTriggerProps extends ComponentPropsWithRef<'button'> {
  value: string;
  badge?: ReactNode;
  badgeLabel?: string;
}
export function TabsTrigger(_props: TabsTriggerProps) {
  return null;
}
export function TabsContent({
  value,
  forceMount,
  children,
  ...props
}: ComponentPropsWithRef<'div'> & { value: string; forceMount?: boolean }) {
  const c = useTabs();
  if (c.value !== value && !forceMount) return null;
  return (
    <Box
      role="tabpanel"
      id={`${c.id}-panel-${value}`}
      aria-labelledby={`${c.id}-tab-${value}`}
      hidden={c.value !== value}
      tabIndex={0}
      sx={{ pt: 2 }}
      {...props}
    >
      {children}
    </Box>
  );
}
