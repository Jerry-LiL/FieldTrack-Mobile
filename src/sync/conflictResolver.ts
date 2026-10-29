import { SyncConflict } from '../types/sync';

export interface ConflictResolution<T> {
  winner: T | null;
  resolution: 'client_wins' | 'server_wins';
  explanation: string;
}

/**
 * Resolves conflicts between client and server records using Last-Write-Wins (LWW).
 * If client timestamp is greater than or equal to server timestamp, client wins.
 * Otherwise, server wins.
 */
export function resolveLastWriteWins<T extends { updatedAt?: number }>(
  clientRecord: T | null,
  clientTimestamp: number,
  serverRecord: T | null,
  serverTimestamp: number
): ConflictResolution<T> {
  if (!serverRecord) {
    return {
      winner: clientRecord,
      resolution: 'client_wins',
      explanation: 'No server record exists; client version accepted.',
    };
  }

  if (!clientRecord) {
    return {
      winner: serverRecord,
      resolution: 'server_wins',
      explanation: 'Client record was deleted or empty; server version retained.',
    };
  }

  if (clientTimestamp >= serverTimestamp) {
    return {
      winner: clientRecord,
      resolution: 'client_wins',
      explanation: `Client write (${clientTimestamp}) is newer than or equal to server write (${serverTimestamp}).`,
    };
  }

  return {
    winner: serverRecord,
    resolution: 'server_wins',
    explanation: `Server write (${serverTimestamp}) is newer than client write (${clientTimestamp}).`,
  };
}

/**
 * Convenience helper to convert a server SyncConflict into a local decision
 */
export function applyServerConflict<T>(conflict: SyncConflict<T>): {
  applyToLocal: boolean;
  record: T | null;
} {
  if (conflict.resolution === 'server_wins') {
    return {
      applyToLocal: true,
      record: conflict.serverRecord,
    };
  }

  return {
    applyToLocal: false,
    record: null,
  };
}
