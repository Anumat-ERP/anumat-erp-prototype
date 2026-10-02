import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button, IconButton } from './button';
export interface ModalAction {
  content: string;
  onAction?: () => void;
  loading?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}
export interface ModalFooterActionsProps {
  primaryAction?: ModalAction;
  secondaryActions?: ModalAction[];
  footer?: ReactNode;
}
export interface ModalProps extends ModalFooterActionsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  trigger?: ReactNode;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: ReactNode;
  className?: string;
}
export function ModalFooterActions({
  primaryAction,
  secondaryActions,
  footer,
}: ModalFooterActionsProps) {
  return (
    <>
      {footer}
      {secondaryActions?.map((action) => (
        <Button
          key={action.content}
          onClick={action.onAction}
          disabled={action.disabled}
          loading={action.loading}
          variant={action.destructive ? 'critical' : 'secondary'}
        >
          {action.content}
        </Button>
      ))}
      {primaryAction ? (
        <Button
          onClick={primaryAction.onAction}
          disabled={primaryAction.disabled}
          loading={primaryAction.loading}
          variant={primaryAction.destructive ? 'critical' : 'primary'}
        >
          {primaryAction.content}
        </Button>
      ) : null}
    </>
  );
}
export function Modal({
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  trigger,
  title,
  hideTitle,
  description,
  size = 'md',
  children,
  className,
  ...actions
}: ModalProps) {
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
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={
          size === 'sm'
            ? 'xs'
            : size === 'md'
            ? 'sm'
            : size === 'lg'
            ? 'md'
            : 'lg'
        }
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        slotProps={{ paper: { className } }}
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
        <DialogContent>
          {description ? (
            <DialogContentText id={`${id}-description`} sx={{ mb: 2 }}>
              {description}
            </DialogContentText>
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
      </Dialog>
    </>
  );
}
