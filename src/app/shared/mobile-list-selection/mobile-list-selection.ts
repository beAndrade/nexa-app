import type { MobileBottomNavAction } from '../../core/services/app-shell-ui.service';

/** Adiciona o id se estiver fora; remove se já estiver. Não muta o conjunto recebido. */
export function toggleId<T>(selected: ReadonlySet<T>, id: T): Set<T> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Liga ou desliga um id. Não muta o conjunto recebido. */
export function setId<T>(selected: ReadonlySet<T>, id: T, on: boolean): Set<T> {
  const next = new Set(selected);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

/**
 * União: inclui todos os ids sem remover os que já estavam.
 * Lista vazia devolve uma cópia do conjunto atual.
 */
export function selectAllIds<T>(
  selected: ReadonlySet<T>,
  ids: readonly T[],
): Set<T> {
  const next = new Set(selected);
  for (const id of ids) next.add(id);
  return next;
}

/** Marca ou desmarca um conjunto de ids, sem tocar nos demais. */
export function setIds<T>(
  selected: ReadonlySet<T>,
  ids: readonly T[],
  on: boolean,
): Set<T> {
  const next = new Set(selected);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}

/** Falso quando não há ids. Não considera ids que estejam no conjunto e fora da lista. */
export function areAllSelected<T>(
  ids: readonly T[],
  selected: ReadonlySet<T>,
): boolean {
  return ids.length > 0 && ids.every((id) => selected.has(id));
}

export function selectionCount<T>(selected: ReadonlySet<T>): number {
  return selected.size;
}

export interface SelectionBottomNavHandlers {
  onCancel: () => void;
  onSelectAll: () => void;
  onActions: () => void;
  /** Rótulo acessível do slot. A feature passa o texto do domínio. */
  selectAllAriaLabel?: string;
}

/** Cancelar | Selecionar tudo | Ações. O rótulo de Selecionar tudo não muda quando `allSelected`. */
export function buildSelectionBottomNavActions(
  allSelected: boolean,
  handlers: SelectionBottomNavHandlers,
): MobileBottomNavAction[] {
  return [
    {
      id: 'cancelar-selecao',
      label: 'Cancelar',
      ariaLabel: 'Cancelar seleção',
      icon: 'x',
      onClick: handlers.onCancel,
    },
    {
      id: 'selecionar-tudo',
      label: 'Selecionar tudo',
      ariaLabel: handlers.selectAllAriaLabel ?? 'Selecionar todos os itens',
      icon: 'check',
      active: allSelected,
      onClick: handlers.onSelectAll,
    },
    {
      id: 'acoes',
      label: 'Ações',
      ariaLabel: 'Ações da seleção',
      icon: 'more',
      accent: true,
      onClick: handlers.onActions,
    },
  ];
}
