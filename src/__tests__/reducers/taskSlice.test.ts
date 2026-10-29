import taskReducer, {
  setTasks,
  setTaskFilters,
  resetTaskFilters,
  createTaskOffline,
  updateTaskOffline,
  deleteTaskOffline,
  seedTasksBenchmark,
} from '../../store/taskSlice';
import { Task } from '../../types/task';

describe('taskSlice', () => {
  const baseTask: Task = {
    id: 'task_001',
    title: 'Inspect pump',
    description: 'Check pressure',
    location: 'Sector 3',
    priority: 'high',
    status: 'pending',
    dueDate: '2026-11-01',
    createdAt: 1000,
    updatedAt: 1000,
    userId: 'usr_1',
    isDirty: false,
  };

  it('handles setTasks', () => {
    const state = taskReducer(undefined, setTasks([baseTask]));
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].id).toBe('task_001');
  });

  it('handles setTaskFilters and resetTaskFilters', () => {
    let state = taskReducer(undefined, setTaskFilters({ search: 'pump', status: 'completed' }));
    expect(state.filters.search).toBe('pump');
    expect(state.filters.status).toBe('completed');

    state = taskReducer(state, resetTaskFilters());
    expect(state.filters.search).toBe('');
    expect(state.filters.status).toBe('all');
  });

  it('handles createTaskOffline.fulfilled', () => {
    const newTask: Task = {
      ...baseTask,
      id: 'task_002',
      title: 'Calibrate meter',
    };

    const state = taskReducer(
      { tasks: [baseTask], filters: { search: '', status: 'all', priority: 'all' }, isLoading: false, error: null },
      { type: createTaskOffline.fulfilled.type, payload: newTask }
    );

    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0].id).toBe('task_002');
  });

  it('handles updateTaskOffline.fulfilled', () => {
    const updated: Task = {
      ...baseTask,
      status: 'completed',
      title: 'Inspected pump - OK',
    };

    const state = taskReducer(
      { tasks: [baseTask], filters: { search: '', status: 'all', priority: 'all' }, isLoading: false, error: null },
      { type: updateTaskOffline.fulfilled.type, payload: updated }
    );

    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].status).toBe('completed');
    expect(state.tasks[0].title).toBe('Inspected pump - OK');
  });

  it('handles deleteTaskOffline.fulfilled', () => {
    const state = taskReducer(
      { tasks: [baseTask], filters: { search: '', status: 'all', priority: 'all' }, isLoading: false, error: null },
      { type: deleteTaskOffline.fulfilled.type, payload: 'task_001' }
    );

    expect(state.tasks).toHaveLength(0);
  });

  it('handles seedTasksBenchmark.fulfilled with 1,000 tasks', () => {
    const thousandTasks: Task[] = Array.from({ length: 1000 }, (_, i) => ({
      ...baseTask,
      id: `task_${i}`,
      title: `Task #${i}`,
    }));

    const state = taskReducer(
      undefined,
      { type: seedTasksBenchmark.fulfilled.type, payload: thousandTasks }
    );

    expect(state.tasks).toHaveLength(1000);
  });
});
