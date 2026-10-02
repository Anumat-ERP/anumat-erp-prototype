import { ChevronDown } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface AccordionProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'dir'> {
  type: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  variant?: 'card' | 'flush';
}

/** Sections that expand in place (FAQ, settings groups). */
export function Accordion({
  type,
  value,
  defaultValue,
  onValueChange,
  collapsible,
  variant = 'flush',
  className,
  children,
  ...props
}: AccordionProps) {
  const [local, setLocal] = useState<string | string[]>(
    defaultValue ?? (type === 'single' ? '' : []),
  );
  const current = value ?? local;
  const change = (next: string | string[]) => {
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  const classes = cn(
    variant === 'card' && 'rounded-xl border border-border bg-card px-5',
    className,
  );
  return type === 'single' ? (
    <AccordionPrimitive.Root
      type="single"
      collapsible={collapsible}
      value={Array.isArray(current) ? current[0] ?? '' : current}
      onValueChange={change}
      className={classes}
      {...props}
    >
      {children}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root
      type="multiple"
      value={Array.isArray(current) ? current : current ? [current] : []}
      onValueChange={change}
      className={classes}
      {...props}
    >
      {children}
    </AccordionPrimitive.Root>
  );
}

export function AccordionItem({
  value,
  className,
  children,
  ...props
}: Omit<ComponentPropsWithRef<'div'>, 'onChange'> & { value: string }) {
  return (
    <AccordionPrimitive.Item
      value={value}
      className={cn('border-b border-border last:border-b-0', className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

export function AccordionTrigger({
  headingAs: _heading,
  suffix,
  className,
  children,
  ...props
}: ComponentPropsWithRef<'button'> & {
  headingAs?: string;
  suffix?: ReactNode;
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'group flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-start text-md font-medium',
          'hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {suffix}
        <ChevronDown
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-(--a-duration-base) group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <AccordionPrimitive.Content className="overflow-hidden text-sm text-muted-foreground" {...props}>
      <div className={cn('pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
