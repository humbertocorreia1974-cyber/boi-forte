import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Auditoria | Boi Forte',
  description: 'Trilha completa de lançamentos: quem, quando e o quê — append-only e imutável.',
  openGraph: { title: 'Auditoria | Boi Forte', description: 'Trilha completa de lançamentos.' },
};

const PAGE_SIZE = 25;

type SP = { acao?: string; entidade?: string; q?: string; page?: string };

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const sp = await searchParams;
  const acao = sp.acao?.trim() || undefined;
  const entidade = sp.entidade?.trim() || undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page || '1') || 1);

  const where = {
    userId: session.user.id,
    ...(acao ? { acao } : {}),
    ...(entidade ? { entidade } : {}),
    ...(q ? { entidadeId: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const [logs, total, acoes, entidades] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.logAuditoria.count({ where }),
    prisma.logAuditoria.findMany({
      where: { userId: session.user.id },
      distinct: ['acao'],
      select: { acao: true },
    }),
    prisma.logAuditoria.findMany({
      where: { userId: session.user.id },
      distinct: ['entidade'],
      select: { entidade: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-fg">
            <ShieldCheck className="h-6 w-6 text-brand" aria-hidden /> Auditoria
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {total} registro{total === 1 ? '' : 's'} — trilha imutável de lançamentos (quem, quando, o quê).
          </p>
        </div>
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted">Buscar por ID da entidade</label>
              <Input name="q" defaultValue={q || ''} placeholder="ex: clx…" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Ação</label>
              <select name="acao" defaultValue={acao || ''} className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
                <option value="">Todas</option>
                {acoes.map((a) => <option key={a.acao} value={a.acao}>{a.acao}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Entidade</label>
              <select name="entidade" defaultValue={entidade || ''} className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
                <option value="">Todas</option>
                {entidades.map((e) => <option key={e.entidade} value={e.entidade}>{e.entidade}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit" size="sm">
                <Search className="mr-1 h-4 w-4" aria-hidden /> Filtrar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-fg-muted" aria-hidden />
            <p className="text-fg">Nenhum lançamento registrado ainda.</p>
            <p className="text-sm text-fg-muted">Cada criação, edição ou exclusão aparece aqui automaticamente.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 transition-all duration-150 hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                      {new Date(l.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{l.acao}</span>
                    </td>
                    <td className="px-4 py-3 text-fg">{l.entidade}</td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">{l.entidadeId ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {l.dadosDepois ? (
                        <code className="line-clamp-2 break-all">{JSON.stringify(l.dadosDepois).slice(0, 120)}</code>
                      ) : l.dadosAntes ? (
                        <code className="line-clamp-2 break-all">antes: {JSON.stringify(l.dadosAntes).slice(0, 100)}</code>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          <span className="text-fg-muted">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/auditoria?${new URLSearchParams({ ...(acao ? { acao } : {}), ...(entidade ? { entidade } : {}), ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}>
                <Button variant="secondary" size="sm">Anterior</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/auditoria?${new URLSearchParams({ ...(acao ? { acao } : {}), ...(entidade ? { entidade } : {}), ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}>
                <Button variant="secondary" size="sm">Próxima</Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
