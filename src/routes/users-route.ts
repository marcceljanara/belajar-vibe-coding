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
      console.error('[Register User Error]:', error);
      if (error.message === 'email sudah terdaftar') {
        set.status = 400;
        return { error: 'email sudah terdaftar' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 }),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: 'OK' })
      }),
      400: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Registrasi Pengguna',
      description: 'Mendaftarkan akun pengguna baru ke sistem dengan nama, email, dan password.',
      tags: ['Authentication']
    }
  })
  .post('/users/login', async ({ body, set }) => {
    try {
      const result = await loginUser(body);
      return { data: result };
    } catch (error: any) {
      console.error('[Login User Error]:', error);
      if (error.message === 'email atau password salah') {
        set.status = 400;
        return { error: 'email atau password salah' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 }),
    }),
    response: {
      200: t.Object({
        data: t.String({ format: 'uuid', description: 'Token sesi baru yang dihasilkan' })
      }),
      400: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Login Pengguna',
      description: 'Endpoint untuk melakukan autentikasi login pengguna dan mengembalikan Token sesi.',
      tags: ['Authentication']
    }
  })
  .get('/users/current', async ({ headers, set }) => {
    try {
      const token = extractToken(headers);
      const result = await getCurrentUser(token);
      return { data: result };
    } catch (error: any) {
      console.error('[Get Current User Error]:', error);
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          createdAt: t.Any()
        })
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Dapatkan Pengguna Saat Ini',
      description: 'Mengambil informasi profil dari pengguna yang saat ini sedang login menggunakan Token sesi.',
      tags: ['Users'],
      security: [
        {
          BearerAuth: []
        }
      ]
    }
  })
  .delete('/users/logout', async ({ headers, set }) => {
    try {
      const token = extractToken(headers);
      const result = await logoutUser(token);
      return { data: result };
    } catch (error: any) {
      console.error('[Logout User Error]:', error);
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    response: {
      200: t.Object({
        data: t.String({ default: 'OK' })
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Logout Pengguna',
      description: 'Endpoint untuk menghapus sesi login aktif (invalidation Token) bagi pengguna saat ini.',
      tags: ['Authentication'],
      security: [
        {
          BearerAuth: []
        }
      ]
    }
  });
