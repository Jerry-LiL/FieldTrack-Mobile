import { Router, Request, Response } from 'express';
import { store } from '../data/store';

const router = Router();

// Reset data to initial demo state
router.post('/reset', (_req: Request, res: Response) => {
  store.reset();
  res.json({
    message: 'Data reset to demo state',
    tasks: store.getTasks().length,
    expenses: store.getExpenses().length,
  });
});

// Seed 1000+ benchmark items for virtualization stress-testing
router.post('/benchmark', (req: Request, res: Response) => {
  const taskCount = Number(req.body.taskCount) || 1000;
  const expenseCount = Number(req.body.expenseCount) || 500;
  const userId = req.body.userId || 'usr_vineet';

  store.seedBenchmark(taskCount, expenseCount, userId);

  res.json({
    message: `Seeded ${taskCount} tasks and ${expenseCount} expenses`,
    taskCount,
    expenseCount,
    totalTasks: store.getTasks().length,
    totalExpenses: store.getExpenses().length,
  });
});

export default router;
