import {
  Drawer as MuiDrawer,
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { IconButton } from './button';
import { ModalFooterActions, type ModalFooterActionsProps } from './modal';
export interface DrawerProps extends ModalFooterActionsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  trigger?: ReactNode;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}
export function Drawer({
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  trigger,
  title,
  hideTitle,
  description,
  side = 'right',
  size = 'md',
  children,
  className,
  ...actions
}: DrawerProps) {
  const [local, setLocal] = useState(defaultOpen);
  const id = useId();
  const open = controlled ?? local;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  return (
    <>
      {trigger ? <span onClick={() => setOpen(true)}>{trigger}</span> : null}
      <MuiDrawer
        anchor={side}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            className,
            sx: {
              width: {
                xs: '100%',
                sm: size === 'sm' ? 320 : size === 'lg' ? 640 : 480,
              },
              maxWidth: '100vw',
            },
          },
        }}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-description` : undefined}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <h2
              id={`${id}-title`}
              className={hideTitle ? 'sr-only' : 'text-xl font-semibold'}
            >
              {title}
            </h2>
            <IconButton
              icon={<X size={20} />}
              label="Close"
              onClick={() => setOpen(false)}
            />
          </DialogTitle>
          <DialogContent sx={{ flex: 1 }}>
            {description ? (
              <p id={`${id}-description`} className="mb-4 text-fg-muted">
                {description}
              </p>
            ) : null}
            {children}
          </DialogContent>
          {actions.footer ||
          actions.primaryAction ||
          actions.secondaryActions?.length ? (
            <DialogActions sx={{ px: 3, pb: 3, flexWrap: 'wrap', gap: 1 }}>
              <ModalFooterActions {...actions} />
            </DialogActions>
          ) : null}
        </Box>
      </MuiDrawer>
    </>
  );
}
