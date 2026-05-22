import { Elysia } from 'elysia';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(usersRoute)
  .get('/', () => ({
    message: 'Hello World from Elysia + Bun!',
    status: 'success',
  }))
  .get('/users', async () => {
    try {
      const { db } = await import('./db');
      const { users } = await import('./db/schema');
      const result = await db.select().from(users);
      return { status: 'success', data: result };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: 'Database connection failed. Make sure MySQL is running and configured correctly.',
        details: error.message 
      };
    }
  })
  .listen(process.env.PORT || 3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
