import { SyncQueueManager } from '../../sync/syncQueue';

describe('SyncQueueManager', () => {
  let queueManager: SyncQueueManager;

  beforeEach(async () => {
    queueManager = new SyncQueueManager();
    await queueManager.init();
    await queueManager.clear();
  });

  it('enqueues a mutation into the queue', async () => {
    const mut = await queueManager.enqueue('task', 'CREATE', 'task_1', {
      title: 'Inspect HVAC',
    });

    expect(mut).toBeDefined();
    expect(queueManager.count()).toBe(1);
    expect(queueManager.getAll()[0].id).toBe('task_1');
  });

  it('compacts CREATE + UPDATE into a single CREATE mutation with merged payload', async () => {
    await queueManager.enqueue('task', 'CREATE', 'task_100', {
      title: 'Initial Title',
      location: 'Building A',
    });

    await queueManager.enqueue('task', 'UPDATE', 'task_100', {
      title: 'Updated Title',
      priority: 'high',
    });

    expect(queueManager.count()).toBe(1);
    const item = queueManager.getAll()[0];
    expect(item.action).toBe('CREATE');
    expect(item.payload).toEqual({
      title: 'Updated Title',
      location: 'Building A',
      priority: 'high',
    });
  });

  it('compacts CREATE + DELETE by removing from queue entirely (never synced to server)', async () => {
    await queueManager.enqueue('task', 'CREATE', 'task_temp', {
      title: 'Draft Task',
    });

    expect(queueManager.count()).toBe(1);

    const result = await queueManager.enqueue('task', 'DELETE', 'task_temp', {});
    expect(result).toBeNull();
    expect(queueManager.count()).toBe(0);
  });

  it('compacts UPDATE + UPDATE into a single UPDATE with merged payload', async () => {
    await queueManager.enqueue('expense', 'UPDATE', 'exp_1', {
      amount: 40,
    });

    await queueManager.enqueue('expense', 'UPDATE', 'exp_1', {
      receiptNote: 'Fuel receipt',
    });

    expect(queueManager.count()).toBe(1);
    const item = queueManager.getAll()[0];
    expect(item.action).toBe('UPDATE');
    expect(item.payload).toEqual({
      amount: 40,
      receiptNote: 'Fuel receipt',
    });
  });

  it('compacts UPDATE + DELETE into a single DELETE mutation', async () => {
    await queueManager.enqueue('task', 'UPDATE', 'task_existing', {
      title: 'Edited Title',
    });

    await queueManager.enqueue('task', 'DELETE', 'task_existing', {});

    expect(queueManager.count()).toBe(1);
    const item = queueManager.getAll()[0];
    expect(item.action).toBe('DELETE');
    expect(item.payload).toEqual({});
  });

  it('removes applied mutation IDs upon successful sync batch', async () => {
    const mut1 = await queueManager.enqueue('task', 'CREATE', 't1', {});
    await queueManager.enqueue('task', 'CREATE', 't2', {});

    expect(queueManager.count()).toBe(2);

    await queueManager.remove([mut1!.mutationId]);
    expect(queueManager.count()).toBe(1);
    expect(queueManager.getAll()[0].id).toBe('t2');
  });

  it('filters pending mutations by entity', async () => {
    await queueManager.enqueue('task', 'CREATE', 't1', {});
    await queueManager.enqueue('expense', 'CREATE', 'e1', {});
    await queueManager.enqueue('task', 'UPDATE', 't2', {});

    expect(queueManager.getByEntity('task')).toHaveLength(2);
    expect(queueManager.getByEntity('expense')).toHaveLength(1);
  });
});
