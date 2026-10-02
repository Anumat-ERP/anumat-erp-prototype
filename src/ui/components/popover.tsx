import { Popover as MuiPopover } from '@mui/material';
import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
const Context = createContext<{
  anchor: HTMLElement | null;
  setAnchor: (el: HTMLElement | null) => void;
  open: boolean;
  setOpen: (next: boolean) => void;
  id: string;
} | null>(null);
function usePopover() {
  const context = useContext(Context);
  if (!context) throw new Error('Popover children require Popover');
  return context;
}
export function Popover({
  children,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
}: {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (next: boolean) => void;
}) {
  const [local, setLocal] = useState(defaultOpen);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  return (
    <Context.Provider
      value={{ anchor, setAnchor, open: controlled ?? local, setOpen, id }}
    >
      {children}
    </Context.Provider>
  );
}
export function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children?: ReactNode;
}) {
  const c = usePopover();
  const props = {
    'aria-expanded': c.open,
    'aria-controls': c.open ? c.id : undefined,
    'aria-haspopup': 'dialog' as const,
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      c.setAnchor(e.currentTarget);
      c.setOpen(!c.open);
    },
  };
  return asChild ? (
    <span {...props} className="inline-flex">
      {children}
    </span>
  ) : (
    <button type="button" {...props}>
      {children}
    </button>
  );
}
export interface PopoverContentProps extends ComponentPropsWithoutRef<'div'> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  arrow?: boolean;
  flush?: boolean;
}
export function PopoverContent({
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  arrow: _arrow,
  flush,
  className,
  children,
  ...props
}: PopoverContentProps) {
  const c = usePopover();
  const horizontal =
    align === 'end' ? 'right' : align === 'center' ? 'center' : 'left';
  return (
    <MuiPopover
      id={c.id}
      open={c.open && Boolean(c.anchor)}
      anchorEl={c.anchor}
      onClose={() => c.setOpen(false)}
      anchorOrigin={{ vertical: side === 'top' ? 'top' : 'bottom', horizontal }}
      transformOrigin={{
        vertical: side === 'top' ? 'bottom' : 'top',
        horizontal,
      }}
      slotProps={{
        paper: {
          sx: {
            mt: side === 'top' ? -sideOffset / 8 : sideOffset / 8,
            maxWidth: 'calc(100vw - 32px)',
          },
        },
      }}
    >
      <div className={className} style={{ padding: flush ? 0 : 16 }} {...props}>
        {children}
      </div>
    </MuiPopover>
  );
}
