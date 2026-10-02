import { Card as MuiCard, Typography } from '@mui/material';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
export interface CardProps extends ComponentPropsWithoutRef<'section'> {
  as?: ElementType;
  flush?: boolean;
  tone?: 'default' | 'muted';
}
export function Card({
  as = 'section',
  flush,
  tone = 'default',
  ...props
}: CardProps) {
  return (
    <MuiCard
      component={as}
      variant="outlined"
      sx={{
        p: flush ? 0 : { xs: 2.5, sm: 3.5 },
        bgcolor:
          tone === 'muted'
            ? 'var(--a-color-surface-muted)'
            : 'background.paper',
      }}
      {...props}
    />
  );
}
export interface CardHeaderProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode;
  headingAs?: 'h2' | 'h3' | 'h4';
  description?: ReactNode;
  actions?: ReactNode;
}
export function CardHeader({
  title,
  headingAs = 'h2',
  description,
  actions,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className ?? ''}`}
      {...props}
    >
      <div className="min-w-0">
        <Typography component={headingAs} variant="h6">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary">{description}</Typography>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
