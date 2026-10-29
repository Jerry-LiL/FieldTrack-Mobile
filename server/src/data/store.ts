import { User, Task, Expense } from '../types';

export class DataStore {
  private users: Map<string, User> = new Map();
  private tasks: Map<string, Task> = new Map();
  private expenses: Map<string, Expense> = new Map();

  constructor() {
    this.seedDefaultUsers();
    this.seedDemoData();
  }

  private seedDefaultUsers(): void {
    const defaultUsers: User[] = [
      {
        id: 'usr_vineet',
        email: 'vineet@fieldtrack.dev',
        name: 'Vineet Kumar',
        role: 'Field Engineer',
        password: 'password123',
      },
      {
        id: 'usr_alex',
        email: 'alex@fieldtrack.dev',
        name: 'Alex Rivera',
        role: 'Safety Inspector',
        password: 'password123',
      },
    ];

    for (const u of defaultUsers) {
      this.users.set(u.email.toLowerCase(), u);
    }
  }

  public seedDemoData(): void {
    this.tasks.clear();
    this.expenses.clear();

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const demoTasks: Task[] = [
      {
        id: 'task_001',
        title: 'Inspect HVAC unit at Sector 4B',
        description: 'Verify compressor pressure and replace intake filter.',
        location: 'Building 4, Rooftop',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date(now + oneDay * 2).toISOString().slice(0, 10),
        createdAt: now - oneDay * 3,
        updatedAt: now - oneDay * 1,
        userId: 'usr_vineet',
      },
      {
        id: 'task_002',
        title: 'Calibrate pressure telemetry sensor',
        description: 'Standard 6-month calibration against reference gauge.',
        location: 'Pump Station Alpha',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(now + oneDay * 4).toISOString().slice(0, 10),
        createdAt: now - oneDay * 2,
        updatedAt: now - oneDay * 2,
        userId: 'usr_vineet',
      },
      {
        id: 'task_003',
        title: 'Emergency leak repair on pipeline 12',
        description: 'Completed replacement of gasket on flange connector.',
        location: 'North Perimeter Corridor',
        priority: 'high',
        status: 'completed',
        dueDate: new Date(now - oneDay * 1).toISOString().slice(0, 10),
        createdAt: now - oneDay * 4,
        updatedAt: now - oneDay * 1,
        userId: 'usr_vineet',
      },
      {
        id: 'task_004',
        title: 'Routine electrical panel safety audit',
        description: 'Thermal imaging scan on main breaker panels A through D.',
        location: 'Substation West',
        priority: 'low',
        status: 'pending',
        dueDate: new Date(now + oneDay * 6).toISOString().slice(0, 10),
        createdAt: now - oneDay * 1,
        updatedAt: now - oneDay * 1,
        userId: 'usr_vineet',
      },
    ];

    for (const t of demoTasks) {
      this.tasks.set(t.id, t);
    }

    const demoExpenses: Expense[] = [
      {
        id: 'exp_001',
        taskId: 'task_001',
        title: 'HVAC replacement filter and sealant',
        category: 'equipment',
        amount: 84.5,
        currency: 'USD',
        receiptNote: 'Grainger invoice #88412',
        date: new Date(now - oneDay * 2).toISOString().slice(0, 10),
        createdAt: now - oneDay * 2,
        updatedAt: now - oneDay * 2,
        userId: 'usr_vineet',
      },
      {
        id: 'exp_002',
        taskId: null,
        title: 'Truck fuel for site transit',
        category: 'travel',
        amount: 62.3,
        currency: 'USD',
        receiptNote: 'Shell station 98',
        date: new Date(now - oneDay * 1).toISOString().slice(0, 10),
        createdAt: now - oneDay * 1,
        updatedAt: now - oneDay * 1,
        userId: 'usr_vineet',
      },
      {
        id: 'exp_003',
        taskId: 'task_003',
        title: 'Emergency flange gasket set',
        category: 'supplies',
        amount: 145.0,
        currency: 'USD',
        receiptNote: 'Fastenal store pickup',
        date: new Date(now - oneDay * 3).toISOString().slice(0, 10),
        createdAt: now - oneDay * 3,
        updatedAt: now - oneDay * 3,
        userId: 'usr_vineet',
      },
      {
        id: 'exp_004',
        taskId: null,
        title: 'Field team lunch during emergency shift',
        category: 'meals',
        amount: 38.75,
        currency: 'USD',
        receiptNote: 'Diner receipt',
        date: new Date(now - oneDay * 1).toISOString().slice(0, 10),
        createdAt: now - oneDay * 1,
        updatedAt: now - oneDay * 1,
        userId: 'usr_vineet',
      },
    ];

    for (const e of demoExpenses) {
      this.expenses.set(e.id, e);
    }
  }

  public seedBenchmark(taskCount = 1000, expenseCount = 500, userId = 'usr_vineet'): void {
    const locations = [
      'Substation North',
      'Pump Station Bravo',
      'Building 3 Level 2',
      'Valve Station 14',
      'Solar Array West',
      'Main Warehouse Bay 6',
      'Compressor Station C',
      'Generator Room B',
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
    ];

    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const statuses: ('pending' | 'in_progress' | 'completed')[] = [
      'pending',
      'in_progress',
      'completed',
    ];
    const categories: Expense['category'][] = [
      'travel',
      'meals',
      'lodging',
      'equipment',
      'supplies',
      'other',
    ];

    const now = Date.now();
    for (let i = 1; i <= taskCount; i++) {
      const id = `bench_task_${String(i).padStart(4, '0')}`;
      const action = actions[i % actions.length];
      const loc = locations[i % locations.length];
      const task: Task = {
        id,
        title: `${action} (#${i})`,
        description: `Scheduled maintenance check for unit ${i} at ${loc}.`,
        location: loc,
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        dueDate: new Date(now + (i % 30) * 86400000).toISOString().slice(0, 10),
        createdAt: now - (1000 - i) * 60000,
        updatedAt: now - (1000 - i) * 60000,
        userId,
      };
      this.tasks.set(id, task);
    }

    for (let i = 1; i <= expenseCount; i++) {
      const id = `bench_exp_${String(i).padStart(4, '0')}`;
      const cat = categories[i % categories.length];
      const amount = Math.round((15 + (i * 3.7) % 250) * 100) / 100;
      const expense: Expense = {
        id,
        taskId: i <= taskCount ? `bench_task_${String(i).padStart(4, '0')}` : null,
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} expense #${i}`,
        category: cat,
        amount,
        currency: 'USD',
        receiptNote: `Receipt ref #${10000 + i}`,
        date: new Date(now - (i % 60) * 86400000).toISOString().slice(0, 10),
        createdAt: now - (500 - i) * 60000,
        updatedAt: now - (500 - i) * 60000,
        userId,
      };
      this.expenses.set(id, expense);
    }
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.get(email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  public getTasks(userId?: string): Task[] {
    const list = Array.from(this.tasks.values());
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  }

  public getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public saveTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  public deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  public getExpenses(userId?: string): Expense[] {
    const list = Array.from(this.expenses.values());
    if (!userId) return list;
    return list.filter((e) => e.userId === userId);
  }

  public getExpenseById(id: string): Expense | undefined {
    return this.expenses.get(id);
  }

  public saveExpense(expense: Expense): void {
    this.expenses.set(expense.id, expense);
  }

  public deleteExpense(id: string): boolean {
    return this.expenses.delete(id);
  }

  public reset(): void {
    this.seedDemoData();
  }
}

export const store = new DataStore();
