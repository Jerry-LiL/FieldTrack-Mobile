import { store } from './data/store';

console.log('Seeding benchmark data (1,000 tasks, 500 expenses)...');
store.seedBenchmark(1000, 500, 'usr_vineet');
console.log(`Successfully seeded ${store.getTasks().length} tasks and ${store.getExpenses().length} expenses.`);
