import { FileText, Handshake, Plane, Receipt, ShoppingCart, type LucideIcon } from 'lucide-react';
import type { RequestType } from '../data/types';
import { cn } from '@repo/ui';

const ICONS: Record<string, LucideIcon> = { purchase: ShoppingCart, leave: Plane, expense: Receipt, contract: Handshake };
const TONES: Record<string, string> = {
  purchase: 'bg-info-subtle text-info-subtle-fg',
  leave: 'bg-success-subtle text-success-subtle-fg',
  expense: 'bg-warning-subtle text-warning-subtle-fg',
  contract: 'bg-primary-subtle text-primary-subtle-fg',
};

/** A small tinted square with the request type's icon. Decorative. */
export function RequestIcon({ type, className }: { type: RequestType; className?: string }) {
  // Types an admin created get a generic document icon.
  const Icon = ICONS[type] ?? FileText;
  return (
    <span aria-hidden className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-md [&_svg]:size-4', TONES[type] ?? 'bg-surface-sunken text-fg-muted', className)}>
      <Icon />
    </span>
  );
}
