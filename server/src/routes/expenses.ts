import { Router, Response } from 'express';
import { store } from '../data/store';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { Expense, SyncMutation, SyncConflict, SyncResponse } from '../types';

const router = Router();
router.use(authMiddleware);

// List all expenses
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const expenses = store.getExpenses(userId);
  res.json({ expenses });
});

// Get single expense
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const expense = store.getExpenseById(req.params.id);
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json({ expense });
});

// Create expense
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { title, category, amount, currency, receiptNote, date, taskId, id } = req.body;
  if (!title || amount === undefined) {
    res.status(400).json({ error: 'Expense title and amount are required' });
    return;
  }

  const now = Date.now();
  const expenseId = id || `exp_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const newExpense: Expense = {
    id: expenseId,
    taskId: taskId || null,
    title,
    category: category || 'other',
    amount: Number(amount) || 0,
    currency: currency || 'USD',
    receiptNote: receiptNote || null,
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: req.body.createdAt || now,
    updatedAt: req.body.updatedAt || now,
    userId: req.user?.id || 'usr_vineet',
  };

  store.saveExpense(newExpense);
  res.status(201).json({ expense: newExpense });
});

// Update expense
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = store.getExpenseById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  const clientTimestamp = req.body.updatedAt || Date.now();
  if (existing.updatedAt > clientTimestamp) {
    res.status(409).json({
      error: 'Conflict detected: Server has newer updates',
      serverRecord: existing,
      resolution: 'server_wins',
    });
    return;
  }

  const updatedExpense: Expense = {
    ...existing,
    ...req.body,
    id: existing.id,
    amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount,
    userId: existing.userId,
    updatedAt: clientTimestamp,
  };

  store.saveExpense(updatedExpense);
  res.json({ expense: updatedExpense });
});

// Delete expense
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const existing = store.getExpenseById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Expense not found' });
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

  store.deleteExpense(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Batch sync endpoint for expenses
router.post('/sync', (req: AuthenticatedRequest, res: Response) => {
  const mutations: SyncMutation<Expense>[] = req.body.mutations || [];
  const applied: string[] = [];
  const conflicts: SyncConflict<Expense>[] = [];
  const userId = req.user?.id || 'usr_vineet';

  for (const mut of mutations) {
    const existing = store.getExpenseById(mut.id);

    if (mut.action === 'CREATE') {
      if (!existing) {
        const newExpense: Expense = {
          id: mut.id,
          taskId: mut.payload.taskId || null,
          title: mut.payload.title || 'Untitled Expense',
          category: mut.payload.category || 'other',
          amount: Number(mut.payload.amount) || 0,
          currency: mut.payload.currency || 'USD',
          receiptNote: mut.payload.receiptNote || null,
          date: mut.payload.date || new Date().toISOString().slice(0, 10),
          createdAt: mut.payload.createdAt || mut.timestamp,
          updatedAt: mut.timestamp,
          userId,
        };
        store.saveExpense(newExpense);
        applied.push(mut.mutationId);
      } else {
        if (mut.timestamp > existing.updatedAt) {
          const updated: Expense = {
            ...existing,
            ...mut.payload,
            amount:
              mut.payload.amount !== undefined ? Number(mut.payload.amount) : existing.amount,
            updatedAt: mut.timestamp,
          };
          store.saveExpense(updated);
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
        const newExpense: Expense = {
          id: mut.id,
          taskId: mut.payload.taskId || null,
          title: mut.payload.title || 'Untitled Expense',
          category: mut.payload.category || 'other',
          amount: Number(mut.payload.amount) || 0,
          currency: mut.payload.currency || 'USD',
          receiptNote: mut.payload.receiptNote || null,
          date: mut.payload.date || new Date().toISOString().slice(0, 10),
          createdAt: mut.payload.createdAt || mut.timestamp,
          updatedAt: mut.timestamp,
          userId,
        };
        store.saveExpense(newExpense);
        applied.push(mut.mutationId);
      } else if (mut.timestamp >= existing.updatedAt) {
        const updated: Expense = {
          ...existing,
          ...mut.payload,
          amount:
            mut.payload.amount !== undefined ? Number(mut.payload.amount) : existing.amount,
          updatedAt: mut.timestamp,
        };
        store.saveExpense(updated);
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
        store.deleteExpense(mut.id);
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

  const response: SyncResponse<Expense> = {
    applied,
    conflicts,
    currentRecords: store.getExpenses(userId),
  };

  res.json(response);
});

export default router;
