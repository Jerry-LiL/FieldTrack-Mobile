import { Task } from '../types/task';
import { Expense } from '../types/expense';

export function generateSeedTasks(count = 1000, userId = 'usr_vineet'): Task[] {
  const tasks: Task[] = [];
  const locations = [
    'Substation North',
    'Pump Station Bravo',
    'Building 3 Level 2',
    'Valve Station 14',
    'Solar Array West',
    'Main Warehouse Bay 6',
    'Compressor Station C',
    'Generator Room B',
    'Cooling Tower East',
    'Perimeter Fence Gate 3',
  ];

  const actions = [
    'Inspect valve seal',
    'Replace hydraulic filter',
    'Calibrate thermal monitor',
    'Perform electrical ground test',
    'Lubricate gearbox bearings',
    'Check refrigerant levels',
    'Audit safety interlocks',
    'Service emergency shutdown valve',
    'Test backup battery array',
    'Clean optical sensors',
  ];

  const priorities: Task['priority'][] = ['low', 'medium', 'high'];
  const statuses: Task['status'][] = ['pending', 'in_progress', 'completed'];

  const now = Date.now();
  for (let i = 1; i <= count; i++) {
    const action = actions[i % actions.length];
    const loc = locations[i % locations.length];
    const createdOffset = (count - i) * 120000;

    tasks.push({
      id: `task_seed_${String(i).padStart(4, '0')}`,
      title: `${action} (Unit #${i})`,
      description: `Routine scheduled check and maintenance for equipment unit #${i} located at ${loc}.`,
      location: loc,
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      dueDate: new Date(now + (i % 20) * 86400000).toISOString().slice(0, 10),
      createdAt: now - createdOffset,
      updatedAt: now - createdOffset,
      userId,
      isDirty: false,
    });
  }

  return tasks;
}

export function generateSeedExpenses(count = 500, userId = 'usr_vineet'): Expense[] {
  const expenses: Expense[] = [];
  const categories: Expense['category'][] = [
    'travel',
    'meals',
    'lodging',
    'equipment',
    'supplies',
    'other',
  ];

  const notes = [
    'Fastenal hardware receipt',
    'Shell gas pump #4',
    'Grainger industrial supply',
    'Crew field lunch',
    'Safety gear replacement',
    'Local motel overnight shift',
    'Hydraulic fluid replacement',
    'Tool depot purchase',
  ];

  const now = Date.now();
  for (let i = 1; i <= count; i++) {
    const cat = categories[i % categories.length];
    const note = notes[i % notes.length];
    const amount = Math.round((12 + (i * 4.35) % 280) * 100) / 100;
    const createdOffset = (count - i) * 180000;

    expenses.push({
      id: `exp_seed_${String(i).padStart(4, '0')}`,
      taskId: i <= count ? `task_seed_${String(i).padStart(4, '0')}` : null,
      title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} expense #${i}`,
      category: cat,
      amount,
      currency: 'USD',
      receiptNote: `${note} (#${10000 + i})`,
      date: new Date(now - (i % 45) * 86400000).toISOString().slice(0, 10),
      createdAt: now - createdOffset,
      updatedAt: now - createdOffset,
      userId,
      isDirty: false,
    });
  }

  return expenses;
}
