import request from 'supertest';
import { createServer } from '../src/server';
import { store } from '../src/data/store';

describe('FieldTrack Mock Server API', () => {
  const app = createServer();
  let authToken = '';

  beforeEach(() => {
    store.reset();
  });

  describe('GET /health', () => {
    it('returns 200 and ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Authentication', () => {
    it('authenticates valid user and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vineet@fieldtrack.dev', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('vineet@fieldtrack.dev');
      authToken = res.body.token;
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vineet@fieldtrack.dev', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('returns current profile via /api/auth/me', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vineet@fieldtrack.dev', password: 'password123' });
      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.name).toBe('Vineet Kumar');
    });
  });

  describe('Tasks API & Sync', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vineet@fieldtrack.dev', password: 'password123' });
      token = res.body.token;
    });

    it('lists tasks for authenticated user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it('creates a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Pressure sensor check',
          description: 'Check PSI reading',
          location: 'Station 9',
          priority: 'high',
          status: 'pending',
        });

      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('Pressure sensor check');
      expect(res.body.task.id).toBeDefined();
    });

    it('applies batch sync mutations with Last-Write-Wins conflict resolution', async () => {
      const now = Date.now();

      // Mutation 1: newer update should apply
      // Mutation 2: older update should trigger conflict (server wins)
      const existingTask = store.getTaskById('task_001')!;
      const serverTimestamp = existingTask.updatedAt;

      const mutations = [
        {
          mutationId: 'mut_newer',
          entity: 'task',
          action: 'UPDATE',
          id: 'task_001',
          payload: { title: 'Updated by client newer' },
          timestamp: serverTimestamp + 5000,
        },
        {
          mutationId: 'mut_older',
          entity: 'task',
          action: 'UPDATE',
          id: 'task_002',
          payload: { title: 'Stale client edit' },
          timestamp: store.getTaskById('task_002')!.updatedAt - 10000,
        },
      ];

      const res = await request(app)
        .post('/api/tasks/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({ mutations });

      expect(res.status).toBe(200);
      expect(res.body.applied).toContain('mut_newer');
      expect(res.body.applied).not.toContain('mut_older');
      expect(res.body.conflicts.length).toBe(1);
      expect(res.body.conflicts[0].id).toBe('task_002');
      expect(res.body.conflicts[0].resolution).toBe('server_wins');

      // Verify the newer task was actually updated
      const updated = store.getTaskById('task_001');
      expect(updated?.title).toBe('Updated by client newer');
    });
  });

  describe('Expenses API & Sync', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vineet@fieldtrack.dev', password: 'password123' });
      token = res.body.token;
    });

    it('creates an expense and lists expenses', async () => {
      const createRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Safety harness kit',
          category: 'equipment',
          amount: 120.5,
          currency: 'USD',
          date: '2026-10-29',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.expense.amount).toBe(120.5);

      const listRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      const items = listRes.body.expenses;
      expect(items.some((e: any) => e.title === 'Safety harness kit')).toBe(true);
    });
  });
});
