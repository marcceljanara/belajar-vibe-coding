import { describe, it, expect, beforeEach } from 'bun:test';
import { app } from '../src/app';
import { cleanDatabase } from './db-helper';
import { db } from '../src/db';
import { users } from '../src/db/schema';

describe('Root and GET /users API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /', () => {
    it('should return status 200 and hello world message', async () => {
      const response = await app.handle(new Request('http://localhost/'));
      expect(response.status).toBe(200);
      
      const body = (await response.json()) as any;
      expect(body).toEqual({
        message: 'Hello World from Elysia + Bun!',
        status: 'success',
      });
    });
  });

  describe('GET /users', () => {
    it('should return empty list when no users exist', async () => {
      const response = await app.handle(new Request('http://localhost/users'));
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.status).toBe('success');
      expect(body.data).toBeArray();
      expect(body.data.length).toBe(0);
    });

    it('should return all users list when users exist', async () => {
      // Seed some users first
      await db.insert(users).values([
        {
          name: 'User One',
          email: 'one@example.com',
          password: 'password123',
        },
        {
          name: 'User Two',
          email: 'two@example.com',
          password: 'password456',
        }
      ]);

      const response = await app.handle(new Request('http://localhost/users'));
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.status).toBe('success');
      expect(body.data).toBeArray();
      expect(body.data.length).toBe(2);
      expect(body.data[0].name).toBe('User One');
      expect(body.data[0].email).toBe('one@example.com');
      expect(body.data[1].name).toBe('User Two');
      expect(body.data[1].email).toBe('two@example.com');
    });
  });
});
