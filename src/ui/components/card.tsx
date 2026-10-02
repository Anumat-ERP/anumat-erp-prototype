import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends ComponentPropsWithoutRef<'section'> {
  as?: ElementType;
  /** No padding: the header and rows bring their own (tables, lists). */
  flush?: boolean;
  tone?: 'default' | 'muted';
}

/** A grouped surface. Bordered, quiet, no floating shadow. */
export function Card({
  as: Component = 'section',
  flush,
  tone = 'default',
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'min-w-0 rounded-xl border border-border text-card-foreground shadow-card',
        tone === 'muted' ? 'bg-muted' : 'bg-card',
        !flush && 'p-5 sm:p-6',
        className,
      )}
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
  headingAs: Heading = 'h2',
  description,
  actions,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4', className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading className="text-md leading-snug font-semibold text-foreground">
          {title}
        </Heading>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
