import { describe, it, expect, beforeEach } from 'bun:test';
import { app } from '../src/app';
import { cleanDatabase } from './db-helper';
import { db } from '../src/db';
import { users } from '../src/db/schema';

describe('Users API (/api/users)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/users (Register)', () => {
    it('should register a new user successfully', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body).toEqual({ data: 'OK' });
    });

    it('should fail to register if email is already taken', async () => {
      // Register once
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );

      // Register again with same email
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Another',
            email: 'john@example.com',
            password: 'differentpassword',
          }),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as any;
      expect(body).toEqual({ error: 'email sudah terdaftar' });
    });

    it('should fail register if validation fails (missing fields)', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            // email and password missing
          }),
        })
      );
      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Register a test user
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );
    });

    it('should login successfully with correct credentials', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.data).toBeString();
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should fail to login with unregistered email', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'notfound@example.com',
            password: 'securepassword',
          }),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as any;
      expect(body.error).toBe('email atau password salah');
    });

    it('should fail to login with correct email but wrong password', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'wrongpassword',
          }),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as any;
      expect(body.error).toBe('email atau password salah');
    });

    it('should fail to login if validation fails', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@example.com',
            // password missing
          }),
        })
      );
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/users/current', () => {
    let token: string;

    beforeEach(async () => {
      // Register
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );

      // Login to get token
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );
      const body = (await response.json()) as any;
      token = body.data;
    });

    it('should return current user details with a valid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.data.name).toBe('John Doe');
      expect(body.data.email).toBe('john@example.com');
      expect(body.data.id).toBeDefined();
    });

    it('should return 401 if Authorization header is missing', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as any;
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 if Authorization format is not Bearer schema', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            Authorization: `Basic ${token}`,
          },
        })
      );
      expect(response.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid-token-uuid',
          },
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/logout', () => {
    let token: string;

    beforeEach(async () => {
      // Register
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );

      // Login to get token
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'securepassword',
          }),
        })
      );
      const body = (await response.json()) as any;
      token = body.data;
    });

    it('should logout successfully with a valid token and invalidate future requests', async () => {
      // Logout
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as any;
      expect(body.data).toBe('OK');

      // Verify that the token is now invalid for current user request
      const verifyResponse = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(verifyResponse.status).toBe(401);
    });

    it('should return 401 if Authorization header is missing', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
        })
      );
      expect(response.status).toBe(401);
    });

    it('should return 401 if token is invalid/not found during logout', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer invalid-token-uuid',
          },
        })
      );
      expect(response.status).toBe(401);
    });
  });
});
