import { Router, Response } from 'express';
import { store } from '../data/store';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { Task, SyncMutation, SyncConflict, SyncResponse } from '../types';

const router = Router();
router.use(authMiddleware);

// List all tasks
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const tasks = store.getTasks(userId);
  res.json({ tasks });
});

// Get single task
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const task = store.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task });
});

// Create task
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, location, priority, status, dueDate, id } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  const now = Date.now();
  const taskId = id || `task_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const newTask: Task = {
    id: taskId,
    title,
    description: description || '',
    location: location || '',
    priority: priority || 'medium',
    status: status || 'pending',
    dueDate: dueDate || null,
    createdAt: req.body.createdAt || now,
    updatedAt: req.body.updatedAt || now,
    userId: req.user?.id || 'usr_vineet',
  };

  store.saveTask(newTask);
  res.status(201).json({ task: newTask });
});

// Update task (with last-write-wins verification)
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = store.getTaskById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const clientTimestamp = req.body.updatedAt || Date.now();
  if (existing.updatedAt > clientTimestamp) {
    // Conflict: server has newer data
    res.status(409).json({
      error: 'Conflict detected: Server has newer updates',
      serverRecord: existing,
      resolution: 'server_wins',
    });
    return;
  }

  const updatedTask: Task = {
    ...existing,
    ...req.body,
    id: existing.id,
    userId: existing.userId,
    updatedAt: clientTimestamp,
  };

  store.saveTask(updatedTask);
  res.json({ task: updatedTask });
});

// Delete task
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = store.getTaskById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const clientTimestamp = req.body.timestamp || Date.now();
  if (existing.updatedAt > clientTimestamp) {
    res.status(409).json({
      error: 'Conflict: Server record modified after delete timestamp',
      serverRecord: existing,
      resolution: 'server_wins',
    });
    return;
  }

  store.deleteTask(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Batch sync endpoint with last-write-wins conflict resolution
router.post('/sync', (req: AuthenticatedRequest, res: Response) => {
  const mutations: SyncMutation<Task>[] = req.body.mutations || [];
  const applied: string[] = [];
  const conflicts: SyncConflict<Task>[] = [];
  const userId = req.user?.id || 'usr_vineet';

  for (const mut of mutations) {
    const existing = store.getTaskById(mut.id);

    if (mut.action === 'CREATE') {
      if (!existing) {
        const newTask: Task = {
          id: mut.id,
          title: mut.payload.title || 'Untitled Task',
          description: mut.payload.description || '',
          location: mut.payload.location || '',
          priority: mut.payload.priority || 'medium',
          status: mut.payload.status || 'pending',
          dueDate: mut.payload.dueDate || null,
          createdAt: mut.payload.createdAt || mut.timestamp,
          updatedAt: mut.timestamp,
          userId,
        };
        store.saveTask(newTask);
        applied.push(mut.mutationId);
      } else {
        if (mut.timestamp > existing.updatedAt) {
          const updated: Task = {
            ...existing,
            ...mut.payload,
            updatedAt: mut.timestamp,
          };
          store.saveTask(updated);
          applied.push(mut.mutationId);
        } else {
          conflicts.push({
            id: mut.id,
            clientTimestamp: mut.timestamp,
            serverTimestamp: existing.updatedAt,
            serverRecord: existing,
            resolution: 'server_wins',
          });
        }
      }
    } else if (mut.action === 'UPDATE') {
      if (!existing) {
        // Upsert if not found
        const newTask: Task = {
          id: mut.id,
          title: mut.payload.title || 'Untitled Task',
          description: mut.payload.description || '',
          location: mut.payload.location || '',
          priority: mut.payload.priority || 'medium',
          status: mut.payload.status || 'pending',
          dueDate: mut.payload.dueDate || null,
          createdAt: mut.payload.createdAt || mut.timestamp,
          updatedAt: mut.timestamp,
          userId,
        };
        store.saveTask(newTask);
        applied.push(mut.mutationId);
      } else if (mut.timestamp >= existing.updatedAt) {
        const updated: Task = {
          ...existing,
          ...mut.payload,
          updatedAt: mut.timestamp,
        };
        store.saveTask(updated);
        applied.push(mut.mutationId);
      } else {
        conflicts.push({
          id: mut.id,
          clientTimestamp: mut.timestamp,
          serverTimestamp: existing.updatedAt,
          serverRecord: existing,
          resolution: 'server_wins',
        });
      }
    } else if (mut.action === 'DELETE') {
      if (!existing) {
        applied.push(mut.mutationId);
      } else if (mut.timestamp >= existing.updatedAt) {
        store.deleteTask(mut.id);
        applied.push(mut.mutationId);
      } else {
        conflicts.push({
          id: mut.id,
          clientTimestamp: mut.timestamp,
          serverTimestamp: existing.updatedAt,
          serverRecord: existing,
          resolution: 'server_wins',
        });
      }
    }
  }

  const response: SyncResponse<Task> = {
    applied,
    conflicts,
    currentRecords: store.getTasks(userId),
  };

  res.json(response);
});

export default router;
