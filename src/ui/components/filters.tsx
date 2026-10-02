import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
export interface FilterDefinition {
  key: string;
  label: string;
  filter: ReactNode;
  pinned?: boolean;
  disabled?: boolean;
}
export interface AppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}
export interface FiltersProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  filters: FilterDefinition[];
  appliedFilters: AppliedFilter[];
  onClearAll: () => void;
  queryValue?: string;
  onQueryChange?: (value: string) => void;
  onQueryClear?: () => void;
  queryPlaceholder?: string;
  queryLabel?: string;
  debounceMs?: number;
  loading?: boolean;
  hideQueryField?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}
export function Filters({
  filters,
  appliedFilters,
  onClearAll,
  queryValue,
  onQueryChange,
  onQueryClear,
  queryPlaceholder = 'Search',
  queryLabel,
  debounceMs: _debounce,
  loading: _loading,
  hideQueryField,
  disabled,
  children,
  className,
  ...props
}: FiltersProps) {
  return (
    <div className={className} data-slot="filters" {...props}>
      <div className="flex flex-wrap items-center gap-2">
        {!hideQueryField ? (
          <Input
            type="search"
            size="sm"
            aria-label={queryLabel ?? queryPlaceholder}
            placeholder={queryPlaceholder}
            value={queryValue}
            onChange={(e) => onQueryChange?.(e.target.value)}
            onClear={onQueryClear}
            disabled={disabled}
            className="min-w-48 flex-1"
          />
        ) : null}
        {children}
      </div>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-label="Filters"
      >
        {filters.map((filter) => {
          const applied = appliedFilters.find((a) => a.key === filter.key);
          return (
            <div key={filter.key} className="inline-flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" disabled={disabled || filter.disabled}>
                    {filter.label}
                    {applied ? `: ${applied.label}` : ''}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="mb-3 font-semibold">{filter.label}</p>
                  {filter.filter}
                </PopoverContent>
              </Popover>
              {applied ? (
                <Button
                  variant="plain"
                  size="sm"
                  onClick={applied.onRemove}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          );
        })}
        {appliedFilters.length > 0 || queryValue ? (
          <Button
            variant="plain"
            size="sm"
            disabled={disabled}
            onClick={onClearAll}
          >
            Clear all
          </Button>
        ) : null}
      </div>
      <span className="sr-only" aria-live="polite">
        {appliedFilters.length} filters applied
      </span>
    </div>
  );
}
