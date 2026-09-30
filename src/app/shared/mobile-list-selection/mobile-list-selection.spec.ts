import {
  areAllSelected,
  buildSelectionBottomNavActions,
  selectAllIds,
  selectionCount,
  setId,
  setIds,
  toggleId,
} from './mobile-list-selection';

describe('mobile-list-selection', () => {
  it('alterna um id sem mutar o conjunto original', () => {
    const original = new Set(['a']);
    const on = toggleId(original, 'b');
    const off = toggleId(on, 'a');

    expect(original.has('b')).toBeFalse();
    expect([...on].sort()).toEqual(['a', 'b']);
    expect([...off]).toEqual(['b']);
  });

  it('liga e desliga um id pelo estado explícito', () => {
    const selected = setId(new Set<string>(), 'a', true);
    expect(setId(selected, 'a', true).size).toBe(1);
    expect(setId(selected, 'a', false).size).toBe(0);
  });

  it('selecionar tudo inclui os ids e preserva os que já estavam', () => {
    const next = selectAllIds(new Set(['fora', 'a']), ['a', 'b']);
    expect([...next].sort()).toEqual(['a', 'b', 'fora']);
    expect(selectAllIds(new Set(['fora']), []).has('fora')).toBeTrue();
  });

  it('marca e desmarca só o conjunto informado', () => {
    const marked = setIds(new Set(['keep']), ['a', 'b'], true);
    const cleared = setIds(marked, ['a'], false);
    expect([...marked].sort()).toEqual(['a', 'b', 'keep']);
    expect([...cleared].sort()).toEqual(['b', 'keep']);
  });

  it('conta o tamanho do conjunto', () => {
    expect(selectionCount(new Set(['a', 'b']))).toBe(2);
    expect(selectionCount(new Set())).toBe(0);
  });

  it('todos selecionados exige lista não vazia e ignora ids fora dela', () => {
    const selected = new Set(['a', 'b', 'escondido']);
    expect(areAllSelected(['a', 'b'], selected)).toBeTrue();
    expect(areAllSelected(['a', 'c'], selected)).toBeFalse();
    expect(areAllSelected([], selected)).toBeFalse();
    expect(selected.has('escondido')).toBeTrue();
  });

  it('monta os três slots da seleção com active só em selecionar tudo', () => {
    const actions = buildSelectionBottomNavActions(true, {
      onCancel: () => undefined,
      onSelectAll: () => undefined,
      onActions: () => undefined,
      selectAllAriaLabel: 'Selecionar todos os clientes',
    });

    expect(actions.map((action) => action.id)).toEqual([
      'cancelar-selecao',
      'selecionar-tudo',
      'acoes',
    ]);
    expect(actions.map((action) => action.label)).toEqual([
      'Cancelar',
      'Selecionar tudo',
      'Ações',
    ]);
    expect(actions[1].active).toBeTrue();
    expect(actions[1].ariaLabel).toBe('Selecionar todos os clientes');
    expect(actions[2].accent).toBeTrue();
  });
});
