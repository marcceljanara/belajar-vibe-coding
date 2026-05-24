import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoute } from './routes/users-route';

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Belajar Vibe Coding API',
        version: '1.0.0',
        description: 'Dokumentasi interaktif untuk sistem Autentikasi dan Manajemen Pengguna.'
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))
  .use(usersRoute)
  .get('/', () => ({
    message: 'Hello World from Elysia + Bun!',
    status: 'success',
  }), {
    detail: {
      summary: 'Root Endpoint',
      description: 'Menampilkan pesan selamat datang dari server API Elysia + Bun.',
      tags: ['General']
    }
  })
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
  }, {
    detail: {
      summary: 'Dapatkan Semua Pengguna',
      description: 'Endpoint internal untuk mengambil daftar seluruh pengguna yang terdaftar di database.',
      tags: ['Users']
    }
  });
