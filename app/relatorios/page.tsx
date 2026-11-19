import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { RelatorioFormClient } from './relatorio-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Relatórios | Boi Forte',
  description: 'Exportação de relatórios zootécnicos e financeiros em PDF e Excel.',
  openGraph: {
    title: 'Relatórios | Boi Forte',
    description: 'Exporte dados de rebanho, pesagens e custos em PDF e Excel.',
  },
};

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const fazendas = await prisma.fazenda.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  const relatorios = await prisma.relatorio.findMany({
    where: { usuarioId: session.user.id },
    include: { fazenda: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-fg">Relatórios</h1>
        <p className="mt-1 text-fg-muted">
          Exporte rebanho, pesagens e custos em PDF ou Excel. Jobs assíncronos, download imediato.
        </p>
      </header>

      {fazendas.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Sem fazendas</CardTitle>
            <p className="mt-2 text-fg-muted">Cadastre uma fazenda para gerar relatórios.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <Card>
            <CardBody>
              <CardTitle>Novo relatório</CardTitle>
              <p className="mt-1 text-sm text-fg-muted">
                Escolha fazenda, tipo e formato. O arquivo fica disponível para download.
              </p>
              <div className="mt-4">
                <RelatorioFormClient fazendas={fazendas} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Histórico</CardTitle>
              {relatorios.length === 0 ? (
                <p className="mt-3 text-sm text-fg-muted">
                  Nenhum relatório gerado ainda. Use o formulário ao lado.
                </p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-bg/40 text-left text-fg-muted">
                      <tr>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Fazenda</th>
                        <th className="px-3 py-2">Formato</th>
                        <th className="px-3 py-2">Criado</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorios.map((r) => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2 text-fg capitalize">{r.tipo}</td>
                          <td className="px-3 py-2 text-fg-muted">{r.fazenda.nome}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                              {r.formato === 'excel' ? (
                                <FileSpreadsheet className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              {r.formato}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-fg-muted">
                            {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <a
                              href={`/api/relatorios/${r.id}/download`}
                              className="inline-flex items-center gap-1 text-brand hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Baixar
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </main>
  );
}
