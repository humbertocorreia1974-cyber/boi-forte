export function calcGmd(pesoInicial: number, pesoFinal: number, dias: number) {
  if (dias <= 0) return 0;
  return (pesoFinal - pesoInicial) / dias;
}

export function diasEntre(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function projecaoAbate(pesoAtual: number, pesoAlvo: number, gmd: number) {
  if (gmd <= 0 || pesoAtual >= pesoAlvo) return 0;
  return Math.ceil((pesoAlvo - pesoAtual) / gmd);
}

export function uaPorHa(uaTotal: number, areaHa: number) {
  if (areaHa <= 0) return 0;
  return uaTotal / areaHa;
}

export function custoPorArroba(custoTotal: number, arrobasProduzidas: number) {
  if (arrobasProduzidas <= 0) return 0;
  return custoTotal / arrobasProduzidas;
}

export function arrobasDePeso(pesoKg: number) {
  return pesoKg / 30;
}
