import {
  Accordion as MuiAccordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
const Context = createContext<{
  values: string[];
  toggle: (value: string) => void;
} | null>(null);
const ItemContext = createContext('');
export interface AccordionProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  type: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  variant?: 'card' | 'flush';
}
export function Accordion({
  type,
  value,
  defaultValue,
  onValueChange,
  collapsible,
  variant: _variant,
  children,
  ...props
}: AccordionProps) {
  const [local, setLocal] = useState<string | string[]>(
    defaultValue ?? (type === 'single' ? '' : []),
  );
  const current = value ?? local;
  const values = Array.isArray(current) ? current : current ? [current] : [];
  const toggle = (item: string) => {
    if (type === 'single' && values.includes(item) && !collapsible) return;
    const next =
      type === 'single'
        ? values.includes(item)
          ? ''
          : item
        : values.includes(item)
        ? values.filter((v) => v !== item)
        : [...values, item];
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  return (
    <Context.Provider value={{ values, toggle }}>
      <div {...props}>{children}</div>
    </Context.Provider>
  );
}
export function AccordionItem({
  value,
  children,
  ...props
}: Omit<ComponentPropsWithRef<'div'>, 'onChange'> & { value: string }) {
  const c = useContext(Context)!;
  return (
    <ItemContext.Provider value={value}>
      <MuiAccordion
        expanded={c.values.includes(value)}
        onChange={() => c.toggle(value)}
        disableGutters
        elevation={0}
        {...props}
      >
        {children ?? <span />}
      </MuiAccordion>
    </ItemContext.Provider>
  );
}
export function AccordionTrigger({
  headingAs: _heading,
  suffix,
  children,
  ...props
}: ComponentPropsWithRef<'button'> & {
  headingAs?: string;
  suffix?: ReactNode;
}) {
  return (
    <AccordionSummary
      component="button"
      expandIcon={<ChevronDown size={18} />}
      {...props}
    >
      {children}
      {suffix}
    </AccordionSummary>
  );
}
export function AccordionContent(props: ComponentPropsWithRef<'div'>) {
  return <AccordionDetails {...props} />;
}
