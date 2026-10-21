import { toggleId } from '../../../../shared/mobile-list-selection/mobile-list-selection';

/**
 * Snapshot dos predicados de busca/filtros — mesma semântica do GET paginado:
 * `null` / omitido = sem esse filtro.
 */
export interface ClientesSelectionFilterSnapshot {
  search: string | null;
  status: string | null;
  hasCellphone: boolean | null;
  birthdayFrom: string | null;
  birthdayTo: string | null;
}

/** Predicados opcionais como em `montarParamsListagem()` (chaves omitidas = sem filtro). */
export interface ClientesListFilterPredicates {
  search?: string;
  status?: string;
  hasCellphone?: boolean;
  birthdayFrom?: string;
  birthdayTo?: string;
}

/**
 * Estado de seleção da lista de clientes (CC-09-D):
 * - vazia: !allFiltered && selecionados vazio && excludedIds vazio
 * - ids: !allFiltered && selecionados com ids && excludedIds vazio
 * - allFiltered + snapshot + excludedIds: allFiltered === true, selecionados vazio
 */
export interface ClientesSelectionState {
  selecionados: ReadonlySet<string>;
  allFiltered: boolean;
  snapshot: ClientesSelectionFilterSnapshot | null;
  excludedIds: ReadonlySet<string>;
}

export function emptyClientesSelection(): ClientesSelectionState {
  return {
    selecionados: new Set(),
    allFiltered: false,
    snapshot: null,
    excludedIds: new Set(),
  };
}

/** Converte predicados do GET (omitidos) no snapshot com `null` explícito. */
export function snapshotFromListParams(
  params: ClientesListFilterPredicates,
): ClientesSelectionFilterSnapshot {
  const search = String(params.search ?? '').trim();
  return {
    search: search || null,
    status: params.status ?? null,
    hasCellphone: params.hasCellphone ?? null,
    birthdayFrom: params.birthdayFrom ?? null,
    birthdayTo: params.birthdayTo ?? null,
  };
}

function normalizedId(id: string): string {
  return String(id ?? '').trim();
}

export function isItemSelected(
  state: ClientesSelectionState,
  id: string,
): boolean {
  const key = normalizedId(id);
  if (!key) return false;
  if (state.allFiltered) return !state.excludedIds.has(key);
  return state.selecionados.has(key);
}

/** Modo global ligado, com ou sem exceção. Não é o pressed de “Selecionar tudo”. */
export function isAllFilteredMode(state: ClientesSelectionState): boolean {
  return state.allFiltered === true;
}

/**
 * “Selecionar tudo” pressionado só com o conjunto filtrado inteiro:
 * modo global, snapshot presente e nenhuma exceção.
 */
export function isSelectAllPressed(state: ClientesSelectionState): boolean {
  return (
    state.allFiltered === true &&
    state.snapshot != null &&
    state.excludedIds.size === 0
  );
}

export function hasActiveSelection(
  state: ClientesSelectionState,
  totalServidor: number,
): boolean {
  return effectiveSelectionCount(state, totalServidor) > 0;
}

/**
 * Contagem efetiva: em allFiltered, total do servidor menos as exceções,
 * nunca negativa. Em ids, o tamanho do conjunto.
 */
export function effectiveSelectionCount(
  state: ClientesSelectionState,
  totalServidor: number,
): number {
  if (state.allFiltered) {
    const total = Math.max(0, Number(totalServidor) || 0);
    return Math.max(0, total - state.excludedIds.size);
  }
  return state.selecionados.size;
}

/** Ativa seleção global sem materializar IDs e sem exceções. */
export function selectAllFiltered(
  snapshot: ClientesSelectionFilterSnapshot,
): ClientesSelectionState {
  return {
    selecionados: new Set(),
    allFiltered: true,
    snapshot: { ...snapshot },
    excludedIds: new Set(),
  };
}

export function clearClientesSelection(): ClientesSelectionState {
  return emptyClientesSelection();
}

/**
 * Alterna um item.
 * Sob allFiltered: inclui ou remove só esse id em excludedIds.
 * pageIds é ignorado. O modo e o snapshot permanecem. selecionados fica vazio.
 */
export function toggleClientesSelectionItem(
  state: ClientesSelectionState,
  id: string,
  _pageIds: readonly string[],
): ClientesSelectionState {
  const key = normalizedId(id);
  if (!key) return state;

  if (state.allFiltered) {
    const excludedIds = new Set(state.excludedIds);
    if (excludedIds.has(key)) excludedIds.delete(key);
    else excludedIds.add(key);
    return {
      selecionados: new Set(),
      allFiltered: true,
      snapshot: state.snapshot ? { ...state.snapshot } : null,
      excludedIds,
    };
  }

  return {
    selecionados: toggleId(state.selecionados, key),
    allFiltered: false,
    snapshot: null,
    excludedIds: new Set(),
  };
}

/**
 * Exclusão individual já existente.
 * Em ids, tira o id de selecionados. Em allFiltered, o modo permanece e o id
 * sai de excludedIds se estava lá. Não colapsa a seleção global.
 */
export function applyIndividualDeleteToSelection(
  state: ClientesSelectionState,
  id: string,
): ClientesSelectionState {
  const key = normalizedId(id);
  if (!key) return state;

  if (state.allFiltered) {
    if (!state.excludedIds.has(key)) return state;
    const excludedIds = new Set(state.excludedIds);
    excludedIds.delete(key);
    return {
      selecionados: new Set(),
      allFiltered: true,
      snapshot: state.snapshot ? { ...state.snapshot } : null,
      excludedIds,
    };
  }

  if (!state.selecionados.has(key)) return state;
  const selecionados = new Set(state.selecionados);
  selecionados.delete(key);
  return {
    selecionados,
    allFiltered: false,
    snapshot: null,
    excludedIds: new Set(),
  };
}
