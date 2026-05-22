import { Elysia, t } from 'elysia';
import { registerUser, loginUser, getCurrentUser, logoutUser } from '../services/users-service';

function extractToken(headers: Record<string, string | undefined>): string {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  if (!token) {
    throw new Error('Unauthorized');
  }

  return token;
}

export const usersRoute = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      return { data: result };
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
      return { data: result };
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
    try {
      const token = extractToken(headers);
      const result = await getCurrentUser(token);
      return { data: result };
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  })
  .delete('/users/logout', async ({ headers, set }) => {
    try {
      const token = extractToken(headers);
      const result = await logoutUser(token);
      return { data: result };
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  });
