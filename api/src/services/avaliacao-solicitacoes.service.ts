import { desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { atendimentosPedido, avaliacaoSolicitacoes, clientes } from '../db/schema';
import { SALAO_TIMEZONE } from '../lib/sql-local-datetime';
import { normalizeGoogleReviewUrl } from './salao-config.service';
import { telefoneBrDigitos } from '../shared/utils/telefone-br';

const STATUS_WHATSAPP_ABERTO = 'whatsapp_aberto';
const LIMITE_RECENTES = 50;

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

export type AvaliacaoSolicitacoesLista = {
  resumo: {
    total: number;
    este_mes: number;
    clientes_alcancados: number;
    ultima_solicitacao_em: string | null;
  };
  items: AvaliacaoSolicitacaoListaItem[];
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

export async function listarAvaliacaoSolicitacoesApi(
  db: Db,
): Promise<AvaliacaoSolicitacoesLista> {
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
    .orderBy(desc(avaliacaoSolicitacoes.whatsappAbertoEm), desc(avaliacaoSolicitacoes.id))
    .limit(LIMITE_RECENTES);

  return {
    resumo: {
      total: asInt(agg?.total),
      este_mes: asInt(agg?.esteMes),
      clientes_alcancados: asInt(agg?.clientesAlcancados),
      ultima_solicitacao_em: paraIso(agg?.ultima ?? null),
    },
    items: rows.map(({ solicitacao, clienteNome, numeroComanda }) => ({
      ...mapRow(solicitacao),
      numero_comanda: numeroComanda,
      cliente_nome: clienteNome,
    })),
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
