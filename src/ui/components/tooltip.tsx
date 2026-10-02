import { Tooltip as MuiTooltip } from '@mui/material';
import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
const Delay = createContext(400);
export interface TooltipProviderProps {
  delayDuration?: number;
  skipDelayDuration?: number;
  children?: ReactNode;
}
export function TooltipProvider({
  delayDuration = 400,
  children,
}: TooltipProviderProps) {
  return <Delay.Provider value={delayDuration}>{children}</Delay.Provider>;
}
export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}
export function Tooltip({
  content,
  children,
  side = 'top',
  open,
  onOpenChange,
  delayDuration,
}: TooltipProps) {
  const delay = useContext(Delay);
  return (
    <MuiTooltip
      title={content}
      placement={side}
      arrow
      open={open}
      enterDelay={delayDuration ?? delay}
      onOpen={() => onOpenChange?.(true)}
      onClose={() => onOpenChange?.(false)}
    >
      {children}
    </MuiTooltip>
  );
}
