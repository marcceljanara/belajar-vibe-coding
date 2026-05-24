import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini mengecek apakah email sudah terdaftar sebelumnya. Jika belum,
 * password akan di-hash menggunakan algoritma bcrypt lalu data pengguna disimpan ke tabel `users`.
 * 
 * @param payload - Data input (name, email, password).
 * @returns String 'OK' jika berhasil registrasi.
 * @throws Error jika email sudah pernah terdaftar.
 */
export async function registerUser(payload: any) {
  const { name, email, password } = payload;

  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('email sudah terdaftar');
  }

  // 2. Hash password menggunakan bcrypt bawaan Bun
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // 3. Simpan user baru ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return 'OK';
}

/**
 * Memproses autentikasi login pengguna.
 * Fungsi ini mencari pengguna berdasarkan email, memverifikasi kecocokan password,
 * lalu menghasilkan (generate) token UUID unik dan menyimpannya di tabel `sessions`.
 * 
 * @param payload - Data kredensial input (email, password).
 * @returns Token sesi (UUID string) jika login berhasil.
 * @throws Error jika email tidak ditemukan atau password salah.
 */
export async function loginUser(payload: any) {
  const { email, password } = payload;

  // 1. Cari user berdasarkan email
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userList.length === 0) {
    throw new Error('email atau password salah');
  }

  const user = userList[0];
  if (!user) {
    throw new Error('email atau password salah');
  }

  // 2. Verifikasi password
  const isPasswordCorrect = await Bun.password.verify(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error('email atau password salah');
  }

  // 3. Generate token UUID
  const token = crypto.randomUUID();

  // 4. Simpan session baru
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}

/**
 * Mengambil data profil pengguna yang sedang aktif (login) berdasarkan token.
 * Fungsi ini memvalidasi token dari tabel `sessions` dan mengambil data pengguna
 * dari tabel `users` yang berelasi dengan token tersebut.
 * 
 * @param token - Token string (UUID) otorisasi milik pengguna.
 * @returns Objek profil data pengguna saat ini.
 * @throws Error 'Unauthorized' jika token tidak valid atau tidak ditemukan.
 */
export async function getCurrentUser(token: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    throw new Error('Unauthorized');
  }

  const user = result[0];
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Memproses logout pengguna dari sistem.
 * Fungsi ini akan menghapus data sesi berdasarkan token di tabel `sessions`
 * sehingga token tersebut tidak dapat dipakai kembali untuk mengakses data pengguna.
 * 
 * @param token - Token string (UUID) otorisasi yang akan dihapus.
 * @returns String 'OK' jika logout berhasil.
 * @throws Error 'Unauthorized' jika token tidak ditemukan.
 */
export async function logoutUser(token: string) {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    throw new Error('Unauthorized');
  }

  const session = result[0];
  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return 'OK';
}
