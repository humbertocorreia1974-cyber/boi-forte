import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import LocalePicker from './locale-picker-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Idioma da conta | Boi Forte',
  description: 'Escolha entre 18 idiomas o idioma da interface do Boi Forte para toda a equipe da fazenda.',
  openGraph: {
    title: 'Idioma da conta | Boi Forte',
    description: '18 idiomas disponíveis: pt-BR, en, es, fr, de, it, ja, zh, ru, ar, hi, id, nl, pl, tr, ko, th, vi.',
  },
};

export const LOCALES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: 'BR' },
  { code: 'en', label: 'English', flag: 'US' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
  { code: 'ja', label: '日本語', flag: 'JP' },
  { code: 'zh', label: '中文', flag: 'CN' },
  { code: 'ru', label: 'Русский', flag: 'RU' },
  { code: 'ar', label: 'العربية', flag: 'SA' },
  { code: 'hi', label: 'हिन्दी', flag: 'IN' },
  { code: 'id', label: 'Bahasa Indonesia', flag: 'ID' },
  { code: 'nl', label: 'Nederlands', flag: 'NL' },
  { code: 'pl', label: 'Polski', flag: 'PL' },
  { code: 'tr', label: 'Türkçe', flag: 'TR' },
  { code: 'ko', label: '한국어', flag: 'KR' },
  { code: 'th', label: 'ไทย', flag: 'TH' },
  { code: 'vi', label: 'Tiếng Việt', flag: 'VN' },
] as const;

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { locale: true, name: true, email: true },
  });

  const atual = user?.locale ?? 'pt-BR';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Idioma da conta</h1>
          <p className="text-sm text-fg-muted">
            A escolha vale para o seu usuário em todas as fazendas. {LOCALES.length} idiomas disponíveis.
          </p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Atual: {atual}
        </span>
      </header>

      <Card>
        <CardTitle>Selecione o idioma</CardTitle>
        <CardBody>
          <LocalePicker current={atual} locales={LOCALES as unknown as { code: string; label: string; flag: string }[]} />
        </CardBody>
      </Card>

      <Card>
        <CardTitle>Como funciona</CardTitle>
        <CardBody className="space-y-2 text-sm text-fg-muted">
          <p>O dicionário é servido por <code className="rounded bg-surface px-1">GET /api/i18n/[locale]</code> e cacheado no cliente.</p>
          <p>Datas, moeda (R$/US$) e unidades (kg, @, UA) são formatadas conforme o locale escolhido.</p>
          <p>O app do capataz (offline-first) baixa o dicionário junto com o pacote de sincronização.</p>
        </CardBody>
      </Card>
    </div>
  );
}
