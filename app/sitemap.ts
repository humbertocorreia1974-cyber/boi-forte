import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://exemplo.com';
  const routes = ["/","/ranking-piquetes","/simulador-venda","/alertas","/relatorios","/fazendas","/auditoria","/gmd","/projecao-abate","/rotacao","/i18n","/balanca","/natalidade","/custo-arroba","/mobile","/auth-jwt","/pwa"];
  return routes.map((r) => ({ url: base + (r === '/' ? '' : r), lastModified: new Date(), changeFrequency: 'weekly' as const, priority: r === '/' ? 1 : 0.6 }));
}
