import {
  resolveLastWriteWins,
  applyServerConflict,
} from '../../sync/conflictResolver';

describe('Last-Write-Wins Conflict Resolver', () => {
  const clientTask = {
    id: 'task_001',
    title: 'Client Edit',
    updatedAt: 1700000000,
  };

  const serverTask = {
    id: 'task_001',
    title: 'Server Version',
    updatedAt: 1700005000,
  };

  it('declares client winner when client timestamp is newer', () => {
    const resolution = resolveLastWriteWins(
      clientTask,
      2000, // client timestamp
      serverTask,
      1000 // server timestamp
    );

    expect(resolution.resolution).toBe('client_wins');
    expect(resolution.winner).toEqual(clientTask);
  });

  it('declares server winner when server timestamp is newer', () => {
    const resolution = resolveLastWriteWins(
      clientTask,
      1000, // client timestamp
      serverTask,
      2000 // server timestamp
    );

    expect(resolution.resolution).toBe('server_wins');
    expect(resolution.winner).toEqual(serverTask);
  });

  it('declares client winner when timestamps are equal', () => {
    const resolution = resolveLastWriteWins(
      clientTask,
      1500,
      serverTask,
      1500
    );

    expect(resolution.resolution).toBe('client_wins');
    expect(resolution.winner).toEqual(clientTask);
  });

  it('handles missing server record gracefully', () => {
    const resolution = resolveLastWriteWins(clientTask, 1500, null, 0);
    expect(resolution.resolution).toBe('client_wins');
    expect(resolution.winner).toEqual(clientTask);
  });

  it('handles missing client record gracefully', () => {
    const resolution = resolveLastWriteWins(null, 0, serverTask, 1500);
    expect(resolution.resolution).toBe('server_wins');
    expect(resolution.winner).toEqual(serverTask);
  });

  describe('applyServerConflict', () => {
    it('applies to local when resolution is server_wins', () => {
      const outcome = applyServerConflict({
        id: 'task_001',
        clientTimestamp: 1000,
        serverTimestamp: 2000,
        serverRecord: serverTask,
        resolution: 'server_wins',
      });

      expect(outcome.applyToLocal).toBe(true);
      expect(outcome.record).toEqual(serverTask);
    });

    it('does not apply to local when resolution is client_wins', () => {
      const outcome = applyServerConflict({
        id: 'task_001',
        clientTimestamp: 2000,
        serverTimestamp: 1000,
        serverRecord: null,
        resolution: 'client_wins',
      });

      expect(outcome.applyToLocal).toBe(false);
      expect(outcome.record).toBeNull();
    });
  });
});
