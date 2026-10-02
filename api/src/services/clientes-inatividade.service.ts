/**
 * CC-06 / TD §7 — Job de inatividade automática de clientes.
 *
 * Só grava `inativo_automatico` onde `status_modo = 'ativo'` e o predicado
 * dos 6 meses de calendário (America/Sao_Paulo) é verdadeiro.
 * Não reativa ninguém e não escreve em comandas/atendimentos.
 */

import { sql } from 'drizzle-orm';
import type { Db } from '../db';
import {
  SALAO_TIMEZONE,
  pad2,
  utcMsParaPartesSalao,
  ymdOfParts,
} from '../lib/sql-local-datetime';

/** Aceita `db` ou o `tx` de `db.transaction` (ambos expõem `execute`). */
type DbExec = Pick<Db, 'execute'>;

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Intervalo de checagem do “no máximo uma vez por dia civil”. */
export const INATIVIDADE_CLIENTES_INTERVALO_MS = 60 * 60 * 1000;

/** Último dia civil (SP) em que o UPDATE rodou neste processo. */
let ultimoDiaCivilExecutado: string | null = null;

export function hojeCivilSaoPaulo(nowMs: number = Date.now()): string {
  const p = utcMsParaPartesSalao(nowMs);
  if (!p) {
    throw new Error('Não foi possível obter a data civil em America/Sao_Paulo');
  }
  return ymdOfParts(p);
}

/**
 * Soma meses de calendário a um YMD, alinhado ao Postgres
 * (`date + interval 'N months'`: dia clampado ao fim do mês destino).
 */
export function addMesesCalendarioYmd(ymd: string, months: number): string {
  const m = YMD_RE.exec(String(ymd ?? '').trim());
  if (!m) {
    throw new Error(`Data civil inválida: ${ymd}`);
  }
  let y = parseInt(m[1], 10);
  let mo = parseInt(m[2], 10);
  let d = parseInt(m[3], 10);
  if (![y, mo, d].every(Number.isFinite) || mo < 1 || mo > 12 || d < 1 || d > 31) {
    throw new Error(`Data civil inválida: ${ymd}`);
  }

  const total = y * 12 + (mo - 1) + months;
  y = Math.floor(total / 12);
  mo = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (d > lastDay) d = lastDay;
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

/** Predicado TD §7: referência + 6 meses de calendário <= hoje (ambos YMD). */
export function clienteElegivelInatividadeAutomatica(
  referenciaYmd: string,
  hojeYmd: string,
): boolean {
  return addMesesCalendarioYmd(referenciaYmd, 6) <= hojeYmd;
}

/**
 * Data civil da linha de atendimento: `data` se preenchida; senão data civil de `inicio`.
 * Sem as duas → null (linha fora da referência).
 */
export function dataCivilLinhaAtendimento(opts: {
  data: string | null | undefined;
  inicio: string | null | undefined;
}): string | null {
  const data = opts.data == null ? '' : String(opts.data).trim();
  if (YMD_RE.test(data)) return data;
  const inicio = opts.inicio == null ? '' : String(opts.inicio).trim();
  if (!inicio) return null;
  const ymd = inicio.slice(0, 10);
  return YMD_RE.test(ymd) ? ymd : null;
}

/**
 * Referência do cliente: max das datas civis das linhas elegíveis,
 * ou `createdAtCivil` se não houver nenhuma.
 */
export function referenciaAtividadeCliente(opts: {
  datasLinhas: Array<string | null | undefined>;
  createdAtCivilYmd: string;
}): string {
  let max: string | null = null;
  for (const raw of opts.datasLinhas) {
    const d = raw == null ? '' : String(raw).trim();
    if (!YMD_RE.test(d)) continue;
    if (max == null || d > max) max = d;
  }
  return max ?? opts.createdAtCivilYmd;
}

export type RodarInatividadeClientesResult = {
  skipped: boolean;
  reason?: 'already_ran_today';
  diaCivil: string;
  updated: number;
};

/**
 * UPDATE em massa: só `status_modo = 'ativo'` com predicado verdadeiro.
 * Retorna quantas linhas foram reescritas.
 */
export async function aplicarInatividadeClientes(db: DbExec): Promise<number> {
  const rows = await db.execute(sql`
    UPDATE clientes AS c
    SET
      status_operacional = 'inativo',
      status_modo = 'inativo_automatico',
      updated_at = now()
    WHERE c.status_modo = 'ativo'
      AND (
        COALESCE(
          (
            SELECT MAX(COALESCE(a.data, (a.inicio)::date))
            FROM atendimentos a
            INNER JOIN atendimentos_pedido p
              ON p.id_atendimento = a.id_atendimento
            WHERE a.id_cliente = c.id_cliente
              AND p.modo = 'producao'
              AND lower(trim(coalesce(a.cobranca_status, ''))) = 'finalizada'
              AND COALESCE(a.data, (a.inicio)::date) IS NOT NULL
          ),
          (timezone(${SALAO_TIMEZONE}, c.created_at))::date
        ) + INTERVAL '6 months'
      )::date <= (timezone(${SALAO_TIMEZONE}, now()))::date
    RETURNING c.id_cliente
  `);

  return Array.from(rows as Iterable<unknown>).length;
}

/**
 * Executa o job no máximo uma vez por dia civil em America/Sao_Paulo
 * (guard em memória do processo). Idempotente: segunda chamada no mesmo dia
 * não reescreve; linhas já `inativo_automatico` ficam fora do WHERE.
 */
export async function rodarJobInatividadeClientes(
  db: DbExec,
  opts?: { force?: boolean; nowMs?: number },
): Promise<RodarInatividadeClientesResult> {
  const diaCivil = hojeCivilSaoPaulo(opts?.nowMs);
  if (!opts?.force && ultimoDiaCivilExecutado === diaCivil) {
    return {
      skipped: true,
      reason: 'already_ran_today',
      diaCivil,
      updated: 0,
    };
  }

  const updated = await aplicarInatividadeClientes(db);
  ultimoDiaCivilExecutado = diaCivil;
  return { skipped: false, diaCivil, updated };
}

/** Só para validação controlada — não usar em produção. */
export function __resetUltimoDiaCivilInatividadeParaTestes(): void {
  ultimoDiaCivilExecutado = null;
}

export function __peekUltimoDiaCivilInatividadeParaTestes(): string | null {
  return ultimoDiaCivilExecutado;
}

/**
 * Dispara na subida e checa a cada hora; o guard diário impede mais de um UPDATE
 * por dia civil em America/Sao_Paulo.
 */
export function iniciarJobInatividadeClientes(db: DbExec): void {
  const tick = (): void => {
    rodarJobInatividadeClientes(db)
      .then((r) => {
        if (r.skipped) return;
        if (r.updated > 0) {
          console.log(
            `Inatividade clientes: ${r.updated} marcado(s) inativo_automatico (dia ${r.diaCivil}).`,
          );
        } else {
          console.log(
            `Inatividade clientes: nenhum elegível (dia ${r.diaCivil}).`,
          );
        }
      })
      .catch((e) => {
        console.error('Job de inatividade de clientes falhou:', e);
      });
  };

  tick();
  setInterval(tick, INATIVIDADE_CLIENTES_INTERVALO_MS).unref();
}
