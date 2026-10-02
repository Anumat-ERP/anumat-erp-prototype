const STORAGE_KEY = 'anumat-module-catalog-seen-v1';

function seenWorkspaces(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function workspaceEntryPath(workspaceId: string): string {
  return seenWorkspaces().includes(workspaceId) ? '/home' : '/discover';
}

export function markModuleCatalogSeen(workspaceId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...seenWorkspaces(), workspaceId])]));
  } catch {
    // Browsing the catalog still works without persistent storage.
  }
}
