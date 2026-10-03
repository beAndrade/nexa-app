/**
 * Listagem de clientes — CC-09-A (paginação) + CC-09-B (busca e filtros server-side).
 */

import { and, asc, eq, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../db';
import { clientes } from '../db/schema';
import { mapClienteRowToApi } from './clientes-cadastro-normalize';

export const CLIENTES_PAGE_SIZES = [20, 50, 100] as const;
export const CLIENTES_PAGE_SIZE_DEFAULT = 20;

export type ListClientesFiltros = {
  search?: string | null;
  /** Todos / Ativos / Inativos → `status_operacional` (não `notificacoes_ativo`). */
  status?: string | null;
  /** Com/sem celular — somente coluna `celular`. */
  hasCellphone?: boolean | string | null;
  birthdayFrom?: string | null;
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

/** YYYY-MM-DD válido (calendário); senão null → extremo inativo. */
export function parseBirthdayBound(
  raw: string | null | undefined,
): string | null {
  const s = String(raw ?? '')
    .trim()
    .slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [ys, ms, ds] = s.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return s;
}

/**
 * F-B03: accent-insensitive via `translate` (sem extensão `unaccent` / sem migration).
 * Espelha NFD + strip diacríticos do FE legado.
 */
const ACCENT_FROM =
  'áàãâäåāăąÁÀÃÂÄÅĀĂĄéèêëēėęÉÈÊËĒĖĘíìîïīįÍÌÎÏĪĮóòõôöøōőÓÒÕÔÖØŌŐúùûüūůűÚÙÛÜŪŮŰçćčÇĆČñńÑŃýÿÝŸ';
/** Mesmo comprimento que ACCENT_FROM (translate exige pares 1:1). */
const ACCENT_TO =
  'aaaaaaaaaaaaaaaaaaeeeeeeeeeeeeeeiiiiiiiiiiiioooooooooooooooouuuuuuuuuuuuuuccccccnnnnyyyy';

function sqlAccentFoldCol(
  col:
    | typeof clientes.nomeExibido
    | typeof clientes.apelido
    | typeof clientes.email,
): SQL {
  return sql`translate(lower(coalesce(${col}, '')), ${ACCENT_FROM}, ${ACCENT_TO})`;
}

function normalizeSearchText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function escapeLikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function onlyDigits(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * Normaliza `aniversario` (texto) para YYYY-MM-DD comparável:
 * - DD/MM/AAAA válido → ano real
 * - DD/MM → 2000-MM-DD
 * - ausente / não parseável → NULL (fora do filtro quando ativo)
 */
function sqlAniversarioYmd(): SQL {
  const raw = sql`btrim(coalesce(${clientes.aniversario}, ''))`;
  return sql`(
    CASE
      WHEN ${raw} ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN (
        SELECT CASE
          WHEN m BETWEEN 1 AND 12
            AND d BETWEEN 1 AND 31
            AND EXTRACT(
              DAY FROM (
                (
                  date_trunc('month', make_date(y, m, 1))
                  + ((d - 1) * interval '1 day')
                )::date
              )
            ) = d
          THEN to_char(
            (
              date_trunc('month', make_date(y, m, 1))
              + ((d - 1) * interval '1 day')
            )::date,
            'YYYY-MM-DD'
          )
          ELSE NULL
        END
        FROM (
          SELECT
            (regexp_match(${raw}, '^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})$'))[1]::int AS d,
            (regexp_match(${raw}, '^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})$'))[2]::int AS m,
            (regexp_match(${raw}, '^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})$'))[3]::int AS y
        ) p
      )
      WHEN ${raw} ~ '^[0-9]{1,2}/[0-9]{1,2}$' THEN (
        SELECT CASE
          WHEN m BETWEEN 1 AND 12 AND d BETWEEN 1 AND 31
          THEN '2000-' || lpad(m::text, 2, '0') || '-' || lpad(d::text, 2, '0')
          ELSE NULL
        END
        FROM (
          SELECT
            (regexp_match(${raw}, '^([0-9]{1,2})/([0-9]{1,2})$'))[1]::int AS d,
            (regexp_match(${raw}, '^([0-9]{1,2})/([0-9]{1,2})$'))[2]::int AS m
        ) p
      )
      ELSE NULL
    END
  )`;
}

function buildSearchCondition(searchRaw: string | null | undefined): SQL | null {
  const trimmed = String(searchRaw ?? '').trim();
  if (!trimmed) return null;

  const textNorm = normalizeSearchText(trimmed);
  const digits = onlyDigits(trimmed);
  const parts: SQL[] = [];

  if (textNorm) {
    const pattern = `%${escapeLikePattern(textNorm)}%`;
    parts.push(
      sql`${sqlAccentFoldCol(clientes.nomeExibido)} LIKE ${pattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`${sqlAccentFoldCol(clientes.apelido)} LIKE ${pattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`${sqlAccentFoldCol(clientes.email)} LIKE ${pattern} ESCAPE '\\'`,
    );
  }

  if (digits) {
    const digPattern = `%${escapeLikePattern(digits)}%`;
    // Celular e fixo separados; NÃO usa `telefone` legado como celular.
    parts.push(
      sql`regexp_replace(coalesce(${clientes.celular}, ''), '\\D', '', 'g') LIKE ${digPattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`regexp_replace(coalesce(${clientes.telefoneFixo}, ''), '\\D', '', 'g') LIKE ${digPattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`regexp_replace(coalesce(${clientes.cpf}, ''), '\\D', '', 'g') LIKE ${digPattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`regexp_replace(coalesce(${clientes.cnpj}, ''), '\\D', '', 'g') LIKE ${digPattern} ESCAPE '\\'`,
    );
    parts.push(
      sql`regexp_replace(coalesce(${clientes.rg}, ''), '\\D', '', 'g') LIKE ${digPattern} ESCAPE '\\'`,
    );
  }

  if (parts.length === 0) return null;
  return or(...parts)!;
}

function buildBirthdayCondition(
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
): SQL | null {
  const from = parseBirthdayBound(fromRaw);
  const to = parseBirthdayBound(toRaw);
  if (!from && !to) return null;

  const ymd = sqlAniversarioYmd();
  const parts: SQL[] = [sql`${ymd} IS NOT NULL`];
  if (from) parts.push(sql`${ymd} >= ${from}`);
  if (to) parts.push(sql`${ymd} <= ${to}`);
  return and(...parts)!;
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

  const searchCond = buildSearchCondition(filtros.search);
  if (searchCond) conditions.push(searchCond);

  const birthdayCond = buildBirthdayCondition(
    filtros.birthdayFrom,
    filtros.birthdayTo,
  );
  if (birthdayCond) conditions.push(birthdayCond);

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
