/**
 * Cadastro de cliente — normalização, validação e mapeamento API (CC-04 / TD §5–§9).
 * Máscara fica fora; persiste só dígitos em celular / telefone_fixo / CPF.
 */

import type { InferSelectModel } from 'drizzle-orm';
import type { clientes } from '../db/schema';

export type ClienteRowDb = InferSelectModel<typeof clientes>;

export type ClienteCadastroBody = {
  nome?: string;
  /** Ignorado no cadastro (CC-04). */
  telefone?: string | null;
  /** JSON legado do drawer (Comandas); sobrescreve campos explícitos quando válido. */
  notas?: string | null;
  apelido?: string | null;
  email?: string | null;
  celular?: string | null;
  telefoneFixo?: string | null;
  aniversario?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  rg?: string | null;
  fotoUrl?: string | null;
  notificacoesAtivo?: boolean | null;
  descontoPadraoTexto?: string | null;
  descontoPadraoModo?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  enderecoNumero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  estado?: string | null;
  cidade?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  statusOperacional?: string | null;
  /** Ignorado; modo é derivado de statusOperacional. */
  statusModo?: string | null;
  idCliente?: string | null;
  id_cliente?: string | null;
};

export type ClienteCadastroValidationError = {
  field: string;
  message: string;
};

export type ClienteCadastroParsed = {
  nome: string;
  /** Colunas a gravar (POST: conjunto completo de cadastro; PATCH: só chaves presentes). */
  patch: Partial<ClienteRowDb>;
  /** Presente só quando o body trouxe statusOperacional (PATCH). */
  statusOperacional?: 'ativo' | 'inativo';
};

export function apenasDigitos(s: string | null | undefined): string {
  return String(s ?? '').replace(/\D/g, '');
}

/**
 * Só dígitos; remove prefixo 55 quando o tamanho bater
 * (13→11 celular; 12→10 fixo).
 */
export function normalizarTelefoneBrDigitos(
  raw: string | null | undefined,
): string {
  let d = apenasDigitos(raw);
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2);
  else if (d.length === 12 && d.startsWith('55')) d = d.slice(2);
  return d;
}

/** Celular válido: 11 dígitos e 3º dígito = 9. */
export function isCelularCadastroValido(
  digitos: string | null | undefined,
): boolean {
  const d = String(digitos ?? '');
  return d.length === 11 && d[2] === '9';
}

/** Telefone fixo opcional: 10 ou 11 dígitos quando informado. */
export function isTelefoneFixoCadastroValido(digitos: string): boolean {
  return digitos.length === 10 || digitos.length === 11;
}

export function isCpfCadastroValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digitos[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(digitos[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digitos[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(digitos[10]);
}

export function isCnpjCadastroValido(digitos: string): boolean {
  if (!/^\d{14}$/.test(digitos)) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;
  const calc = (base: string, factors: number[]) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i++) {
      sum += Number(base[i]) * factors[i]!;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(digitos, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(digitos[12])) return false;
  const d2 = calc(digitos, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(digitos[13]);
}

/** RG casa com a máscara atual (9 dígitos). */
export function isRgCadastroValido(digitos: string): boolean {
  return /^\d{9}$/.test(digitos);
}

function emailValido(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(t);
}

function dataDdMmYyyyValida(d8: string): boolean {
  if (!/^\d{8}$/.test(d8)) return false;
  const dd = parseInt(d8.slice(0, 2), 10);
  const mm = parseInt(d8.slice(2, 4), 10);
  const yyyy = parseInt(d8.slice(4, 8), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  if (yyyy < 1900 || yyyy > 2100) return false;
  const dt = new Date(yyyy, mm - 1, dd);
  return (
    dt.getFullYear() === yyyy &&
    dt.getMonth() === mm - 1 &&
    dt.getDate() === dd
  );
}

/** Persiste aniversário como DD/MM/AAAA quando válido. */
export function normalizarAniversarioCadastro(
  raw: string | null | undefined,
): string | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  const d = apenasDigitos(t);
  if (!dataDdMmYyyyValida(d)) return null;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function str(v: unknown): string {
  return v != null ? String(v).trim() : '';
}

function keyPresent(body: ClienteCadastroBody, k: keyof ClienteCadastroBody): boolean {
  return Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;
}

type Draft = {
  apelido: string | null | undefined;
  email: string | null | undefined;
  celular: string | null | undefined;
  telefoneFixo: string | null | undefined;
  aniversario: string | null | undefined;
  cnpj: string | null | undefined;
  cpf: string | null | undefined;
  rg: string | null | undefined;
  fotoUrl: string | null | undefined;
  descontoPadraoTexto: string | null | undefined;
  descontoPadraoModo: string | null | undefined;
  notificacoesAtivo: boolean | undefined;
  cep: string | null | undefined;
  logradouro: string | null | undefined;
  enderecoNumero: string | null | undefined;
  complemento: string | null | undefined;
  bairro: string | null | undefined;
  estado: string | null | undefined;
  cidade: string | null | undefined;
  instagram: string | null | undefined;
  facebook: string | null | undefined;
};

function parseNotasJson(notas: string | null | undefined): Partial<Draft> | null {
  if (notas == null || !String(notas).trim()) return null;
  const raw = String(notas).trim();
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== 'object' || o._elCli !== 1) return null;
    return {
      apelido: o.apelido != null ? str(o.apelido) : undefined,
      email: o.email != null ? str(o.email) : undefined,
      celular: o.celular != null ? str(o.celular) : undefined,
      telefoneFixo: o.telefoneFixo != null ? str(o.telefoneFixo) : undefined,
      aniversario: o.aniversario != null ? str(o.aniversario) : undefined,
      cnpj: o.cnpj != null ? str(o.cnpj) : undefined,
      cpf: o.cpf != null ? str(o.cpf) : undefined,
      rg: o.rg != null ? str(o.rg) : undefined,
      fotoUrl: o.fotoUrl != null ? str(o.fotoUrl) : undefined,
      descontoPadraoTexto:
        o.descontoPadraoTexto != null ? str(o.descontoPadraoTexto) : undefined,
      descontoPadraoModo:
        o.descontoPadraoModo != null ? str(o.descontoPadraoModo) : undefined,
      notificacoesAtivo:
        typeof o.notificacoesAtivo === 'boolean'
          ? o.notificacoesAtivo
          : undefined,
      cep: o.cep != null ? str(o.cep) : undefined,
      logradouro: o.logradouro != null ? str(o.logradouro) : undefined,
      enderecoNumero:
        o.enderecoNumero != null || o.numero != null
          ? str(o.enderecoNumero ?? o.numero)
          : undefined,
      complemento: o.complemento != null ? str(o.complemento) : undefined,
      bairro: o.bairro != null ? str(o.bairro) : undefined,
      estado: o.estado != null ? str(o.estado) : undefined,
      cidade: o.cidade != null ? str(o.cidade) : undefined,
      instagram: o.instagram != null ? str(o.instagram) : undefined,
      facebook: o.facebook != null ? str(o.facebook) : undefined,
    };
  } catch {
    return null;
  }
}

const CADASTRO_OPTIONAL_KEYS = [
  'apelido',
  'email',
  'celular',
  'telefoneFixo',
  'aniversario',
  'cnpj',
  'cpf',
  'rg',
  'fotoUrl',
  'cep',
  'logradouro',
  'enderecoNumero',
  'complemento',
  'bairro',
  'estado',
  'cidade',
  'instagram',
  'facebook',
] as const;

type OptionalKey = (typeof CADASTRO_OPTIONAL_KEYS)[number];

/**
 * Valida e normaliza body de POST/PATCH de cadastro.
 * Ordem: obrigatórios → formatos → CPF → celular (duplicidade fica fora).
 */
export function parseClienteCadastroBody(
  body: ClienteCadastroBody,
  mode: 'create' | 'update',
): ClienteCadastroParsed | ClienteCadastroValidationError {
  const fromJson = parseNotasJson(body.notas);

  const rawNome = String(body.nome ?? '').trim();
  if (!rawNome) {
    return { field: 'nome', message: 'Informe o nome.' };
  }

  const present = (k: OptionalKey): boolean => {
    if (keyPresent(body, k)) return true;
    if (fromJson && fromJson[k] !== undefined) return true;
    return false;
  };

  const rawOf = (k: OptionalKey): string | null => {
    if (keyPresent(body, k)) {
      const v = body[k];
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    }
    if (fromJson && fromJson[k] !== undefined) {
      const v = fromJson[k];
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    }
    return null;
  };

  // Celular: POST sempre; PATCH exige (salvamento de cadastro)
  const celularPresent =
    mode === 'create' || present('celular') || fromJson?.celular !== undefined;
  const celularRaw =
    keyPresent(body, 'celular')
      ? body.celular == null
        ? ''
        : String(body.celular).trim()
      : fromJson?.celular != null
        ? String(fromJson.celular).trim()
        : '';

  if (mode === 'create' || celularPresent) {
    if (!celularRaw) {
      return { field: 'celular', message: 'Informe o celular.' };
    }
  } else if (mode === 'update' && !present('celular')) {
    // PATCH de cadastro exige celular no body
    return { field: 'celular', message: 'Informe o celular.' };
  }

  const celularNorm = normalizarTelefoneBrDigitos(celularRaw);

  // Formatos opcionais (só se chave presente / create com valor)
  const checkOptionalFormats = (
    k: OptionalKey,
    validate: (raw: string) => ClienteCadastroValidationError | null,
  ): ClienteCadastroValidationError | null => {
    if (mode === 'update' && !present(k)) return null;
    const raw = rawOf(k);
    if (raw == null) return null;
    return validate(raw);
  };

  const errEmail = checkOptionalFormats('email', (raw) =>
    emailValido(raw)
      ? null
      : { field: 'email', message: 'Informe um e-mail válido.' },
  );
  if (errEmail) return errEmail;

  const errFixo = checkOptionalFormats('telefoneFixo', (raw) => {
    const d = normalizarTelefoneBrDigitos(raw);
    return isTelefoneFixoCadastroValido(d)
      ? null
      : { field: 'telefoneFixo', message: 'Informe um telefone fixo válido.' };
  });
  if (errFixo) return errFixo;

  const errAniv = checkOptionalFormats('aniversario', (raw) => {
    const n = normalizarAniversarioCadastro(raw);
    return n
      ? null
      : { field: 'aniversario', message: 'Informe uma data válida.' };
  });
  if (errAniv) return errAniv;

  const errCnpj = checkOptionalFormats('cnpj', (raw) => {
    const d = apenasDigitos(raw);
    return isCnpjCadastroValido(d)
      ? null
      : { field: 'cnpj', message: 'o valor não é válido' };
  });
  if (errCnpj) return errCnpj;

  const errRg = checkOptionalFormats('rg', (raw) => {
    const d = apenasDigitos(raw);
    return isRgCadastroValido(d)
      ? null
      : { field: 'rg', message: 'o valor não é válido' };
  });
  if (errRg) return errRg;

  // CPF se preenchido
  let cpfNorm: string | null | undefined;
  if (mode === 'create' || present('cpf')) {
    const raw = rawOf('cpf');
    if (raw == null) {
      cpfNorm = null;
    } else {
      const d = apenasDigitos(raw);
      if (!isCpfCadastroValido(d)) {
        return { field: 'cpf', message: 'Informe um CPF válido.' };
      }
      cpfNorm = d;
    }
  }

  // Celular válido
  if (!isCelularCadastroValido(celularNorm)) {
    return { field: 'celular', message: 'Informe um celular válido.' };
  }

  let statusOperacional: 'ativo' | 'inativo' | undefined;
  if (keyPresent(body, 'statusOperacional')) {
    const s = String(body.statusOperacional ?? '')
      .trim()
      .toLowerCase();
    if (s !== 'ativo' && s !== 'inativo') {
      return {
        field: 'statusOperacional',
        message: 'Informe um status válido.',
      };
    }
    statusOperacional = s;
  }

  const patch: Partial<ClienteRowDb> = {};

  const setOptional = (
    k: OptionalKey,
    column: keyof ClienteRowDb,
    transform: (raw: string) => string | null,
  ) => {
    if (mode === 'update' && !present(k)) return;
    const raw = rawOf(k);
    if (raw == null) {
      (patch as Record<string, unknown>)[column] = null;
      return;
    }
    (patch as Record<string, unknown>)[column] = transform(raw);
  };

  patch.nomeExibido = rawNome;
  patch.celular = celularNorm;

  setOptional('apelido', 'apelido', (r) => r);
  setOptional('email', 'email', (r) => r);
  setOptional('telefoneFixo', 'telefoneFixo', (r) =>
    normalizarTelefoneBrDigitos(r),
  );
  setOptional('aniversario', 'aniversario', (r) =>
    normalizarAniversarioCadastro(r),
  );
  if (cpfNorm !== undefined) {
    patch.cpf = cpfNorm;
  } else if (mode === 'create') {
    patch.cpf = null;
  }
  setOptional('cnpj', 'cnpj', (r) => apenasDigitos(r));
  setOptional('rg', 'rg', (r) => apenasDigitos(r));
  setOptional('fotoUrl', 'fotoUrl', (r) => r);
  setOptional('cep', 'cep', (r) => r);
  setOptional('logradouro', 'logradouro', (r) => r);
  setOptional('enderecoNumero', 'enderecoNumero', (r) => r);
  setOptional('complemento', 'complemento', (r) => r);
  setOptional('bairro', 'bairro', (r) => r);
  setOptional('estado', 'estado', (r) => r);
  setOptional('cidade', 'cidade', (r) => r);
  setOptional('instagram', 'instagram', (r) => r);
  setOptional('facebook', 'facebook', (r) => r);

  // Crédito / desconto / notificação: POST ignora; PATCH só se chave presente (outras abas)
  if (mode === 'update') {
    if (keyPresent(body, 'descontoPadraoTexto')) {
      const v = body.descontoPadraoTexto;
      patch.descontoPadraoTexto =
        v == null || String(v).trim() === '' ? null : String(v).trim();
    }
    if (keyPresent(body, 'descontoPadraoModo')) {
      const v = body.descontoPadraoModo;
      patch.descontoPadraoModo =
        v == null || String(v).trim() === '' ? null : String(v).trim();
    }
    if (keyPresent(body, 'notificacoesAtivo')) {
      if (typeof body.notificacoesAtivo === 'boolean') {
        patch.notificacoesAtivo = body.notificacoesAtivo;
      }
    }
  }

  if (mode === 'create') {
    // Garante nulls explícitos para opcionais omitidos
    for (const k of CADASTRO_OPTIONAL_KEYS) {
      if (k === 'celular') continue;
      const col = k as keyof ClienteRowDb;
      if (patch[col] === undefined) {
        (patch as Record<string, unknown>)[col] = null;
      }
    }
  }

  return {
    nome: rawNome,
    patch,
    ...(statusOperacional ? { statusOperacional } : {}),
  };
}

function creditoSaldoNum(v: unknown): number {
  const n = parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function isoOrNull(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Linha SQL → objeto plano na API (sem telefone, sem observações). */
export function mapClienteRowToApi(r: ClienteRowDb) {
  return {
    id: String(r.idCliente || ''),
    nome: String(r.nomeExibido || ''),
    apelido: r.apelido != null && r.apelido !== '' ? String(r.apelido) : null,
    email: r.email != null && r.email !== '' ? String(r.email) : null,
    celular: r.celular != null && r.celular !== '' ? String(r.celular) : null,
    telefoneFixo:
      r.telefoneFixo != null && r.telefoneFixo !== ''
        ? String(r.telefoneFixo)
        : null,
    aniversario:
      r.aniversario != null && r.aniversario !== ''
        ? String(r.aniversario)
        : null,
    cnpj: r.cnpj != null && r.cnpj !== '' ? String(r.cnpj) : null,
    cpf: r.cpf != null && r.cpf !== '' ? String(r.cpf) : null,
    rg: r.rg != null && r.rg !== '' ? String(r.rg) : null,
    fotoUrl: r.fotoUrl != null && r.fotoUrl !== '' ? String(r.fotoUrl) : null,
    notificacoesAtivo: r.notificacoesAtivo,
    descontoPadraoTexto:
      r.descontoPadraoTexto != null && r.descontoPadraoTexto !== ''
        ? String(r.descontoPadraoTexto)
        : null,
    descontoPadraoModo:
      r.descontoPadraoModo != null && r.descontoPadraoModo !== ''
        ? String(r.descontoPadraoModo)
        : null,
    cep: r.cep != null && r.cep !== '' ? String(r.cep) : null,
    logradouro:
      r.logradouro != null && r.logradouro !== ''
        ? String(r.logradouro)
        : null,
    enderecoNumero:
      r.enderecoNumero != null && r.enderecoNumero !== ''
        ? String(r.enderecoNumero)
        : null,
    complemento:
      r.complemento != null && r.complemento !== ''
        ? String(r.complemento)
        : null,
    bairro: r.bairro != null && r.bairro !== '' ? String(r.bairro) : null,
    estado: r.estado != null && r.estado !== '' ? String(r.estado) : null,
    cidade: r.cidade != null && r.cidade !== '' ? String(r.cidade) : null,
    instagram:
      r.instagram != null && r.instagram !== '' ? String(r.instagram) : null,
    facebook:
      r.facebook != null && r.facebook !== '' ? String(r.facebook) : null,
    creditoSaldo: creditoSaldoNum(r.creditoSaldo),
    statusOperacional: String(r.statusOperacional || 'ativo'),
    statusModo: String(r.statusModo || 'ativo'),
    createdAt: isoOrNull(r.createdAt),
    updatedAt: isoOrNull(r.updatedAt),
  };
}

/** @deprecated Preferir parseClienteCadastroBody — mantido só se algum caller legado importar. */
export function columnPatchFromClienteBody(
  body: ClienteCadastroBody,
  opts?: { partial?: boolean },
): Partial<ClienteRowDb> {
  const parsed = parseClienteCadastroBody(
    body,
    opts?.partial ? 'update' : 'create',
  );
  if ('field' in parsed) return {};
  return parsed.patch;
}
