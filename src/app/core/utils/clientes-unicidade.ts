import type { Cliente, ClienteCadastroPayload } from '../models/api.models';
import { telefoneBrDigitos } from './telefone-br';

export type ClienteDuplicadoCampo = 'celular' | 'cpf';

export type ClienteDuplicadoErro = {
  campo: ClienteDuplicadoCampo;
  message: string;
};

function cpfDigitos(v: string | null | undefined): string {
  return String(v ?? '').replace(/\D/g, '');
}

/** Pré-checagem local: só CPF e celular (nunca nome; nunca `telefone` / fixo como celular). */
export function findClienteCadastroDuplicado(
  items: Cliente[],
  payload: ClienteCadastroPayload,
  excludeId?: string | null,
): ClienteDuplicadoErro | null {
  const excl = (excludeId ?? '').trim();

  const cel = telefoneBrDigitos(payload.celular);
  if (cel.length === 11) {
    const dup = items.some(
      (c) =>
        c.id.trim() !== excl && telefoneBrDigitos(c.celular) === cel,
    );
    if (dup) {
      return {
        campo: 'celular',
        message: 'Celular já cadastrado para outro cliente.',
      };
    }
  }

  const cpf = cpfDigitos(payload.cpf);
  if (cpf.length === 11) {
    const dup = items.some(
      (c) => c.id.trim() !== excl && cpfDigitos(c.cpf) === cpf,
    );
    if (dup) {
      return {
        campo: 'cpf',
        message: 'CPF já cadastrado para outro cliente.',
      };
    }
  }

  return null;
}
