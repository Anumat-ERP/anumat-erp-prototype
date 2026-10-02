import { Alert, AlertTitle } from '@mui/material';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Button } from './button';
export type BannerTone = 'info' | 'success' | 'warning' | 'critical';
export interface BannerAction {
  label: string;
  onAction?: () => void;
  href?: string;
}
export interface BannerProps
  extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'role' | 'color'> {
  tone?: BannerTone;
  title?: ReactNode;
  action?: BannerAction;
  secondaryAction?: BannerAction;
  onDismiss?: () => void;
  inline?: boolean;
  icon?: ReactNode;
}
export function Banner({
  tone = 'info',
  title,
  action,
  secondaryAction,
  onDismiss,
  inline: _inline,
  icon,
  children,
  ...props
}: BannerProps) {
  return (
    <Alert
      severity={tone === 'critical' ? 'error' : tone}
      icon={icon}
      onClose={onDismiss}
      {...props}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children}
      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {[action, secondaryAction].filter(Boolean).map((a) => (
            <Button
              key={a!.label}
              variant="plain"
              onClick={a!.onAction}
              asChild={Boolean(a!.href)}
            >
              {a!.href ? <a href={a!.href}>{a!.label}</a> : a!.label}
            </Button>
          ))}
        </div>
      ) : null}
    </Alert>
  );
}
