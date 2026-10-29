import dotenv from 'dotenv';
import { createServer } from './server';

dotenv.config();

const app = createServer();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`FieldTrack mock server running on http://localhost:${PORT}`);
  console.log(`Default login: vineet@fieldtrack.dev / password123`);
});
