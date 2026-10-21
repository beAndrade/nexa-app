import {
  applyIndividualDeleteToSelection,
  clearClientesSelection,
  effectiveSelectionCount,
  emptyClientesSelection,
  hasActiveSelection,
  isAllFilteredMode,
  isItemSelected,
  isSelectAllPressed,
  selectAllFiltered,
  snapshotFromListParams,
  toggleClientesSelectionItem,
  type ClientesSelectionState,
} from './clientes-selection-state';

describe('clientes-selection-state (CC-09-D)', () => {
  const snapshotVazio = snapshotFromListParams({});

  it('1. seleção individual liga e desliga um id', () => {
    let state = emptyClientesSelection();
    state = toggleClientesSelectionItem(state, 'a', ['a', 'b']);
    expect(isItemSelected(state, 'a')).toBeTrue();
    expect(isItemSelected(state, 'b')).toBeFalse();
    expect(isAllFilteredMode(state)).toBeFalse();

    state = toggleClientesSelectionItem(state, 'a', ['a', 'b']);
    expect(isItemSelected(state, 'a')).toBeFalse();
    expect(hasActiveSelection(state, 10)).toBeFalse();
    expect(state.excludedIds.size).toBe(0);
  });

  it('2. múltiplos IDs permanecem no conjunto', () => {
    let state = emptyClientesSelection();
    state = toggleClientesSelectionItem(state, 'a', ['a', 'b', 'c']);
    state = toggleClientesSelectionItem(state, 'c', ['a', 'b', 'c']);
    expect([...state.selecionados].sort()).toEqual(['a', 'c']);
    expect(effectiveSelectionCount(state, 99)).toBe(2);
  });

  it('3. persistência ao trocar de página (ids não dependem da página atual)', () => {
    let state = emptyClientesSelection();
    state = toggleClientesSelectionItem(state, 'p1-a', ['p1-a', 'p1-b']);
    // Página 2: itens diferentes; seleção de p1-a permanece
    expect(isItemSelected(state, 'p1-a')).toBeTrue();
    expect(isItemSelected(state, 'p2-x')).toBeFalse();
    state = toggleClientesSelectionItem(state, 'p2-x', ['p2-x', 'p2-y']);
    expect([...state.selecionados].sort()).toEqual(['p1-a', 'p2-x']);
  });

  it('4. seleção global não materializa todos os IDs', () => {
    const state = selectAllFiltered(snapshotVazio);
    expect(state.allFiltered).toBeTrue();
    expect(state.selecionados.size).toBe(0);
    expect(state.excludedIds.size).toBe(0);
    expect(isItemSelected(state, 'qualquer-id-nao-carregado')).toBeTrue();
    expect(isAllFilteredMode(state)).toBeTrue();
  });

  it('5. snapshot consistente com predicados do GET (omissão → null)', () => {
    expect(snapshotFromListParams({})).toEqual({
      search: null,
      status: null,
      hasCellphone: null,
      birthdayFrom: null,
      birthdayTo: null,
    });

    expect(
      snapshotFromListParams({
        search: '  ana  ',
        status: 'ativos',
        hasCellphone: true,
        birthdayFrom: '2000-01-01',
        birthdayTo: '2000-12-31',
      }),
    ).toEqual({
      search: 'ana',
      status: 'ativos',
      hasCellphone: true,
      birthdayFrom: '2000-01-01',
      birthdayTo: '2000-12-31',
    });

    const withSnap = selectAllFiltered(
      snapshotFromListParams({ status: 'inativos', hasCellphone: false }),
    );
    expect(withSnap.snapshot).toEqual({
      search: null,
      status: 'inativos',
      hasCellphone: false,
      birthdayFrom: null,
      birthdayTo: null,
    });
  });

  it('6. allFiltered com total positivo é seleção ativa; total zero não apaga o modo', () => {
    const state = selectAllFiltered(snapshotVazio);
    expect(isAllFilteredMode(state)).toBeTrue();
    expect(hasActiveSelection(state, 10)).toBeTrue();
    expect(hasActiveSelection(state, 0)).toBeFalse();
    expect(hasActiveSelection(emptyClientesSelection(), 10)).toBeFalse();
  });

  it('7. contagem/Ações com allFiltered usam totalServidor', () => {
    const state = selectAllFiltered(snapshotVazio);
    expect(effectiveSelectionCount(state, 150)).toBe(150);
    expect(effectiveSelectionCount(state, 0)).toBe(0);

    const idsOnly: ClientesSelectionState = {
      selecionados: new Set(['a', 'b']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    expect(effectiveSelectionCount(idsOnly, 150)).toBe(2);
  });

  it('8. desmarcar sob allFiltered guarda só a exceção e preserva modo e snapshot', () => {
    const global = selectAllFiltered(snapshotVazio);
    const originalExcluded = global.excludedIds;

    const afterUncheckB = toggleClientesSelectionItem(global, 'b', [
      'a',
      'b',
      'c',
    ]);
    expect(afterUncheckB.allFiltered).toBeTrue();
    expect(afterUncheckB.snapshot).toEqual(snapshotVazio);
    expect(afterUncheckB.selecionados.size).toBe(0);
    expect([...afterUncheckB.excludedIds]).toEqual(['b']);
    expect(isItemSelected(afterUncheckB, 'b')).toBeFalse();
    expect(isItemSelected(afterUncheckB, 'a')).toBeTrue();
    expect(isItemSelected(afterUncheckB, 'outra-pagina')).toBeTrue();
    expect(originalExcluded.size).toBe(0);
    expect(global.excludedIds).toBe(originalExcluded);

    const afterUncheckOnly = toggleClientesSelectionItem(global, 'only', [
      'only',
    ]);
    expect(afterUncheckOnly.allFiltered).toBeTrue();
    expect(afterUncheckOnly.snapshot).toEqual(snapshotVazio);
    expect(afterUncheckOnly.selecionados.size).toBe(0);
    expect([...afterUncheckOnly.excludedIds]).toEqual(['only']);
    expect(isItemSelected(afterUncheckOnly, 'pagina-1')).toBeTrue();
    expect(hasActiveSelection(afterUncheckOnly, 21)).toBeTrue();
    expect(effectiveSelectionCount(afterUncheckOnly, 21)).toBe(20);
  });

  it('9. invalidação quando busca muda (clear)', () => {
    const selected = selectAllFiltered(
      snapshotFromListParams({ search: 'antes' }),
    );
    const cleared = clearClientesSelection();
    expect(cleared).toEqual(emptyClientesSelection());
    expect(hasActiveSelection(cleared, 10)).toBeFalse();
    expect(cleared.excludedIds.size).toBe(0);
    expect(isItemSelected(cleared, 'x')).toBeFalse();
    // estado anterior tinha seleção; clear representa invalidação por busca
    expect(hasActiveSelection(selected, 4)).toBeTrue();
  });

  it('10. invalidação quando filtros mudam (clear)', () => {
    let state = toggleClientesSelectionItem(
      emptyClientesSelection(),
      'a',
      ['a'],
    );
    expect(hasActiveSelection(state, 3)).toBeTrue();
    state = clearClientesSelection();
    expect(state.allFiltered).toBeFalse();
    expect(state.snapshot).toBeNull();
    expect(state.selecionados.size).toBe(0);
    expect(state.excludedIds.size).toBe(0);
  });

  it('11. regressões: seleção individual e paginação não ativam allFiltered', () => {
    let state = emptyClientesSelection();
    state = toggleClientesSelectionItem(state, 'a', ['a', 'b']);
    state = toggleClientesSelectionItem(state, 'b', ['a', 'b']);
    expect(isAllFilteredMode(state)).toBeFalse();
    expect(effectiveSelectionCount(state, 500)).toBe(2);

    // Troca de página (novos pageIds) não limpa ids já marcados
    expect(isItemSelected(state, 'a')).toBeTrue();
    state = toggleClientesSelectionItem(state, 'c', ['c', 'd']);
    expect([...state.selecionados].sort()).toEqual(['a', 'b', 'c']);
    expect(isAllFilteredMode(state)).toBeFalse();
    expect(state.excludedIds.size).toBe(0);
  });

  it('12. remarcar remove só a exceção e a segunda inclusão não duplica', () => {
    const global = selectAllFiltered(snapshotVazio);
    const semB = toggleClientesSelectionItem(global, 'b', ['only']);
    const semBeC = toggleClientesSelectionItem(semB, 'c', ['ignored']);
    expect([...semBeC.excludedIds].sort()).toEqual(['b', 'c']);

    const soC = toggleClientesSelectionItem(semBeC, 'b', ['page-2-only']);
    expect(soC.allFiltered).toBeTrue();
    expect([...soC.excludedIds]).toEqual(['c']);
    expect(isItemSelected(soC, 'b')).toBeTrue();
    expect(isItemSelected(soC, 'c')).toBeFalse();
    expect(isItemSelected(soC, 'outra-pagina')).toBeTrue();

    const deNovo = toggleClientesSelectionItem(semB, 'b', []);
    expect(deNovo.excludedIds.size).toBe(0);
    expect(semB.excludedIds.size).toBe(1);
  });

  it('13. id em branco é ignorado e Selecionar tudo zera exceções', () => {
    const global = selectAllFiltered(snapshotVazio);
    const intacto = toggleClientesSelectionItem(global, '   ', ['a']);
    expect(intacto).toBe(global);

    const comExcecao = toggleClientesSelectionItem(global, 'b', ['b']);
    const deNovoTudo = selectAllFiltered(comExcecao.snapshot!);
    expect(deNovoTudo.excludedIds.size).toBe(0);
    expect(deNovoTudo.selecionados.size).toBe(0);
    expect(deNovoTudo.allFiltered).toBeTrue();
    expect(isItemSelected(deNovoTudo, 'b')).toBeTrue();
  });

  it('14. contagem subtrai exceções, não fica negativa e não apaga o modo', () => {
    let state = selectAllFiltered(snapshotVazio);
    state = toggleClientesSelectionItem(state, 'a', ['a']);
    state = toggleClientesSelectionItem(state, 'b', ['b']);
    expect(effectiveSelectionCount(state, 5)).toBe(3);
    expect(effectiveSelectionCount(state, 1)).toBe(0);
    expect(effectiveSelectionCount(state, Number.NaN)).toBe(0);
    expect(hasActiveSelection(state, 1)).toBeFalse();
    expect(isAllFilteredMode(state)).toBeTrue();
    expect(state.snapshot).toEqual(snapshotVazio);
    expect(isSelectAllPressed(state)).toBeFalse();
    expect(isSelectAllPressed(selectAllFiltered(snapshotVazio))).toBeTrue();
    expect(isSelectAllPressed(emptyClientesSelection())).toBeFalse();
  });

  it('15. exclusão individual poda a exceção sem colapsar allFiltered', () => {
    let state = selectAllFiltered(snapshotVazio);
    state = toggleClientesSelectionItem(state, 'sai', ['sai']);
    state = toggleClientesSelectionItem(state, 'fica', []);
    const depois = applyIndividualDeleteToSelection(state, 'sai');
    expect(depois.allFiltered).toBeTrue();
    expect(depois.snapshot).toEqual(snapshotVazio);
    expect([...depois.excludedIds]).toEqual(['fica']);
    expect(state.excludedIds.size).toBe(2);

    const intacto = applyIndividualDeleteToSelection(depois, 'nao-excluido');
    expect(intacto).toBe(depois);

    const ids = applyIndividualDeleteToSelection(
      toggleClientesSelectionItem(emptyClientesSelection(), 'a', ['a', 'b']),
      'a',
    );
    const comB = toggleClientesSelectionItem(
      toggleClientesSelectionItem(emptyClientesSelection(), 'a', ['a']),
      'b',
      ['b'],
    );
    const semA = applyIndividualDeleteToSelection(comB, 'a');
    expect([...semA.selecionados]).toEqual(['b']);
    expect(semA.allFiltered).toBeFalse();
    expect(semA.excludedIds.size).toBe(0);
    expect(ids.selecionados.size).toBe(0);
  });
});
