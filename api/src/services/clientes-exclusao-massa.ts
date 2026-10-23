/**
 * Exclusão em massa de clientes (CC-09-E).
 * Cada id resolvido passa por `deleteClienteById` (CC-05). Sem exclusão de filhos
 * e sem transação única do lote.
 */

import { and, asc, type SQL } from 'drizzle-orm';
import type { Db } from '../db';
import { clientes } from '../db/schema';
import { fail, ok, type ApiResponse } from '../shared/utils/envelope';
import {
  buildClientesListConditions,
  type ListClientesFiltros,
} from './clientes-listagem';
import {
  deleteClienteById as deleteClienteByIdPadrao,
  type ClienteDeleteRelatedTipo,
  type DeleteClienteByIdResult,
} from './queries';

const CHAVES_ALL_FILTERED = [
  'search',
  'status',
  'hasCellphone',
  'birthdayFrom',
  'birthdayTo',
  'excludedIds',
] as const;

export type ExcluirClientesEmMassaBloqueado = {
  id: string;
  tipo: ClienteDeleteRelatedTipo;
};

export type ExcluirClientesEmMassaData = {
  deleted: string[];
  blocked: ExcluirClientesEmMassaBloqueado[];
  notFound: string[];
};

export class ExcluirClientesEmMassaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcluirClientesEmMassaValidationError';
  }
}

export type ResolveClienteIdsFn = (
  db: Db,
  filtros: ListClientesFiltros,
) => Promise<string[]>;

export type ExcluirClientesEmMassaDeps = {
  deleteClienteById: (db: Db, id: string) => Promise<DeleteClienteByIdResult>;
  resolveFilteredIds: ResolveClienteIdsFn;
};

/** Mesmos predicados do GET paginado. `undefined` = nenhum filtro ativo. */
export function whereAllFiltered(
  filtros: ListClientesFiltros,
): SQL | undefined {
  const conditions = buildClientesListConditions(filtros);
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** IDs do conjunto filtrado, na ordem da lista (nome, id). Não aplica `excludedIds`. */
export async function listClienteIdsForListConditions(
  db: Db,
  filtros: ListClientesFiltros,
): Promise<string[]> {
  const rows = await db
    .select({ id: clientes.idCliente })
    .from(clientes)
    .where(whereAllFiltered(filtros))
    .orderBy(asc(clientes.nomeExibido), asc(clientes.idCliente));
  return rows.map((row) => String(row.id ?? ''));
}

export const exclusaoMassaDepsPadrao: ExcluirClientesEmMassaDeps = {
  deleteClienteById: deleteClienteByIdPadrao,
  resolveFilteredIds: listClienteIdsForListConditions,
};

function objetoPedido(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function idsExplicitos(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    throw new ExcluirClientesEmMassaValidationError('ids é obrigatório.');
  }
  const vistos = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new ExcluirClientesEmMassaValidationError(
        'ids contém identificador em branco.',
      );
    }
    const id = item.trim();
    if (!id) {
      throw new ExcluirClientesEmMassaValidationError(
        'ids contém identificador em branco.',
      );
    }
    if (vistos.has(id)) continue;
    vistos.add(id);
    ids.push(id);
  }
  if (ids.length === 0) {
    throw new ExcluirClientesEmMassaValidationError('ids é obrigatório.');
  }
  return ids;
}

/** Duplicata e ID em branco são descartados. Fora do conjunto filtrado não rejeita. */
function excludedIdsNormalizados(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    throw new ExcluirClientesEmMassaValidationError('excludedIds inválido.');
  }
  const vistos = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    ids.push(id);
  }
  return ids;
}

function filtrosDoSnapshot(body: Record<string, unknown>): ListClientesFiltros {
  const filtros: ListClientesFiltros = {};
  if ('search' in body) filtros.search = body.search as ListClientesFiltros['search'];
  if ('status' in body) filtros.status = body.status as ListClientesFiltros['status'];
  if ('hasCellphone' in body) {
    filtros.hasCellphone = body.hasCellphone as ListClientesFiltros['hasCellphone'];
  }
  if ('birthdayFrom' in body) {
    filtros.birthdayFrom = body.birthdayFrom as ListClientesFiltros['birthdayFrom'];
  }
  if ('birthdayTo' in body) {
    filtros.birthdayTo = body.birthdayTo as ListClientesFiltros['birthdayTo'];
  }
  return filtros;
}

type PedidoResolvido =
  | { mode: 'ids'; ids: string[] }
  | {
      mode: 'allFiltered';
      filtros: ListClientesFiltros;
      excludedIds: string[];
    };

function validarPedido(body: unknown): PedidoResolvido {
  const pedido = objetoPedido(body);
  if (!pedido) {
    throw new ExcluirClientesEmMassaValidationError('Pedido inválido.');
  }
  const mode = pedido.mode;
  if (mode !== 'ids' && mode !== 'allFiltered') {
    throw new ExcluirClientesEmMassaValidationError('mode inválido.');
  }

  if (mode === 'ids') {
    for (const chave of CHAVES_ALL_FILTERED) {
      if (chave in pedido) {
        throw new ExcluirClientesEmMassaValidationError(
          'Pedido mistura ids com filtros.',
        );
      }
    }
    return { mode: 'ids', ids: idsExplicitos(pedido.ids) };
  }

  if ('ids' in pedido && pedido.ids != null) {
    const ids = pedido.ids;
    if (!Array.isArray(ids) || ids.length > 0) {
      throw new ExcluirClientesEmMassaValidationError(
        'Pedido mistura allFiltered com ids.',
      );
    }
  }

  return {
    mode: 'allFiltered',
    filtros: filtrosDoSnapshot(pedido),
    excludedIds: excludedIdsNormalizados(pedido.excludedIds),
  };
}

function idsElegiveis(resolvidos: string[], excludedIds: readonly string[]): string[] {
  const excluidos = new Set(excludedIds);
  const vistos = new Set<string>();
  const ids: string[] = [];
  for (const bruto of resolvidos) {
    const id = String(bruto ?? '').trim();
    if (!id || excluidos.has(id) || vistos.has(id)) continue;
    vistos.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Valida o pedido inteiro antes da primeira chamada a `deleteClienteById`.
 * Resultado de negócio não interrompe o lote. Exceção propaga sem envelope.
 */
export async function excluirClientesEmMassa(
  db: Db,
  body: unknown,
  deps: ExcluirClientesEmMassaDeps = exclusaoMassaDepsPadrao,
): Promise<ExcluirClientesEmMassaData> {
  const pedido = validarPedido(body);

  const ids =
    pedido.mode === 'ids'
      ? pedido.ids
      : idsElegiveis(
          await deps.resolveFilteredIds(db, pedido.filtros),
          pedido.excludedIds,
        );

  const deleted: string[] = [];
  const blocked: ExcluirClientesEmMassaBloqueado[] = [];
  const notFound: string[] = [];

  for (const id of ids) {
    const resultado = await deps.deleteClienteById(db, id);
    if (resultado.status === 'deleted') {
      deleted.push(id);
    } else if (resultado.status === 'not_found') {
      notFound.push(id);
    } else {
      blocked.push({ id, tipo: resultado.tipo });
    }
  }

  return { deleted, blocked, notFound };
}

export async function executarExcluirClientesEmMassa(
  db: Db,
  body: unknown,
  deps?: ExcluirClientesEmMassaDeps,
): Promise<{
  status: 200 | 400 | 500;
  body: ApiResponse<ExcluirClientesEmMassaData>;
}> {
  try {
    const data = await excluirClientesEmMassa(db, body, deps);
    return { status: 200, body: ok(data) };
  } catch (e) {
    if (e instanceof ExcluirClientesEmMassaValidationError) {
      return { status: 400, body: fail('VALIDATION', e.message) };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 500, body: fail('SERVER', msg) };
  }
}
