import { PanelLeft } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { IconButton } from './button';

const STORAGE_KEY = 'anumat-sidebar';

interface SidebarState {
  /** Desktop rail shows icons only. */
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  /** Phone/tablet navigation sheet is open. */
  mobileOpen: boolean;
  setMobileOpen: (next: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

function readCollapsed(defaultCollapsed: boolean) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? defaultCollapsed : saved === 'collapsed';
  } catch {
    return defaultCollapsed;
  }
}

/** Holds the sidebar's collapsed and mobile-open state; collapse is remembered on this device. */
export function SidebarProvider({
  defaultCollapsed = false,
  children,
}: {
  defaultCollapsed?: boolean;
  children?: ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(() => readCollapsed(defaultCollapsed));
  const [mobileOpen, setMobileOpen] = useState(false);
  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'collapsed' : 'expanded');
    } catch {
      // Still applies for this visit.
    }
  }, []);
  // ⌘B / Ctrl+B toggles the rail, as in shadcn's sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [collapsed, setCollapsed]);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/** The sidebar state; outside a provider the sidebar is expanded and has no sheet. */
export function useSidebar(): SidebarState {
  return (
    useContext(SidebarContext) ?? {
      collapsed: false,
      setCollapsed: () => {},
      mobileOpen: false,
      setMobileOpen: () => {},
    }
  );
}

/** Collapses or expands the desktop sidebar. */
export function SidebarTrigger({ label = 'Toggle sidebar', className }: { label?: string; className?: string }) {
  const { collapsed, setCollapsed } = useSidebar();
  return (
    <IconButton
      icon={<PanelLeft />}
      label={label}
      aria-expanded={!collapsed}
      aria-keyshortcuts="Meta+B Control+B"
      size="sm"
      className={className}
      onClick={() => setCollapsed(!collapsed)}
    />
  );
}

/** Renders its children as if the sidebar were expanded (used inside the phone sheet). */
export function SidebarExpanded({ children }: { children?: ReactNode }) {
  const state = useSidebar();
  return (
    <SidebarContext.Provider value={{ ...state, collapsed: false }}>
      {children}
    </SidebarContext.Provider>
  );
}
