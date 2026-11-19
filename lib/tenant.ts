import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

export async function requireFazendaAccess(fazendaId: string) {
  const session = await requireSession();
  if (!session) return { session: null, fazenda: null };
  const fazenda = await prisma.fazenda.findFirst({
    where: { id: fazendaId, ownerId: session.user.id },
  });
  return { session, fazenda };
}

export function isAdmin(role?: string | null) {
  return role === 'admin' || role === 'administrador';
}
