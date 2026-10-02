import { asc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import {
  atendimentos,
  atendimentosPedido,
  avaliacaoSolicitacoes,
  clienteCreditoMovimentos,
  clientes,
  produtos,
  servicos,
  whatsappLogs,
} from '../db/schema';
import { mapClienteRowToApi } from './clientes-cadastro-normalize';

/**
 * Temporary compatibility reexports (Sprint 2A).
 * Implementations live in `modules/beauty/application/`.
 * New Beauty catalog functionality must be added there — not here.
 */
export {
  listCabelosApi,
  listPacotesApi,
  listPacotesQueratinaApi,
  listRegrasMegaApi,
  listRegrasMegaQueratinaApi,
} from '../modules/beauty/application';

export async function listClientesNormalized(db: Db) {
  const rows = await db.select().from(clientes).orderBy(asc(clientes.nomeExibido));
  return rows
    .map((r) => mapClienteRowToApi(r))
    .filter((x) => x.nome.trim() && x.id.trim());
}

export async function getClienteById(db: Db, id: string) {
  const [r] = await db
    .select()
    .from(clientes)
    .where(eq(clientes.idCliente, id.trim()))
    .limit(1);
  if (!r) return null;
  return mapClienteRowToApi(r);
}

/**
 * Propaga o nome actual do cadastro para as cópias em `atendimentos.nome_cliente`
 * (listas de comandas/agenda/financeiro leem esse campo).
 */
export async function sincronizarNomeClienteEmAtendimentos(
  db: Db,
  idCliente: string,
  nomeExibido: string,
): Promise<number> {
  const cid = String(idCliente || '').trim();
  const nome = String(nomeExibido || '').trim();
  if (!cid || !nome) return 0;
  const updated = await db
    .update(atendimentos)
    .set({ nomeCliente: nome })
    .where(eq(atendimentos.idCliente, cid))
    .returning({ id: atendimentos.id });
  return updated.length;
}

/**
 * Próximo `id_cliente` no padrão da planilha (`CL0001`, …).
 * Usa agregação SQL (evita depender da forma do resultado do `select` no Drizzle e ignora UUIDs).
 */
export async function allocNextClienteClId(db: Db): Promise<string> {
  const rows = await db.execute(
    sql.raw(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(id_cliente, 3) AS INTEGER)), 0) AS max_n
      FROM clientes
      WHERE id_cliente ~* '^cl[0-9]+$'
    `),
  );
  const first = Array.from(rows as Iterable<Record<string, unknown>>)[0];
  const max = Number(first?.max_n ?? 0);
  const n = Number.isFinite(max) ? max : 0;
  const next = n + 1;
  return `CL${String(next).padStart(4, '0')}`;
}

/** Tipo operacional do primeiro vínculo que bloqueia exclusão (ordem do TD §8). */
export type ClienteDeleteRelatedTipo =
  | 'atendimentos'
  | 'comandas'
  | 'créditos'
  | 'avaliações'
  | 'mensagens';

export type DeleteClienteByIdResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'has_related'; tipo: ClienteDeleteRelatedTipo };

/**
 * Exclusão protegida (TD §8 / CC-05): SELECT FOR UPDATE, conta relações,
 * 409 sem apagar filhos; DELETE só em `clientes` quando livre.
 */
export async function deleteClienteById(
  db: Db,
  id: string,
): Promise<DeleteClienteByIdResult> {
  const cid = id.trim();
  if (!cid) return { status: 'not_found' };

  return await db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: clientes.idCliente })
      .from(clientes)
      .where(eq(clientes.idCliente, cid))
      .for('update')
      .limit(1);

    if (!locked) return { status: 'not_found' };

    const [nAtend] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(atendimentos)
      .where(eq(atendimentos.idCliente, cid));
    if (Number(nAtend?.n ?? 0) > 0) {
      return { status: 'has_related', tipo: 'atendimentos' };
    }

    const [nPedido] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(atendimentosPedido)
      .where(eq(atendimentosPedido.idCliente, cid));
    if (Number(nPedido?.n ?? 0) > 0) {
      return { status: 'has_related', tipo: 'comandas' };
    }

    const [nCredito] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(clienteCreditoMovimentos)
      .where(eq(clienteCreditoMovimentos.clienteId, cid));
    if (Number(nCredito?.n ?? 0) > 0) {
      return { status: 'has_related', tipo: 'créditos' };
    }

    const [nAvaliacao] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(avaliacaoSolicitacoes)
      .where(eq(avaliacaoSolicitacoes.clienteId, cid));
    if (Number(nAvaliacao?.n ?? 0) > 0) {
      return { status: 'has_related', tipo: 'avaliações' };
    }

    const [nWhatsapp] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(whatsappLogs)
      .where(eq(whatsappLogs.clienteId, cid));
    if (Number(nWhatsapp?.n ?? 0) > 0) {
      return { status: 'has_related', tipo: 'mensagens' };
    }

    await tx.delete(clientes).where(eq(clientes.idCliente, cid));
    return { status: 'deleted' };
  });
}

export async function listServicosForApi(db: Db) {
  const rows = await db.select().from(servicos).orderBy(asc(servicos.id));
  return rows
    .map((r) => {
      const empty =
        !r.servico?.trim() &&
        !r.tipo?.trim() &&
        r.valorBase == null &&
        r.precoCurto == null;
      if (empty) return null;
      return {
        id: String(r.id),
        Serviço: r.servico,
        Tipo: r.tipo,
        duracao_minutos: r.duracaoMinutos ?? 30,
        duracao_curto: r.duracaoCurto ?? null,
        duracao_medio: r.duracaoMedio ?? null,
        duracao_m_l: r.duracaoMedioLongo ?? null,
        duracao_longo: r.duracaoLongo ?? null,
        'Valor Base': r.valorBase,
        'Comissão Fixa': r.comissaoFixa,
        'Comissão %': r.comissaoPct,
        'Preço Curto': r.precoCurto,
        'Preço Médio': r.precoMedio,
        'Preço Médio/Longo': r.precoMedioLongo,
        'Preço Longo': r.precoLongo,
        'Custo Fixo': r.custoFixo,
        Curto: r.curto,
        Médio: r.medio,
        'M/L': r.mL,
        Longo: r.longo,
        Categoria: r.categoria ?? null,
        mostra_no_site: r.mostraNoSite !== false,
        Descrição: r.descricao ?? null,
        foto_url: r.fotoUrl ?? null,
        /** Aliases ASCII — o front prefere estes para evitar falha de chave acentuada. */
        valor_base: r.valorBase,
        comissao_fixa: r.comissaoFixa,
        comissao_pct: r.comissaoPct,
        preco_curto: r.precoCurto,
        preco_medio: r.precoMedio,
        preco_medio_longo: r.precoMedioLongo,
        preco_longo: r.precoLongo,
        custo_fixo: r.custoFixo,
        curto: r.curto,
        medio: r.medio,
        m_l: r.mL,
        longo: r.longo,
        nome: r.servico,
        tipo: r.tipo,
        categoria: r.categoria ?? null,
        descricao: r.descricao ?? null,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
}

export async function listProdutosApi(db: Db) {
  const rows = await db.select().from(produtos);
  return rows
    .filter((r) => r.produto?.trim())
    .map((r) => ({
      id: r.id,
      produto: String(r.produto).trim(),
      categoria: r.categoria != null ? String(r.categoria).trim() : '',
      marca: r.marca != null ? String(r.marca).trim() : '',
      preco: r.preco,
      custo: r.custo,
      estoque: r.estoque,
      estoque_inicial: r.estoqueInicial,
      estoque_minimo: r.estoqueMinimo,
      unidade: r.unidade != null ? String(r.unidade) : '',
      unidade_equivalente: r.unidadeEquivalente,
      preco_profissional: r.precoProfissional,
      custo_adicional: r.custoAdicional,
      comissao_padrao: r.comissaoPadrao,
      codigo_item: r.codigoItem,
      codigo_barras: r.codigoBarras,
      observacoes: r.observacoes,
      foto_url: r.fotoUrl,
    }));
}
