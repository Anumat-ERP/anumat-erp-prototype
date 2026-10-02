import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { useLocale } from '../../i18n/LocaleProvider';

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
  /** Replaces the tone's icon; pass `false` for none. */
  icon?: ReactNode;
}

const TONES = {
  info: { box: 'border-border bg-accent/60', icon: 'text-primary', Icon: Info },
  success: { box: 'border-transparent bg-mint-subtle', icon: 'text-mint-subtle-foreground', Icon: CircleCheck },
  warning: { box: 'border-transparent bg-warning-subtle', icon: 'text-warning-subtle-fg', Icon: TriangleAlert },
  critical: { box: 'border-transparent bg-critical-subtle', icon: 'text-critical-subtle-fg', Icon: CircleAlert },
} as const;

/**
 * A message about the page or a section (shadcn Alert). Critical banners are
 * announced immediately; the others politely.
 */
export function Banner({
  tone = 'info',
  title,
  action,
  secondaryAction,
  onDismiss,
  inline,
  icon,
  className,
  children,
  ...props
}: BannerProps) {
  const { t: tr } = useLocale();
  const t = TONES[tone];
  const actions = [action, secondaryAction].filter(Boolean) as BannerAction[];
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={cn(
        'relative flex gap-3 rounded-lg border text-sm text-foreground',
        inline ? 'p-3' : 'px-4 py-3.5',
        t.box,
        className,
      )}
      {...props}
    >
      {icon === false ? null : (
        <span aria-hidden className={cn('mt-0.5 shrink-0 [&_svg]:size-4', t.icon)}>
          {icon ?? <t.Icon />}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-foreground/90">{children}</div> : null}
        {actions.length ? (
          <div className="mt-1.5 flex flex-wrap gap-3">
            {actions.map((a) => (
              <Button
                key={a.label}
                variant="plain"
                size="sm"
                onClick={a.onAction}
                asChild={Boolean(a.href)}
              >
                {a.href ? <a href={a.href}>{a.label}</a> : a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tr('Dismiss')}
          className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
