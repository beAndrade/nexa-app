import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../db';
import { atendimentosPedido, avaliacaoSolicitacoes, clientes } from '../db/schema';
import { SALAO_TIMEZONE } from '../lib/sql-local-datetime';
import { normalizeGoogleReviewUrl } from './salao-config.service';
import { telefoneBrDigitos } from '../shared/utils/telefone-br';

const STATUS_WHATSAPP_ABERTO = 'whatsapp_aberto';
const STATUS_VALIDOS = new Set([STATUS_WHATSAPP_ABERTO]);
const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 100;

export type AvaliacaoSolicitacaoApiItem = {
  id: number;
  id_atendimento: string | null;
  cliente_id: string | null;
  telefone: string;
  google_review_url: string;
  status: string;
  whatsapp_aberto_em: string;
  created_at: string;
};

export type AvaliacaoSolicitacaoListaItem = AvaliacaoSolicitacaoApiItem & {
  numero_comanda: number | null;
  cliente_nome: string | null;
};

export type AvaliacaoSolicitacoesResumo = {
  total: number;
  este_mes: number;
  clientes_alcancados: number;
  ultima_solicitacao_em: string | null;
};

export type AvaliacaoSolicitacoesLista = {
  resumo: AvaliacaoSolicitacoesResumo;
  items: AvaliacaoSolicitacaoListaItem[];
  total: number;
  page: number;
  page_size: number;
};

export type ListarAvaliacaoSolicitacoesOpts = {
  search?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
};

export type CriarAvaliacaoSolicitacaoInput = {
  id_atendimento: string;
  cliente_id: string;
  telefone: string;
  google_review_url: string;
};

function mapRow(
  row: typeof avaliacaoSolicitacoes.$inferSelect,
): AvaliacaoSolicitacaoApiItem {
  return {
    id: row.id,
    id_atendimento: row.idAtendimento,
    cliente_id: row.clienteId,
    telefone: row.telefone,
    google_review_url: row.googleReviewUrl,
    status: row.status,
    whatsapp_aberto_em: row.whatsappAbertoEm.toISOString(),
    created_at: row.createdAt.toISOString(),
  };
}

function asInt(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function paraIso(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function ymdValido(ymd: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd);
}

function escapeLike(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function normalizarPaginacao(opts?: ListarAvaliacaoSolicitacoesOpts): {
  page: number;
  pageSize: number;
} {
  const pageRaw = opts?.page ?? 1;
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.trunc(pageRaw) : 1;
  const sizeRaw = opts?.pageSize ?? PAGE_SIZE_DEFAULT;
  const size = Number.isFinite(sizeRaw) ? Math.trunc(sizeRaw) : PAGE_SIZE_DEFAULT;
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, size));
  return { page, pageSize };
}

function montarFiltrosLista(opts?: ListarAvaliacaoSolicitacoesOpts): SQL[] {
  const conditions: SQL[] = [];

  const search = String(opts?.search ?? '').trim();
  if (search) {
    const orParts: SQL[] = [];
    const nomePattern = `%${escapeLike(search)}%`;
    orParts.push(ilike(clientes.nomeExibido, nomePattern));

    const digitos = telefoneBrDigitos(search);
    if (digitos.length > 0) {
      const telPattern = `%${escapeLike(digitos)}%`;
      orParts.push(
        sql`regexp_replace(coalesce(${avaliacaoSolicitacoes.telefone}, ''), '\\D', '', 'g') like ${telPattern}`,
      );
    }

    const soDigitos = /^\d+$/.test(search.trim());
    if (soDigitos) {
      const nComanda = Number.parseInt(search.trim(), 10);
      if (Number.isFinite(nComanda)) {
        orParts.push(eq(atendimentosPedido.numeroComanda, nComanda));
      }
    }

    if (orParts.length === 1) conditions.push(orParts[0]!);
    else if (orParts.length > 1) conditions.push(or(...orParts)!);
  }

  const statusRaw = String(opts?.status ?? '').trim();
  if (statusRaw) {
    if (!STATUS_VALIDOS.has(statusRaw)) {
      throw new Error(
        `Status inválido: "${statusRaw}". Valores aceitos: ${[...STATUS_VALIDOS].join(', ')}.`,
      );
    }
    conditions.push(eq(avaliacaoSolicitacoes.status, statusRaw));
  }

  const di = String(opts?.dataInicio ?? '').trim().slice(0, 10);
  const df = String(opts?.dataFim ?? '').trim().slice(0, 10);
  if (di || df) {
    if (di && !ymdValido(di)) {
      throw new Error('data_inicio inválida (use YYYY-MM-DD).');
    }
    if (df && !ymdValido(df)) {
      throw new Error('data_fim inválida (use YYYY-MM-DD).');
    }
    if (di && df && di > df) {
      throw new Error('data_inicio não pode ser posterior a data_fim.');
    }
    if (di) {
      conditions.push(
        sql`(timezone(${SALAO_TIMEZONE}, ${avaliacaoSolicitacoes.whatsappAbertoEm}))::date >= ${di}::date`,
      );
    }
    if (df) {
      conditions.push(
        sql`(timezone(${SALAO_TIMEZONE}, ${avaliacaoSolicitacoes.whatsappAbertoEm}))::date <= ${df}::date`,
      );
    }
  }

  return conditions;
}

async function carregarResumoGlobal(db: Db): Promise<AvaliacaoSolicitacoesResumo> {
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      esteMes: sql<number>`count(*) filter (
        where timezone(${SALAO_TIMEZONE}, ${avaliacaoSolicitacoes.whatsappAbertoEm})
          >= date_trunc('month', timezone(${SALAO_TIMEZONE}, now()))
      )::int`,
      clientesAlcancados: sql<number>`count(distinct ${avaliacaoSolicitacoes.clienteId})::int`,
      ultima: sql<Date | string | null>`max(${avaliacaoSolicitacoes.whatsappAbertoEm})`,
    })
    .from(avaliacaoSolicitacoes);

  return {
    total: asInt(agg?.total),
    este_mes: asInt(agg?.esteMes),
    clientes_alcancados: asInt(agg?.clientesAlcancados),
    ultima_solicitacao_em: paraIso(agg?.ultima ?? null),
  };
}

export async function listarAvaliacaoSolicitacoesApi(
  db: Db,
  opts?: ListarAvaliacaoSolicitacoesOpts,
): Promise<AvaliacaoSolicitacoesLista> {
  const { page, pageSize } = normalizarPaginacao(opts);
  const filtros = montarFiltrosLista(opts);
  const whereClause = filtros.length > 0 ? and(...filtros) : undefined;
  const offset = (page - 1) * pageSize;

  const resumo = await carregarResumoGlobal(db);

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(avaliacaoSolicitacoes)
    .leftJoin(clientes, eq(avaliacaoSolicitacoes.clienteId, clientes.idCliente))
    .leftJoin(
      atendimentosPedido,
      eq(avaliacaoSolicitacoes.idAtendimento, atendimentosPedido.idAtendimento),
    )
    .where(whereClause);

  const total = asInt(countRow?.n);

  const rows = await db
    .select({
      solicitacao: avaliacaoSolicitacoes,
      clienteNome: clientes.nomeExibido,
      numeroComanda: atendimentosPedido.numeroComanda,
    })
    .from(avaliacaoSolicitacoes)
    .leftJoin(clientes, eq(avaliacaoSolicitacoes.clienteId, clientes.idCliente))
    .leftJoin(
      atendimentosPedido,
      eq(avaliacaoSolicitacoes.idAtendimento, atendimentosPedido.idAtendimento),
    )
    .where(whereClause)
    .orderBy(
      desc(avaliacaoSolicitacoes.whatsappAbertoEm),
      desc(avaliacaoSolicitacoes.id),
    )
    .limit(pageSize)
    .offset(offset);

  return {
    resumo,
    items: rows.map(({ solicitacao, clienteNome, numeroComanda }) => ({
      ...mapRow(solicitacao),
      numero_comanda: numeroComanda,
      cliente_nome: clienteNome,
    })),
    total,
    page,
    page_size: pageSize,
  };
}

export async function criarAvaliacaoSolicitacaoApi(
  db: Db,
  input: CriarAvaliacaoSolicitacaoInput,
): Promise<AvaliacaoSolicitacaoApiItem> {
  const idAtendimento = String(input.id_atendimento ?? '').trim();
  const clienteId = String(input.cliente_id ?? '').trim();
  if (!idAtendimento) throw new Error('Atendimento obrigatório.');
  if (!clienteId) throw new Error('Cliente obrigatório.');

  const telefone = telefoneBrDigitos(input.telefone);
  if (telefone.length < 10) {
    throw new Error('Telefone inválido para WhatsApp.');
  }

  const googleReviewUrl = normalizeGoogleReviewUrl(input.google_review_url);
  if (!googleReviewUrl) {
    throw new Error('Informe um link http ou https válido.');
  }

  const [pedido] = await db
    .select({ idCliente: atendimentosPedido.idCliente })
    .from(atendimentosPedido)
    .where(eq(atendimentosPedido.idAtendimento, idAtendimento))
    .limit(1);
  if (!pedido) throw new Error('Atendimento não encontrado.');
  if (pedido.idCliente !== clienteId) {
    throw new Error('Cliente não pertence a este atendimento.');
  }

  const agora = new Date();
  const [row] = await db
    .insert(avaliacaoSolicitacoes)
    .values({
      idAtendimento,
      clienteId,
      telefone,
      googleReviewUrl,
      status: STATUS_WHATSAPP_ABERTO,
      whatsappAbertoEm: agora,
      createdAt: agora,
    })
    .returning();
  if (!row) throw new Error('Não foi possível registrar a solicitação de avaliação.');
  return mapRow(row);
}
