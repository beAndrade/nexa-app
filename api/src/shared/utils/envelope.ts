export type ApiErrorClienteRef = {
  id_cliente: string;
  nome_exibido: string;
};

export type ApiError = {
  code: string;
  message: string;
  /** Campo do formulário (validação ou duplicidade). */
  field?: string | null;
  /** Cliente conflitante em duplicidade de CPF/celular. */
  cliente?: ApiErrorClienteRef | null;
};

export type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: ApiError | null;
};

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null };
}

export function fail<T = null>(
  code: string,
  message: string,
  extras?: {
    field?: string | null;
    cliente?: ApiErrorClienteRef | null;
  },
): ApiResponse<T> {
  const error: ApiError = { code, message };
  if (extras?.field !== undefined) error.field = extras.field;
  if (extras?.cliente !== undefined) error.cliente = extras.cliente;
  return { ok: false, data: null, error };
}
