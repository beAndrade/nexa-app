/**
 * Listagem de clientes — CC-09-A (paginação server-side + infra de filtros).
 * Matching completo de `search` e aniversário: CC-09-B.
 */

import { and, asc, eq, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../db';
import { clientes } from '../db/schema';
import { mapClienteRowToApi } from './clientes-cadastro-normalize';

export const CLIENTES_PAGE_SIZES = [20, 50, 100] as const;
export const CLIENTES_PAGE_SIZE_DEFAULT = 20;

export type ListClientesFiltros = {
  /** Reservado para CC-09-B (matching completo). */
  search?: string | null;
  /** Todos / Ativos / Inativos → `status_operacional` (não `notificacoes_ativo`). */
  status?: string | null;
  /** Com/sem celular — somente coluna `celular`. */
  hasCellphone?: boolean | string | null;
  /** Reservado para CC-09-B. */
  birthdayFrom?: string | null;
  /** Reservado para CC-09-B. */
  birthdayTo?: string | null;
};

export type ListClientesPaginadoOpts = ListClientesFiltros & {
  page?: number | string | null;
  pageSize?: number | string | null;
};

export type ListClientesPaginadoResult = {
  items: ReturnType<typeof mapClienteRowToApi>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** True quando a query traz algum parâmetro de paginação (modo paginado). */
export function isClientesListagemPaginada(query: Record<string, unknown>): boolean {
  const page = query.page;
  const pageSize = query.pageSize ?? query.page_size;
  const hasPage = page !== undefined && page !== null && String(page) !== '';
  const hasPageSize =
    pageSize !== undefined && pageSize !== null && String(pageSize) !== '';
  return hasPage || hasPageSize;
}

export function normalizeClientesPage(raw: unknown): number {
  const n =
    typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return Math.trunc(n);
  return 1;
}

/**
 * Somente 20 / 50 / 100. Valor inválido ou ausente → default 20
 * (alinha a “somente aceitos” + default do contrato).
 */
export function normalizeClientesPageSize(raw: unknown): number {
  const n =
    typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  if (
    Number.isFinite(n) &&
    (CLIENTES_PAGE_SIZES as readonly number[]).includes(Math.trunc(n))
  ) {
    return Math.trunc(n);
  }
  return CLIENTES_PAGE_SIZE_DEFAULT;
}

/**
 * Interpreta `hasCellphone` da query/body.
 * `null` / vazio / “todos” → sem filtro.
 */
export function parseHasCellphoneFilter(
  raw: boolean | string | null | undefined,
): boolean | null {
  if (raw === true) return true;
  if (raw === false) return false;
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === 'all' || s === 'todos' || s === 'null' || s === 'undefined') {
    return null;
  }
  if (
    s === 'true' ||
    s === '1' ||
    s === 'com' ||
    s === 'with' ||
    s === 'sim' ||
    s === 'yes'
  ) {
    return true;
  }
  if (
    s === 'false' ||
    s === '0' ||
    s === 'sem' ||
    s === 'without' ||
    s === 'nao' ||
    s === 'não' ||
    s === 'no'
  ) {
    return false;
  }
  return null;
}

/** Predicados compartilháveis com bulk `allFiltered` (CC-09-E). */
export function buildClientesListConditions(filtros: ListClientesFiltros = {}): SQL[] {
  const conditions: SQL[] = [];

  const statusRaw = String(filtros.status ?? '')
    .trim()
    .toLowerCase();
  if (statusRaw && statusRaw !== 'todos' && statusRaw !== 'all') {
    if (
      statusRaw === 'ativo' ||
      statusRaw === 'ativos' ||
      statusRaw === 'active'
    ) {
      conditions.push(eq(clientes.statusOperacional, 'ativo'));
    } else if (
      statusRaw === 'inativo' ||
      statusRaw === 'inativos' ||
      statusRaw === 'inactive'
    ) {
      conditions.push(eq(clientes.statusOperacional, 'inativo'));
    }
  }

  const hasCell = parseHasCellphoneFilter(filtros.hasCellphone);
  if (hasCell === true) {
    conditions.push(
      and(
        isNotNull(clientes.celular),
        sql`btrim(${clientes.celular}) <> ''`,
      )!,
    );
  } else if (hasCell === false) {
    conditions.push(
      or(isNull(clientes.celular), sql`btrim(${clientes.celular}) = ''`)!,
    );
  }

  // CC-09-B: search (8 campos) + birthdayFrom/birthdayTo sobre `aniversario`.
  // Aceitos no contrato; predicados ainda não aplicados aqui.
  void filtros.search;
  void filtros.birthdayFrom;
  void filtros.birthdayTo;

  return conditions;
}

export function parseClientesListFiltrosFromQuery(
  query: Record<string, string | undefined>,
): ListClientesFiltros {
  return {
    search: query.search ?? null,
    status: query.status ?? null,
    hasCellphone: query.hasCellphone ?? query.has_cellphone ?? null,
    birthdayFrom: query.birthdayFrom ?? query.birthday_from ?? null,
    birthdayTo: query.birthdayTo ?? query.birthday_to ?? null,
  };
}

export async function listClientesPaginado(
  db: Db,
  opts: ListClientesPaginadoOpts = {},
): Promise<ListClientesPaginadoResult> {
  const page = normalizeClientesPage(opts.page);
  const pageSize = normalizeClientesPageSize(
    opts.pageSize ?? CLIENTES_PAGE_SIZE_DEFAULT,
  );
  const offset = (page - 1) * pageSize;

  const conditions = buildClientesListConditions(opts);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(clientes)
    .where(whereClause);
  const total = Number(countRow?.n ?? 0);

  const rows = await db
    .select()
    .from(clientes)
    .where(whereClause)
    .orderBy(asc(clientes.nomeExibido), asc(clientes.idCliente))
    .limit(pageSize)
    .offset(offset);

  const items = rows.map((r) => mapClienteRowToApi(r));
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

  return { items, page, pageSize, total, totalPages };
}
