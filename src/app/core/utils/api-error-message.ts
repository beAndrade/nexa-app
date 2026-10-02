import { HttpErrorResponse } from '@angular/common/http';
import type {
  ApiError,
  ApiResponse,
  ClienteDuplicadoRef,
} from '../models/api.models';

const API_HINT =
  ' Confirme: (1) terminal na pasta `api` com `npm start` — deve aparecer «API em http://0.0.0.0:3000»; ' +
  '(2) terminal na raiz com `npm start` (Angular em http://localhost:4200); ' +
  '(3) recarregue a página com Ctrl+Shift+R. ' +
  'Este erro é da API do ERP, não da Evolution/WhatsApp.';

export type ApiErrorDetails = {
  message: string;
  code?: string;
  field?: string;
  cliente?: ClienteDuplicadoRef | null;
};

function apiErrorFromBody(body: unknown): ApiError | null {
  if (!body || typeof body !== 'object') return null;
  const r = body as ApiResponse<unknown>;
  if (r.ok === false && r.error && typeof r.error === 'object') {
    return r.error;
  }
  return null;
}

function messageFromApiEnvelope(body: unknown): string | null {
  const err = apiErrorFromBody(body);
  if (err?.message?.trim()) return err.message.trim();
  return null;
}

function clienteRefFromUnknown(v: unknown): ClienteDuplicadoRef | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = String(o['id_cliente'] ?? o['id'] ?? '').trim();
  if (!id) return null;
  const nome = String(o['nome_exibido'] ?? o['nome'] ?? '').trim();
  return { id_cliente: id, ...(nome ? { nome_exibido: nome } : {}) };
}

/** Resposta de validação do Elysia (HTTP 422). */
function messageFromElysiaValidation(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const v = body as {
    type?: string;
    summary?: string;
    message?: string;
    errors?: { message?: string; path?: string }[];
  };
  if (v.type !== 'validation') return null;
  if (typeof v.summary === 'string' && v.summary.trim()) {
    return v.summary.trim();
  }
  const first = v.errors?.find((e) => e.message?.trim());
  if (first?.message?.trim()) {
    const path =
      typeof first.path === 'string' && first.path
        ? `${first.path}: `
        : '';
    return `${path}${first.message.trim()}`;
  }
  if (typeof v.message === 'string' && v.message.trim()) {
    return v.message.trim();
  }
  return null;
}

/** Extrai message + field + cliente (409 DUPLICATE) sem descartar o envelope. */
export function extractApiErrorDetails(
  err: unknown,
  fallback = 'Não foi possível concluir o pedido. Tente novamente.',
): ApiErrorDetails {
  if (err instanceof HttpErrorResponse) {
    const apiErr = apiErrorFromBody(err.error);
    if (apiErr?.message?.trim()) {
      return {
        message: apiErr.message.trim(),
        code: apiErr.code?.trim() || undefined,
        field: apiErr.field?.trim() || undefined,
        cliente: clienteRefFromUnknown(apiErr.cliente),
      };
    }

    const fromEnvelope = messageFromApiEnvelope(err.error);
    if (fromEnvelope) return { message: fromEnvelope };

    const fromValidation = messageFromElysiaValidation(err.error);
    if (fromValidation) return { message: fromValidation };

    if (typeof err.error === 'string' && err.error.trim()) {
      const t = err.error.trim();
      if (t.startsWith('<!')) {
        return { message: `O servidor devolveu HTML em vez de JSON.${API_HINT}` };
      }
      return { message: t };
    }

    if (err.status === 0) {
      return { message: `Não foi possível ligar à API.${API_HINT}` };
    }

    if (err.status === 204) {
      return {
        message:
          'O servidor respondeu sem dados (204). Reinicie a API na pasta api e tente de novo.',
      };
    }

    if (/failure during parsing|parse/i.test(err.message ?? '')) {
      return { message: `${err.message}${API_HINT}` };
    }

    if (err.message?.trim()) return { message: err.message.trim() };
    return { message: fallback };
  }

  if (err instanceof Error && err.message.trim()) {
    return { message: err.message.trim() };
  }

  return { message: fallback };
}

/** Mensagem legível para erros de HTTP / envelope da API. */
export function extractApiErrorMessage(
  err: unknown,
  fallback = 'Não foi possível concluir o pedido. Tente novamente.',
): string {
  return extractApiErrorDetails(err, fallback).message;
}
