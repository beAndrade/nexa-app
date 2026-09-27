import { eq } from 'drizzle-orm';
import type { Db } from '../db';
import { atendimentosPedido, avaliacaoSolicitacoes } from '../db/schema';
import { normalizeGoogleReviewUrl } from './salao-config.service';
import { telefoneBrDigitos } from '../shared/utils/telefone-br';

const STATUS_WHATSAPP_ABERTO = 'whatsapp_aberto';

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
