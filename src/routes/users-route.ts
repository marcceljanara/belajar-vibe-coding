import { Elysia, t } from 'elysia';
import { registerUser, loginUser, getCurrentUser } from '../services/users-service';

export const usersRoute = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      return result;
    } catch (error: any) {
      if (error.message === 'email sudah terdaftar') {
        set.status = 400;
        return { error: 'email sudah terdaftar' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  })
  .post('/users/login', async ({ body, set }) => {
    try {
      const result = await loginUser(body);
      return result;
    } catch (error: any) {
      if (error.message === 'email atau password salah') {
        set.status = 400;
        return { error: 'email atau password salah' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  })
  .get('/users/current', async ({ headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const token = authHeader.substring(7);
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      const result = await getCurrentUser(token);
      return result;
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  });
