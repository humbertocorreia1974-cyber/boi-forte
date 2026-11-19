const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('Demo@1234', 10);

async function main() {
  const admin = await prisma.user.upsert({ where: { email: 'admin@demo.app' }, update: {}, create: { email: 'admin@demo.app', name: 'Administrador Demo', passwordHash: senha, role: 'admin', plan: 'pro', termsAcceptedAt: new Date() } });
  const administrador = await prisma.user.upsert({ where: { email: 'administrador@demo.app' }, update: {}, create: { email: 'administrador@demo.app', name: 'Administrador Secundário', passwordHash: senha, role: 'administrador', plan: 'pro', termsAcceptedAt: new Date() } });
  const jogador = await prisma.user.upsert({ where: { email: 'jogador@demo.app' }, update: {}, create: { email: 'jogador@demo.app', name: 'João Jogador', passwordHash: senha, role: 'user', plan: 'free', termsAcceptedAt: new Date() } });

  await prisma.perfil.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id, nomeCompleto: 'Administrador Demo', telefone: '(11) 99999-0001', cargo: 'Gestor', idioma: 'pt-BR' } });
  await prisma.perfil.upsert({ where: { userId: jogador.id }, update: {}, create: { userId: jogador.id, nomeCompleto: 'João Jogador', telefone: '(11) 99999-0002', cargo: 'Operador', idioma: 'pt-BR' } });

  const nFaz = await prisma.fazenda.count();
  if (nFaz === 0) {
    await prisma.fazenda.createMany({ data: [
      { ownerId: admin.id, nome: 'Fazenda Boi Forte', cnpj: '12.345.678/0001-90', cidade: 'Uberaba', uf: 'MG', areaTotalHa: 850.5, uaPadraoKg: 450, ativa: true },
      { ownerId: admin.id, nome: 'Fazenda Santa Rita', cnpj: '98.765.432/0001-10', cidade: 'Dourados', uf: 'MS', areaTotalHa: 620.0, uaPadraoKg: 450, ativa: true },
      { ownerId: jogador.id, nome: 'Fazenda Três Irmãos', cidade: 'Rio Verde', uf: 'GO', areaTotalHa: 410.0, uaPadraoKg: 450, ativa: true },
    ]});
  }
  const fazendas = await prisma.fazenda.findMany();
  const f1 = fazendas[0], f2 = fazendas[1], f3 = fazendas[2];

  const nPq = await prisma.piquete.count();
  if (nPq === 0) {
    await prisma.piquete.createMany({ data: [
      { fazendaId: f1.id, nome: 'Piquete Norte', areaHa: 45.0, capacidadeUa: 60, tipoPasto: 'Brachiaria', status: 'ocupado', descansoDias: 30, latitude: -19.7483, longitude: -47.9319 },
      { fazendaId: f1.id, nome: 'Piquete Sul', areaHa: 38.5, capacidadeUa: 50, tipoPasto: 'Mombaça', status: 'disponivel', descansoDias: 28, latitude: -19.7520, longitude: -47.9350 },
      { fazendaId: f1.id, nome: 'Piquete Leste', areaHa: 52.0, capacidadeUa: 70, tipoPasto: 'Marandu', status: 'descanso', descansoDias: 35, latitude: -19.7450, longitude: -47.9280 },
      { fazendaId: f2.id, nome: 'Piquete A', areaHa: 40.0, capacidadeUa: 55, tipoPasto: 'Brachiaria', status: 'ocupado', descansoDias: 30, latitude: -22.2211, longitude: -54.8056 },
      { fazendaId: f2.id, nome: 'Piquete B', areaHa: 35.0, capacidadeUa: 45, tipoPasto: 'Mombaça', status: 'disponivel', descansoDias: 30, latitude: -22.2250, longitude: -54.8100 },
      { fazendaId: f3.id, nome: 'Piquete Central', areaHa: 42.0, capacidadeUa: 58, tipoPasto: 'Marandu', status: 'ocupado', descansoDias: 30, latitude: -17.7975, longitude: -50.9264 },
    ]});
  }
  const piquetes = await prisma.piquete.findMany();

  const nLote = await prisma.lote.count();
  if (nLote === 0) {
    await prisma.lote.createMany({ data: [
      { fazendaId: f1.id, piqueteId: piquetes[0].id, nome: 'Lote Engorda 01', tipo: 'engorda', pesoAlvoKg: 520, gmdMeta: 1.2, dataEntrada: new Date('2025-03-01'), dataSaidaPrevista: new Date('2025-09-01'), status: 'ativo' },
      { fazendaId: f1.id, piqueteId: piquetes[1].id, nome: 'Lote Recria 02', tipo: 'recria', pesoAlvoKg: 380, gmdMeta: 0.9, dataEntrada: new Date('2025-04-15'), status: 'ativo' },
      { fazendaId: f2.id, piqueteId: piquetes[3].id, nome: 'Lote Engorda A', tipo: 'engorda', pesoAlvoKg: 500, gmdMeta: 1.1, dataEntrada: new Date('2025-02-10'), status: 'ativo' },
      { fazendaId: f3.id, piqueteId: piquetes[5].id, nome: 'Lote Cria Central', tipo: 'cria', pesoAlvoKg: 300, gmdMeta: 0.7, dataEntrada: new Date('2025-01-20'), status: 'ativo' },
    ]});
  }
  const lotes = await prisma.lote.findMany();

  const nAn = await prisma.animal.count();
  if (nAn === 0) {
    const racas = ['Nelore', 'Angus', 'Brahman', 'Senepol', 'Girolando'];
    const cats = ['bezerro', 'garrote', 'novilha', 'vaca', 'touro'];
    const data = [];
    for (let i = 0; i < 40; i++) {
      const faz = i < 20 ? f1 : (i < 30 ? f2 : f3);
      const lote = i < 15 ? lotes[0] : (i < 20 ? lotes[1] : (i < 30 ? lotes[2] : lotes[3]));
      data.push({ fazendaId: faz.id, loteId: lote.id, brinco: `BF${String(i + 1).padStart(4, '0')}`, nome: `Animal ${i + 1}`, sexo: i % 3 === 0 ? 'F' : 'M', raca: racas[i % racas.length], categoria: cats[i % cats.length], dataNascimento: new Date(2022, i % 12, (i % 27) + 1), pesoAtualKg: 250 + (i * 7) % 300, pesoAlvoKg: 480, gmdAtual: 0.8 + (i % 5) * 0.1, status: 'ativo', rfid: `RFID${1000 + i}` });
    }
    await prisma.animal.createMany({ data });
  }
  const animais = await prisma.animal.findMany({ take: 20 });

  const nPes = await prisma.pesagem.count();
  if (nPes === 0) {
    const data = [];
    for (let i = 0; i < 20; i++) {
      data.push({ animalId: animais[i].id, pesoKg: 250 + i * 8, data: new Date(2025, 4, (i % 28) + 1), gmd: 0.9 + (i % 4) * 0.1, origem: 'manual', usuarioId: admin.id });
    }
    await prisma.pesagem.createMany({ data });
  }

  const nProt = await prisma.protocoloSanitario.count();
  if (nProt === 0) {
    await prisma.protocoloSanitario.createMany({ data: [
      { fazendaId: f1.id, nome: 'Vacinação Aftosa', descricao: 'Campanha anual', tipo: 'vacina', intervaloDias: 365, carenciaDias: 0, ativo: true },
      { fazendaId: f1.id, nome: 'Vermifugação', descricao: 'Controle de parasitas', tipo: 'vermifugo', intervaloDias: 90, carenciaDias: 30, ativo: true },
      { fazendaId: f2.id, nome: 'Vacinação Brucelose', descricao: 'Bezerras 3-8 meses', tipo: 'vacina', intervaloDias: 365, carenciaDias: 0, ativo: true },
    ]});
  }
  const protocolos = await prisma.protocoloSanitario.findMany();

  const nIns = await prisma.insumo.count();
  if (nIns === 0) {
    await prisma.insumo.createMany({ data: [
      { fazendaId: f1.id, nome: 'Vacina Aftosa', categoria: 'vacina', unidade: 'dose', quantidadeAtual: 500, estoqueMinimo: 100, valorUnitario: 3.5, validade: new Date('2026-06-01') },
      { fazendaId: f1.id, nome: 'Vermífugo Bovino', categoria: 'vermifugo', unidade: 'ml', quantidadeAtual: 2000, estoqueMinimo: 500, valorUnitario: 0.15, validade: new Date('2026-03-15') },
      { fazendaId: f1.id, nome: 'Sal Mineral', categoria: 'suplemento', unidade: 'kg', quantidadeAtual: 1500, estoqueMinimo: 300, valorUnitario: 4.2 },
      { fazendaId: f2.id, nome: 'Ração Engorda', categoria: 'racao', unidade: 'kg', quantidadeAtual: 3000, estoqueMinimo: 800, valorUnitario: 2.8 },
    ]});
  }
  const insumos = await prisma.insumo.findMany();

  const nApl = await prisma.aplicacaoSanitaria.count();
  if (nApl === 0) {
    const data = [];
    for (let i = 0; i < 15; i++) {
      data.push({ protocoloId: protocolos[i % protocolos.length].id, animalId: animais[i].id, insumoId: insumos[i % insumos.length].id, dataAplicacao: new Date(2025, 3, (i % 28) + 1), dataVencimento: new Date(2026, 3, (i % 28) + 1), dose: '5ml', responsavelId: admin.id });
    }
    await prisma.aplicacaoSanitaria.createMany({ data });
  }

  const nEv = await prisma.eventoReprodutivo.count();
  if (nEv === 0) {
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({ fazendaId: f1.id, animalId: animais[i].id, tipo: i % 2 === 0 ? 'inseminacao' : 'diagnostico', data: new Date(2025, 2, (i % 28) + 1), resultado: i % 3 === 0 ? 'positivo' : 'negativo', observacao: 'Acompanhamento reprodutivo' });
    }
    await prisma.eventoReprodutivo.createMany({ data });
  }

  const nCusto = await prisma.custo.count();
  if (nCusto === 0) {
    await prisma.custo.createMany({ data: [
      { fazendaId: f1.id, loteId: lotes[0].id, categoria: 'alimentacao', descricao: 'Compra de ração', valor: 8500.0, data: new Date('2025-04-01'), rateioAutomatico: true, usuarioId: admin.id },
      { fazendaId: f1.id, loteId: lotes[0].id, categoria: 'sanidade', descricao: 'Vacinas e medicamentos', valor: 2300.0, data: new Date('2025-04-10'), rateioAutomatico: true, usuarioId: admin.id },
      { fazendaId: f1.id, loteId: lotes[1].id, categoria: 'mao_de_obra', descricao: 'Salários equipe', valor: 12000.0, data: new Date('2025-04-30'), rateioAutomatico: true, usuarioId: admin.id },
      { fazendaId: f2.id, loteId: lotes[2].id, categoria: 'alimentacao', descricao: 'Suplementação mineral', valor: 4200.0, data: new Date('2025-04-15'), rateioAutomatico: true, usuarioId: admin.id },
      { fazendaId: f3.id, loteId: lotes[3].id, categoria: 'infraestrutura', descricao: 'Reforma de cercas', valor: 6800.0, data: new Date('2025-03-20'), rateioAutomatico: true, usuarioId: jogador.id },
    ]});
  }

  const nChuva = await prisma.registroChuva.count();
  if (nChuva === 0) {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({ fazendaId: f1.id, data: new Date(2025, i, 15), milimetros: 20 + (i * 13) % 120, observacao: 'Chuva mensal' });
    }
    await prisma.registroChuva.createMany({ data });
  }

  const nMov = await prisma.movimentacaoEstoque.count();
  if (nMov === 0) {
    await prisma.movimentacaoEstoque.createMany({ data: [
      { insumoId: insumos[0].id, fazendaId: f1.id, tipo: 'entrada', quantidade: 500, motivo: 'Compra', usuarioId: admin.id, data: new Date('2025-03-01') },
      { insumoId: insumos[1].id, fazendaId: f1.id, tipo: 'saida', quantidade: 200, motivo: 'Aplicação', usuarioId: admin.id, data: new Date('2025-04-05') },
      { insumoId: insumos[2].id, fazendaId: f1.id, tipo: 'entrada', quantidade: 1000, motivo: 'Compra', usuarioId: admin.id, data: new Date('2025-04-12') },
      { insumoId: insumos[3].id, fazendaId: f2.id, tipo: 'saida', quantidade: 500, motivo: 'Trato diário', usuarioId: admin.id, data: new Date('2025-04-20') },
    ]});
  }

  const nNot = await prisma.notification.count();
  if (nNot === 0) {
    await prisma.notification.createMany({ data: [
      { userId: admin.id, titulo: 'Bem-vindo ao Boi Forte', mensagem: 'Sua conta de demonstração está pronta.', tipo: 'info', lida: false, canal: 'push' },
      { userId: admin.id, titulo: 'Estoque baixo', mensagem: 'Sal mineral abaixo do mínimo.', tipo: 'alerta', lida: false, canal: 'push' },
      { userId: jogador.id, titulo: 'Pesagem pendente', mensagem: 'Você tem animais sem pesagem recente.', tipo: 'info', lida: false, canal: 'push' },
    ]});
  }

  const nPlan = await prisma.plano.count();
  if (nPlan === 0) {
    await prisma.plano.createMany({ data: [
      { nome: 'Free', descricao: 'Plano gratuito', precoMensal: 0, limiteFazendas: 1, limiteAnimais: 50, ativo: true },
      { nome: 'Pro', descricao: 'Plano profissional', precoMensal: 149.9, limiteFazendas: 5, limiteAnimais: 1000, ativo: true },
      { nome: 'Enterprise', descricao: 'Plano corporativo', precoMensal: 499.9, limiteFazendas: 50, limiteAnimais: 10000, ativo: true },
    ]});
  }
  const planos = await prisma.plano.findMany();

  const nAss = await prisma.assinatura.count();
  if (nAss === 0) {
    await prisma.assinatura.createMany({ data: [
      { userId: admin.id, planoId: planos[1].id, status: 'ativa', inicioEm: new Date('2025-01-01') },
      { userId: jogador.id, planoId: planos[0].id, status: 'ativa', inicioEm: new Date('2025-02-01') },
    ]});
  }

  const nLog = await prisma.logAuditoria.count();
  if (nLog === 0) {
    await prisma.logAuditoria.createMany({ data: [
      { userId: admin.id, fazendaId: f1.id, acao: 'criar', entidade: 'Animal', entidadeId: animais[0].id, ip: '187.45.10.1', userAgent: 'Mozilla/5.0' },
      { userId: admin.id, fazendaId: f1.id, acao: 'atualizar', entidade: 'Lote', entidadeId: lotes[0].id, ip: '187.45.10.1', userAgent: 'Mozilla/5.0' },
      { userId: jogador.id, fazendaId: f3.id, acao: 'criar', entidade: 'Pesagem', ip: '200.150.20.5', userAgent: 'Mozilla/5.0' },
    ]});
  }

  const nHist = await prisma.historicoRotacao.count();
  if (nHist === 0) {
    await prisma.historicoRotacao.createMany({ data: [
      { piqueteId: piquetes[0].id, loteId: lotes[0].id, entradaEm: new Date('2025-03-01'), saidaEm: new Date('2025-04-01'), diasOcupacao: 31, diasDescanso: 30, observacao: 'Rotação normal' },
      { piqueteId: piquetes[1].id, loteId: lotes[1].id, entradaEm: new Date('2025-04-15'), diasOcupacao: 20, observacao: 'Em andamento' },
      { piqueteId: piquetes[3].id, loteId: lotes[2].id, entradaEm: new Date('2025-02-10'), diasOcupacao: 45, observacao: 'Rotação estendida' },
    ]});
  }

  const nMovLote = await prisma.movimentacaoLote.count();
  if (nMovLote === 0) {
    await prisma.movimentacaoLote.createMany({ data: [
      { animalId: animais[0].id, loteOrigemId: lotes[1].id, loteDestinoId: lotes[0].id, tipo: 'transferencia', data: new Date('2025-03-01'), motivo: 'Mudança de fase', usuarioId: admin.id, loteId: lotes[0].id },
      { animalId: animais[1].id, loteOrigemId: lotes[0].id, loteDestinoId: lotes[1].id, tipo: 'transferencia', data: new Date('2025-03-15'), motivo: 'Ajuste de lote', usuarioId: admin.id, loteId: lotes[1].id },
      { animalId: animais[2].id, loteDestinoId: lotes[2].id, tipo: 'entrada', data: new Date('2025-02-10'), motivo: 'Compra', usuarioId: admin.id, loteId: lotes[2].id },
    ]});
  }

  const nParto = await prisma.parto.count();
  if (nParto === 0) {
    await prisma.parto.createMany({ data: [
      { maeId: animais[0].id, dataParto: new Date('2025-01-15'), tipoParto: 'normal', pesoNascimentoKg: 32.5, safra: '2025' },
      { maeId: animais[3].id, dataParto: new Date('2025-02-20'), tipoParto: 'cesariana', pesoNascimentoKg: 35.0, safra: '2025' },
      { maeId: animais[6].id, dataParto: new Date('2025-03-10'), tipoParto: 'normal', pesoNascimentoKg: 30.0, safra: '2025' },
    ]});
  }

  const nRel = await prisma.relatorio.count();
  if (nRel === 0) {
    await prisma.relatorio.createMany({ data: [
      { fazendaId: f1.id, usuarioId: admin.id, tipo: 'rebanho', formato: 'pdf', status: 'concluido', urlArquivo: 'https://demo.app/relatorios/rebanho.pdf' },
      { fazendaId: f1.id, usuarioId: admin.id, tipo: 'financeiro', formato: 'xlsx', status: 'concluido', urlArquivo: 'https://demo.app/relatorios/financeiro.xlsx' },
      { fazendaId: f2.id, usuarioId: admin.id, tipo: 'sanidade', formato: 'pdf', status: 'pendente' },
    ]});
  }

  const nProj = await prisma.project.count();
  if (nProj === 0) {
    await prisma.project.createMany({ data: [
      { name: 'Projeto Melhoramento Genético', ownerId: admin.id },
      { name: 'Projeto Sustentabilidade', ownerId: admin.id },
    ]});
  }
}

main().then(()=>prisma.$disconnect()).catch(async(e)=>{console.error('[seed] ERRO:',e.message);await prisma.$disconnect();process.exit(1);});