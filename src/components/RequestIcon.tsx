import { FileText, Handshake, Plane, Receipt, ShoppingCart, type LucideIcon } from 'lucide-react';
import type { RequestType } from '../data/types';
import { cn } from '@repo/ui';

const ICONS: Record<string, LucideIcon> = { purchase: ShoppingCart, leave: Plane, expense: Receipt, contract: Handshake };

/** A small neutral square with the request type's icon. Decorative; the type name next to it carries the meaning. */
export function RequestIcon({ type, className }: { type: RequestType; className?: string }) {
  // Types an admin created get a generic document icon.
  const Icon = ICONS[type] ?? FileText;
  return (
    <span aria-hidden className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-muted text-fg-muted [&_svg]:size-4', className)}>
      <Icon />
    </span>
  );
}
