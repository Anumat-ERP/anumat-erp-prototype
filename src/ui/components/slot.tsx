import {
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from 'react';
import { cn } from '../lib/cn';

type SlotProps = HTMLAttributes<HTMLElement> & {
  element: ReactElement<
    HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }
  >;
};

/** Keep router anchors mounted and preserve their handlers when MUI styles them. */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { element, children, className, onClick, ...props },
  ref,
) {
  return cloneElement(element, {
    ...props,
    className: cn(element.props.className, className),
    children: children ?? element.props.children,
    onClick: (event) => {
      element.props.onClick?.(event);
      if (!event.defaultPrevented) onClick?.(event);
    },
    ref: (node) => {
      for (const target of [ref, element.props.ref]) {
        if (typeof target === 'function') target(node);
        else if (target) target.current = node;
      }
    },
  });
});
