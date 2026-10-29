export function formatDate(dateStringOrTimestamp: string | number | null): string {
  if (!dateStringOrTimestamp) return 'No date';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return String(dateStringOrTimestamp);
    return d.toISOString().slice(0, 10);
  } catch (_e) {
    return 'Invalid date';
  }
}

export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  if (diff < 10000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatDate(timestamp);
}
