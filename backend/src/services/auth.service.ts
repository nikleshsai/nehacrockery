// ─────────────────────────────────────────────────────────────────────────────
// Authentication service — profile lookup.
// Credentials, sessions and token issuing are handled entirely by Supabase Auth.
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true },
  });

  if (!user) {
    throw AppError.notFound('User');
  }

  return user;
}
