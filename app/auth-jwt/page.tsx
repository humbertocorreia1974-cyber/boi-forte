import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, ShieldCheck, Chrome, Smartphone, AlertTriangle } from 'lucide-react';
import { JwtTokenClient } from './jwt-token-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Autenticação JWT + Google OAuth | Boi Forte',
  description:
    'Gere tokens JWT de curta duração para o app capataz offline-first, ative login com Google e gerencie sessões do ERP pecuário Boi Forte.',
  openGraph: {
    title: 'Autenticação JWT + Google OAuth — Boi Forte',
    description: 'Tokens JWT para o app mobile e login Google opcional no ERP pecuário.',
  },
};

export default async function AuthJwtPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  if (!user) redirect('/login');

  const ultimosLogins = await prisma.logAuditoria.findMany({
    where: { userId: user.id, acao: { in: ['login', 'login_google', 'jwt_emitido'] } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, acao: true, ip: true, userAgent: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-fg-muted">Segurança</p>
        <h1 className="mt-1 text-3xl font-semibold text-fg">Autenticação JWT + Google OAuth</h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Emita tokens JWT de curta duração para o app capataz (offline-first) e habilite login
          com Google como método opcional. Operações sensíveis exigem 2FA.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Usuário</p>
            <p className="mt-2 text-sm font-medium text-fg">{user.name}</p>
            <p className="text-xs text-fg-muted">{user.email}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">Papel / Plano</p>
            <p className="mt-2 text-sm font-medium text-fg capitalize">
              {user.role} · {user.plan}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wider text-fg-muted">2FA</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-fg">
              <ShieldCheck className={`h-4 w-4 ${user.twoFactorEnabled ? 'text-brand' : 'text-fg-muted'}`} />
              {user.twoFactorEnabled ? 'Ativado' : 'Desativado'}
            </p>
          </CardBody>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <JwtTokenClient />

          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand" /> Últimos acessos
              </CardTitle>
              {ultimosLogins.length === 0 ? (
                <p className="mt-3 text-sm text-fg-muted">
                  Nenhum login registrado ainda. Faça login novamente para popular o histórico.
                </p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-fg-muted">
                      <th className="py-2">Ação</th>
                      <th className="py-2">IP</th>
                      <th className="py-2">Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosLogins.map((l) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="py-2 text-fg">{l.acao}</td>
                        <td className="py-2 text-fg-muted">{l.ip ?? '—'}</td>
                        <td className="py-2 text-fg-muted">
                          {new Date(l.createdAt).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-4 w-4 text-brand" /> Login com Google
              </CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                OAuth Google é opcional. Ativa o botão &quot;Entrar com Google&quot; na tela de login.
              </p>
              <Link href="/login" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Ir para login
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand" /> Uso no app capataz
              </CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                O app mobile guarda o JWT no keystore do Android e renova via refresh token.
                Expiração padrão: 15 minutos.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-brand" /> Operações sensíveis
              </CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Alterar plano, excluir fazenda e exportar em massa exigem 2FA ativo.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
