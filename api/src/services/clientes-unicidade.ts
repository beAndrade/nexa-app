import { and, eq, ne } from 'drizzle-orm';
import type { Db } from '../db';
import { clientes } from '../db/schema';
import type { ApiErrorClienteRef } from '../shared/utils/envelope';
import {
  isCelularCadastroValido,
  normalizarTelefoneBrDigitos,
  apenasDigitos,
} from './clientes-cadastro-normalize';

export type ClienteDuplicidadeField = 'cpf' | 'celular';

export class ClienteCadastroError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  readonly field: string | null;
  readonly cliente: ApiErrorClienteRef | null;

  constructor(opts: {
    httpStatus: number;
    code: string;
    message: string;
    field?: string | null;
    cliente?: ApiErrorClienteRef | null;
  }) {
    super(opts.message);
    this.name = 'ClienteCadastroError';
    this.httpStatus = opts.httpStatus;
    this.code = opts.code;
    this.field = opts.field ?? null;
    this.cliente = opts.cliente ?? null;
  }
}

function toClienteRef(row: {
  idCliente: string;
  nomeExibido: string;
}): ApiErrorClienteRef {
  return {
    id_cliente: String(row.idCliente),
    nome_exibido: String(row.nomeExibido || ''),
  };
}

export async function findClienteByCelularNormalizado(
  db: Db,
  celular11: string,
  excludeId?: string,
): Promise<ApiErrorClienteRef | null> {
  if (!isCelularCadastroValido(celular11)) return null;
  const cond =
    excludeId != null && excludeId !== ''
      ? and(eq(clientes.celular, celular11), ne(clientes.idCliente, excludeId))
      : eq(clientes.celular, celular11);
  const [r] = await db
    .select({
      idCliente: clientes.idCliente,
      nomeExibido: clientes.nomeExibido,
    })
    .from(clientes)
    .where(cond)
    .limit(1);
  return r ? toClienteRef(r) : null;
}

export async function findClienteByCpfNormalizado(
  db: Db,
  cpf11: string,
  excludeId?: string,
): Promise<ApiErrorClienteRef | null> {
  if (cpf11.length !== 11) return null;
  const cond =
    excludeId != null && excludeId !== ''
      ? and(eq(clientes.cpf, cpf11), ne(clientes.idCliente, excludeId))
      : eq(clientes.cpf, cpf11);
  const [r] = await db
    .select({
      idCliente: clientes.idCliente,
      nomeExibido: clientes.nomeExibido,
    })
    .from(clientes)
    .where(cond)
    .limit(1);
  return r ? toClienteRef(r) : null;
}

/**
 * Recusa CPF/celular já usados por outro cliente (nome repetido é permitido).
 * Ordem: CPF, depois celular.
 */
export async function assertClienteCadastroUnico(
  db: Db,
  opts: {
    cpf?: string | null;
    celular?: string | null;
    excludeClienteId?: string;
  },
): Promise<void> {
  const excludeId = opts.excludeClienteId?.trim();
  const cpf = opts.cpf ? apenasDigitos(opts.cpf) : '';
  if (cpf.length === 11) {
    const outro = await findClienteByCpfNormalizado(db, cpf, excludeId);
    if (outro) {
      throw new ClienteCadastroError({
        httpStatus: 409,
        code: 'DUPLICATE',
        field: 'cpf',
        message: 'CPF já cadastrado para outro cliente.',
        cliente: outro,
      });
    }
  }

  const celular = opts.celular
    ? normalizarTelefoneBrDigitos(opts.celular)
    : '';
  if (isCelularCadastroValido(celular)) {
    const outro = await findClienteByCelularNormalizado(db, celular, excludeId);
    if (outro) {
      throw new ClienteCadastroError({
        httpStatus: 409,
        code: 'DUPLICATE',
        field: 'celular',
        message: 'Celular já cadastrado para outro cliente.',
        cliente: outro,
      });
    }
  }
}

function walkErrorChain(e: unknown, maxDepth = 8): unknown[] {
  const out: unknown[] = [];
  let cur: unknown = e;
  let d = 0;
  while (cur != null && d < maxDepth) {
    out.push(cur);
    if (typeof cur !== 'object') break;
    cur = (cur as { cause?: unknown }).cause;
    d += 1;
  }
  return out;
}

export function inspectPgUniqueViolation(e: unknown): {
  is23505: boolean;
  constraint: string;
  detail: string;
} {
  let is23505 = false;
  const constraints: string[] = [];
  const details: string[] = [];
  for (const node of walkErrorChain(e)) {
    if (typeof node !== 'object' || node === null) continue;
    const o = node as Record<string, unknown>;
    if (o.code === '23505') is23505 = true;
    if (typeof o.constraint === 'string') constraints.push(o.constraint);
    if (typeof o.detail === 'string') details.push(o.detail);
    if (typeof o.message === 'string') details.push(o.message);
  }
  return {
    is23505,
    constraint: constraints.join(' '),
    detail: details.join('\n'),
  };
}

/** 23505 de CPF/celular → mesmo 409; PK → null (retry de alocação). */
export async function duplicateErrorFromPg23505(
  db: Db,
  e: unknown,
  opts: {
    cpf?: string | null;
    celular?: string | null;
    excludeClienteId?: string;
  },
): Promise<ClienteCadastroError | null> {
  const info = inspectPgUniqueViolation(e);
  if (!info.is23505) return null;

  const blob = `${info.constraint}\n${info.detail}`;
  const isCelularIdx = /clientes_celular_11_uidx/i.test(blob);
  const isCpfIdx = /clientes_cpf_11_uidx/i.test(blob);
  const isPk =
    /clientes_pkey/i.test(blob) || /Key \(id_cliente\)/i.test(blob);

  if (isPk && !isCelularIdx && !isCpfIdx) return null;

  if (isCpfIdx || (!isCelularIdx && /\(cpf\)/i.test(blob))) {
    const cpf = apenasDigitos(opts.cpf ?? '');
    const outro =
      cpf.length === 11
        ? await findClienteByCpfNormalizado(db, cpf, opts.excludeClienteId)
        : null;
    return new ClienteCadastroError({
      httpStatus: 409,
      code: 'DUPLICATE',
      field: 'cpf',
      message: 'CPF já cadastrado para outro cliente.',
      cliente: outro,
    });
  }

  if (isCelularIdx || /\(celular\)/i.test(blob)) {
    const cel = normalizarTelefoneBrDigitos(opts.celular ?? '');
    const outro = isCelularCadastroValido(cel)
      ? await findClienteByCelularNormalizado(db, cel, opts.excludeClienteId)
      : null;
    return new ClienteCadastroError({
      httpStatus: 409,
      code: 'DUPLICATE',
      field: 'celular',
      message: 'Celular já cadastrado para outro cliente.',
      cliente: outro,
    });
  }

  return null;
}
