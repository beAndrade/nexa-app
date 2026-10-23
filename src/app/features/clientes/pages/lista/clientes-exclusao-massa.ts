import type {
  ExcluirClientesEmMassaAllFilteredPayload,
  ExcluirClientesEmMassaResultado,
} from '../../../../core/models/api.models';
import type { ClientesSelectionFilterSnapshot } from './clientes-selection-state';

export type { ExcluirClientesEmMassaResultado };

export const MSG_EXCLUSAO_MASSA_SUCESSO = 'Clientes excluídos com sucesso.';

export const MSG_EXCLUSAO_MASSA_PARCIAL =
  'Exclusão parcialmente concluída. Alguns clientes foram excluídos, mas outros não puderam ser excluídos. Consulte os detalhes do resultado.';

export const MSG_EXCLUSAO_MASSA_NENHUM =
  'Nenhum cliente foi excluído. Alguns registros possuem vínculos que impedem a exclusão ou não foram encontrados. Consulte os detalhes do resultado.';

export function envelopeExclusaoMassa(
  data: unknown,
): data is ExcluirClientesEmMassaResultado {
  if (!data || typeof data !== 'object') return false;
  const bruto = data as Record<string, unknown>;
  if (
    !Array.isArray(bruto['deleted']) ||
    !Array.isArray(bruto['blocked']) ||
    !Array.isArray(bruto['notFound'])
  ) {
    return false;
  }
  if (!bruto['deleted'].every((id) => typeof id === 'string')) return false;
  if (!bruto['notFound'].every((id) => typeof id === 'string')) return false;
  return bruto['blocked'].every((item) => {
    if (!item || typeof item !== 'object') return false;
    const bloqueado = item as Record<string, unknown>;
    if (typeof bloqueado['id'] !== 'string') return false;
    return bloqueado['tipo'] == null || typeof bloqueado['tipo'] === 'string';
  });
}

/** Uma das três mensagens, ou null quando os três grupos estão vazios. */
export function mensagemExclusaoMassa(
  data: ExcluirClientesEmMassaResultado,
): string | null {
  const excluiu = data.deleted.length > 0;
  const outros = data.blocked.length > 0 || data.notFound.length > 0;
  if (excluiu && !outros) return MSG_EXCLUSAO_MASSA_SUCESSO;
  if (excluiu && outros) return MSG_EXCLUSAO_MASSA_PARCIAL;
  if (!excluiu && outros) return MSG_EXCLUSAO_MASSA_NENHUM;
  return null;
}

export type ResumoExclusaoMassa = {
  mensagem: string | null;
  excluidos: string[];
  bloqueados: { id: string; tipo: string | null }[];
  naoEncontrados: string[];
};

export function resumoExclusaoMassa(
  data: ExcluirClientesEmMassaResultado,
): ResumoExclusaoMassa {
  return {
    mensagem: mensagemExclusaoMassa(data),
    excluidos: [...data.deleted],
    bloqueados: data.blocked.map((item) => {
      const tipo = String(item.tipo ?? '').trim();
      return { id: item.id, tipo: tipo || null };
    }),
    naoEncontrados: [...data.notFound],
  };
}

export function payloadAllFiltered(
  snapshot: ClientesSelectionFilterSnapshot,
  excludedIds: Iterable<string>,
): ExcluirClientesEmMassaAllFilteredPayload {
  return {
    mode: 'allFiltered',
    search: snapshot.search,
    status: snapshot.status,
    hasCellphone: snapshot.hasCellphone,
    birthdayFrom: snapshot.birthdayFrom,
    birthdayTo: snapshot.birthdayTo,
    excludedIds: [...excludedIds],
  };
}
