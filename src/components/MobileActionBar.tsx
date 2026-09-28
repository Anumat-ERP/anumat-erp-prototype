import { cn } from '@repo/ui';
import type { ReactNode } from 'react';
import { useTour } from './DemoTour';

/**
 * The page's main actions, pinned to the bottom of the screen on phones and
 * tablets where the header buttons have scrolled out of thumb's reach. Hidden
 * on large screens (the page header has them) and during the demo tour (its
 * panel owns the bottom of the screen). Leaves a spacer so it never covers
 * the end of the page.
 */
export function MobileActionBar({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const { step } = useTour();
  if (step !== null) return null;
  return (
    <>
      <div aria-hidden className="h-20 lg:hidden" />
      <div
        role="region"
        aria-label={label}
        className={cn(
          'an-bar-in fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-surface/95 px-4 pt-3 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] backdrop-blur lg:hidden',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))] [&>*]:flex-1',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
