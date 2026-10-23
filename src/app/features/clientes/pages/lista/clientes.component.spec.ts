import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import { AppToastService } from '../../../../shared/app-toast/app-toast.service';
import { Cliente } from '../../../../core/models/api.models';
import { ClienteCadastroDrawerService } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service';
import { ClientesComponent } from './clientes.component';
import { selectAllFiltered, snapshotFromListParams } from './clientes-selection-state';

/**
 * Wiring da busca/filtros com a bottom nav (CC-09-D).
 * O spec da máquina de estado não monta o componente; aqui o shell real
 * recebe as ações depois da invalidação.
 */
describe('ClientesComponent busca e bottom nav (CC-09-D)', () => {
  let fixture: ComponentFixture<ClientesComponent>;
  let shell: AppShellUiService;
  let toast: jasmine.SpyObj<AppToastService>;
  let api: {
    listClientesPaginado: jasmine.Spy;
    deleteCliente: jasmine.Spy;
    excluirClientesEmMassa: jasmine.Spy;
  };
  let desktopMatches = false;
  let mqListener: ((event: MediaQueryListEvent) => void) | null = null;

  function cliente(id: string): Cliente {
    return { id } as Cliente;
  }

  function clique(): Event {
    return { preventDefault() {}, stopPropagation() {} } as Event;
  }

  function selecionarTudoActive(): boolean | undefined {
    return shell
      .mobileBottomNavActions()
      .find((action) => action.id === 'selecionar-tudo')?.active;
  }

  function acao(id: string) {
    return shell.mobileBottomNavActions().find((action) => action.id === id);
  }

  function entrarComTudoSelecionado(): ClientesComponent {
    const component = fixture.componentInstance;
    component.totalServidor = 11;
    component.entrarModoSelecao();
    component.selecionarTodosMobile();
    expect(component.selectionState.allFiltered).toBeTrue();
    expect(selecionarTudoActive()).toBeTrue();
    return component;
  }

  beforeEach(async () => {
    desktopMatches = false;
    mqListener = null;
    spyOn(window, 'matchMedia').and.callFake(
      () =>
        ({
          get matches() {
            return desktopMatches;
          },
          media: '(min-width: 768px)',
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: (
            _type: string,
            fn: (event: MediaQueryListEvent) => void,
          ) => {
            mqListener = fn;
          },
          removeEventListener: () => {
            mqListener = null;
          },
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );

    toast = jasmine.createSpyObj<AppToastService>('AppToastService', [
      'showWarning',
      'show',
    ]);
    api = {
      listClientesPaginado: jasmine.createSpy('listClientesPaginado').and.returnValue(
        of({
          items: [],
          total: 0,
          totalPages: 0,
          page: 1,
          pageSize: 20,
        }),
      ),
      deleteCliente: jasmine.createSpy('deleteCliente').and.returnValue(of(undefined)),
      excluirClientesEmMassa: jasmine
        .createSpy('excluirClientesEmMassa')
        .and.returnValue(of({ deleted: [], blocked: [], notFound: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [
        {
          provide: SheetsApiService,
          useValue: api,
        },
        { provide: ClienteCadastroDrawerService, useValue: {} },
        { provide: AppToastService, useValue: toast },
      ],
    })
      .overrideComponent(ClientesComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    shell = TestBed.inject(AppShellUiService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('debounce da busca limpa a seleção e tira o active de Selecionar tudo', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    tick(250);

    const setActions = spyOn(shell, 'setMobileBottomNavActions').and.callThrough();
    component.busca = 'ana';
    component.onBuscaInput();
    expect(selecionarTudoActive()).toBeTrue();

    tick(300);

    expect(component.selectionState.allFiltered).toBeFalse();
    expect(component.selectionState.selecionados.size).toBe(0);
    expect(component.modoSelecao).toBeTrue();
    expect(selecionarTudoActive()).toBeFalse();
    expect(setActions).toHaveBeenCalledTimes(1);
  }));

  it('onBuscar limpa a seleção e sincroniza Selecionar tudo uma vez', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    const setActions = spyOn(shell, 'setMobileBottomNavActions').and.callThrough();

    component.busca = 'bia';
    component.onBuscar();

    expect(component.selectionState.allFiltered).toBeFalse();
    expect(selecionarTudoActive()).toBeFalse();
    expect(setActions).toHaveBeenCalledTimes(1);

    tick(250);
    expect(selecionarTudoActive()).toBeFalse();
  }));

  it('filtro continua sincronizando a bottom nav depois de limpar a seleção', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    const setActions = spyOn(shell, 'setMobileBottomNavActions').and.callThrough();

    component.toggleFiltroStatus('ativos', {
      target: { checked: true },
    } as unknown as Event);

    expect(component.filtroStatusAtivos).toBeTrue();
    expect(component.selectionState.allFiltered).toBeFalse();
    expect(selecionarTudoActive()).toBeFalse();
    expect(setActions).toHaveBeenCalledTimes(1);

    tick(250);
    expect(selecionarTudoActive()).toBeFalse();
  }));

  it('Ações sem seleção mostra a mensagem exata e não abre o menu', () => {
    const component = fixture.componentInstance;
    component.entrarModoSelecao();
    component.acoesMenuAberto = true;

    component.onAcoesSelecao();

    expect(toast.showWarning).toHaveBeenCalledOnceWith(
      'Selecione pelo menos um cliente para acessar as ações.',
    );
    expect(component.acoesMenuAberto).toBeFalse();
    expect(acao('acoes')?.active).toBeFalse();
  });

  it('Ações com seleção allFiltered abre o menu sem aviso', fakeAsync(() => {
    const component = entrarComTudoSelecionado();

    component.onAcoesSelecao();

    expect(toast.showWarning).not.toHaveBeenCalled();
    expect(component.acoesMenuAberto).toBeTrue();
    expect(acao('acoes')?.active).toBeTrue();
    expect(acao('acoes')?.activeAria).toBeUndefined();
    tick(250);
    expect(component.acoesMenuAberto).toBeTrue();
  }));

  it('Ações com um id explícito abre o menu sem aviso', () => {
    const component = fixture.componentInstance;
    component.entrarModoSelecao();
    component.selectionState = {
      selecionados: new Set(['cliente-1']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onAcoesSelecao();

    expect(toast.showWarning).not.toHaveBeenCalled();
    expect(component.acoesMenuAberto).toBeTrue();
    expect(acao('acoes')?.active).toBeTrue();
  });

  it('remover badge fecha o menu e tira o active de Ações', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    component.onAcoesSelecao();
    expect(component.acoesMenuAberto).toBeTrue();
    component.filtroStatusAtivos = true;

    component.removerFiltroBadge('status-ativos');

    expect(component.selectionState.allFiltered).toBeFalse();
    expect(component.acoesMenuAberto).toBeFalse();
    expect(acao('acoes')?.active).toBeFalse();
    tick(250);
    expect(component.acoesMenuAberto).toBeFalse();
  }));

  it('busca fecha o menu de ações junto com a seleção', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    component.onAcoesSelecao();
    component.busca = 'ana';

    component.onBuscar();

    expect(component.acoesMenuAberto).toBeFalse();
    expect(acao('acoes')?.active).toBeFalse();
    tick(250);
    expect(component.acoesMenuAberto).toBeFalse();
  }));

  it('filtro fecha o menu de ações junto com a seleção', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    component.onAcoesSelecao();

    component.toggleFiltroStatus('ativos', {
      target: { checked: true },
    } as unknown as Event);

    expect(component.acoesMenuAberto).toBeFalse();
    expect(acao('acoes')?.active).toBeFalse();
    tick(250);
    expect(component.acoesMenuAberto).toBeFalse();
  }));

  it('Selecionar tudo usa pressed e mantém o active visual', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.entrarModoSelecao();

    expect(acao('selecionar-tudo')?.active).toBeFalse();
    expect(acao('selecionar-tudo')?.activeAria).toBe('pressed');

    component.selecionarTodosMobile();

    expect(acao('selecionar-tudo')?.active).toBeTrue();
    expect(acao('selecionar-tudo')?.activeAria).toBe('pressed');
    expect(acao('acoes')?.activeAria).toBeUndefined();
    tick(250);
    expect(acao('selecionar-tudo')?.active).toBeTrue();
    expect(acao('selecionar-tudo')?.activeAria).toBe('pressed');
  }));

  it('Filtro continua com active de painel, sem pressed', () => {
    const component = fixture.componentInstance;

    component.toggleFiltros();

    expect(acao('filtro')?.active).toBeTrue();
    expect(acao('filtro')?.activeAria).toBeUndefined();
  });

  it('desmarcar uma exceção solta Selecionar tudo e mantém os demais', fakeAsync(() => {
    const component = entrarComTudoSelecionado();

    component.onMobileItemClick(cliente('pagina-2'), clique());

    expect(component.selectionState.allFiltered).toBeTrue();
    expect(component.selectionState.selecionados.size).toBe(0);
    expect([...component.selectionState.excludedIds]).toEqual(['pagina-2']);
    expect(component.estaSelecionado('pagina-2')).toBeFalse();
    expect(component.estaSelecionado('pagina-1')).toBeTrue();
    expect(acao('selecionar-tudo')?.active).toBeFalse();
    expect(acao('selecionar-tudo')?.activeAria).toBe('pressed');
    tick(250);
  }));

  it('Selecionar tudo depois da exceção zera excludedIds e volta a pressionar', fakeAsync(() => {
    const component = entrarComTudoSelecionado();
    component.onMobileItemClick(cliente('pagina-2'), clique());

    component.selecionarTodosMobile();

    expect(component.selectionState.excludedIds.size).toBe(0);
    expect(component.selectionState.selecionados.size).toBe(0);
    expect(component.estaSelecionado('pagina-2')).toBeTrue();
    expect(acao('selecionar-tudo')?.active).toBeTrue();
    expect(acao('selecionar-tudo')?.activeAria).toBe('pressed');
    tick(250);
  }));

  it('busca, filtro e Cancelar limpam excludedIds', fakeAsync(() => {
    const porBusca = entrarComTudoSelecionado();
    porBusca.onMobileItemClick(cliente('ex'), clique());
    porBusca.busca = 'ana';
    porBusca.onBuscar();
    expect(porBusca.selectionState.excludedIds.size).toBe(0);
    expect(porBusca.selectionState.allFiltered).toBeFalse();

    const porFiltro = entrarComTudoSelecionado();
    porFiltro.onMobileItemClick(cliente('ex'), clique());
    porFiltro.toggleFiltroStatus('ativos', {
      target: { checked: true },
    } as unknown as Event);
    expect(porFiltro.selectionState.excludedIds.size).toBe(0);

    const porCancelar = entrarComTudoSelecionado();
    porCancelar.onMobileItemClick(cliente('ex'), clique());
    porCancelar.sairModoSelecao();
    expect(porCancelar.selectionState.excludedIds.size).toBe(0);
    expect(porCancelar.modoSelecao).toBeFalse();
    tick(250);
  }));

  it('page size e troca de página preservam a exceção no estado do componente', () => {
    const component = entrarComTudoSelecionado();
    component.onMobileItemClick(cliente('ex'), clique());
    const antes = component.selectionState;
    component.pagina = 2;
    component.totalPaginasServidor = 2;

    component.selecionarItensPorPagina(50, clique());

    expect(component.selectionState).toBe(antes);
    expect([...component.selectionState.excludedIds]).toEqual(['ex']);
    expect(component.selectionState.allFiltered).toBeTrue();
    expect(component.pagina).toBe(1);

    component.totalPaginasServidor = 2;
    component.paginaSeguinte();
    expect(component.selectionState).toBe(antes);
    expect(component.estaSelecionado('outro')).toBeTrue();
    expect(component.estaSelecionado('ex')).toBeFalse();
  });

  it('Ações com contagem efetiva zero não abre o menu', () => {
    const component = entrarComTudoSelecionado();
    component.totalServidor = 1;
    component.onMobileItemClick(cliente('unico'), clique());
    component.acoesMenuAberto = true;

    component.onAcoesSelecao();

    expect(toast.showWarning).toHaveBeenCalledOnceWith(
      'Selecione pelo menos um cliente para acessar as ações.',
    );
    expect(component.acoesMenuAberto).toBeFalse();
    expect(component.selectionState.allFiltered).toBeTrue();
  });

  it('Ações com exceção parcial abre o menu e habilita Excluir', () => {
    const component = entrarComTudoSelecionado();
    component.onMobileItemClick(cliente('ex'), clique());

    component.onAcoesSelecao();

    expect(toast.showWarning).not.toHaveBeenCalled();
    expect(component.acoesMenuAberto).toBeTrue();
    expect(component.acoesMenuItens()[0]?.disabled).toBeFalse();
    expect(component.selectionState.allFiltered).toBeTrue();
    expect(component.selectionState.excludedIds.size).toBe(1);
  });

  it('exclusão individual remove a exceção e não desliga allFiltered', () => {
    const component = entrarComTudoSelecionado();
    const base = selectAllFiltered(snapshotFromListParams({}));
    component.selectionState = {
      ...base,
      excludedIds: new Set(['CL-EX', 'CL-FICA']),
    };
    component.clientePendenteExclusao = cliente('CL-EX');

    component.confirmarExcluirCliente();

    expect(component.selectionState.allFiltered).toBeTrue();
    expect([...component.selectionState.excludedIds]).toEqual(['CL-FICA']);
  });

  it('cruzar 768 px limpa snapshot e excludedIds', () => {
    const component = entrarComTudoSelecionado();
    component.onMobileItemClick(cliente('ex'), clique());

    desktopMatches = true;
    mqListener?.({} as MediaQueryListEvent);

    expect(component.modoSelecao).toBeFalse();
    expect(component.selectionState.allFiltered).toBeFalse();
    expect(component.selectionState.snapshot).toBeNull();
    expect(component.selectionState.excludedIds.size).toBe(0);
  });

  function itemExcluir() {
    return {
      id: 'excluir',
      label: 'Excluir',
      icon: 'trash' as const,
      danger: true,
    };
  }

  function prepararExclusaoMassa(): ClientesComponent {
    const component = fixture.componentInstance;
    component.shellBottomNavEligible = false;
    component.entrarModoSelecao();
    api.excluirClientesEmMassa.calls.reset();
    return component;
  }

  it('confirmação da exclusão em massa acontece antes do POST e cancelar mantém a seleção', () => {
    const component = prepararExclusaoMassa();
    component.totalServidor = 4;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao(itemExcluir());

    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.exclusaoEmMassaPendente).toBeTrue();
    expect(component.excluirModalAberto).toBeTrue();
    expect([...component.selectionState.selecionados]).toEqual(['A', 'B']);

    component.fecharModalExcluirCliente();

    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.exclusaoEmMassaPendente).toBeFalse();
    expect([...component.selectionState.selecionados]).toEqual(['A', 'B']);
  });

  it('um id explícito continua na exclusão individual', () => {
    const component = prepararExclusaoMassa();
    component.itens = [cliente('sozinho')];
    component.totalServidor = 1;
    component.selectionState = {
      selecionados: new Set(['sozinho']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao(itemExcluir());

    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(api.deleteCliente).not.toHaveBeenCalled();
    expect(component.exclusaoEmMassaPendente).toBeFalse();
    expect(component.clientePendenteExclusao?.id).toBe('sozinho');
    expect(component.selectionState.allFiltered).toBeFalse();
  });

  it('um id explícito fora da página abre a confirmação individual sem DELETE nem POST', () => {
    const component = prepararExclusaoMassa();
    component.itens = [cliente('na-pagina')];
    component.totalServidor = 2;
    component.selectionState = {
      selecionados: new Set(['fora']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao(itemExcluir());

    expect(api.deleteCliente).not.toHaveBeenCalled();
    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.exclusaoEmMassaPendente).toBeFalse();
    expect(component.excluirModalAberto).toBeTrue();
    expect(component.clientePendenteExclusao).toEqual({ id: 'fora' });
    expect(component.selectionState.allFiltered).toBeFalse();
    expect([...component.selectionState.selecionados]).toEqual(['fora']);
  });

  it('cancelar a confirmação do id fora da página não chama DELETE nem POST e mantém a seleção', () => {
    const component = prepararExclusaoMassa();
    component.itens = [];
    component.totalServidor = 1;
    component.selectionState = {
      selecionados: new Set(['fora']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao(itemExcluir());
    component.fecharModalExcluirCliente();

    expect(api.deleteCliente).not.toHaveBeenCalled();
    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.clientePendenteExclusao).toBeNull();
    expect(component.exclusaoEmMassaPendente).toBeFalse();
    expect(component.selectionState.allFiltered).toBeFalse();
    expect([...component.selectionState.selecionados]).toEqual(['fora']);
  });

  it('confirmar o id fora da página chama deleteCliente uma vez e não chama o POST', () => {
    const component = prepararExclusaoMassa();
    component.itens = [cliente('outro')];
    component.totalServidor = 2;
    component.selectionState = {
      selecionados: new Set(['fora']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(api.deleteCliente).toHaveBeenCalledOnceWith('fora');
    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.selectionState.allFiltered).toBeFalse();
    expect(component.selectionState.selecionados.size).toBe(0);
  });

  it('modo ids envia só os ids explícitos', () => {
    const component = prepararExclusaoMassa();
    component.busca = 'nao-enviar';
    component.filtroStatusAtivos = true;
    component.totalServidor = 5;
    component.selectionState = {
      selecionados: new Set(['B', 'A']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    api.excluirClientesEmMassa.and.returnValue(
      of({ deleted: ['B', 'A'], blocked: [], notFound: [] }),
    );

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(api.excluirClientesEmMassa).toHaveBeenCalledOnceWith({
      mode: 'ids',
      ids: ['B', 'A'],
    });
    const payload = api.excluirClientesEmMassa.calls.mostRecent().args[0];
    expect(payload.search).toBeUndefined();
    expect(payload.excludedIds).toBeUndefined();
  });

  it('modo allFiltered envia o snapshot e excludedIds, sem materializar os ids', () => {
    const component = prepararExclusaoMassa();
    const snapshot = snapshotFromListParams({
      search: 'ana',
      status: 'ativos',
      hasCellphone: true,
      birthdayFrom: '2024-01-01',
      birthdayTo: '2024-01-31',
    });
    component.selectionState = {
      ...selectAllFiltered(snapshot),
      excludedIds: new Set(['EX-1']),
    };
    component.totalServidor = 8;
    component.busca = 'filtro-vivo';
    component.filtroStatusInativos = true;
    component.itens = [cliente('pagina'), cliente('EX-1')];
    api.excluirClientesEmMassa.and.returnValue(
      of({ deleted: ['outro'], blocked: [], notFound: [] }),
    );

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(api.excluirClientesEmMassa).toHaveBeenCalledOnceWith({
      mode: 'allFiltered',
      search: 'ana',
      status: 'ativos',
      hasCellphone: true,
      birthdayFrom: '2024-01-01',
      birthdayTo: '2024-01-31',
      excludedIds: ['EX-1'],
    });
    const payload = api.excluirClientesEmMassa.calls.mostRecent().args[0];
    expect(payload.ids).toBeUndefined();
    expect(payload.search).not.toBe('filtro-vivo');
  });

  it('contagem efetiva zero não dispara POST', () => {
    const component = prepararExclusaoMassa();
    component.totalServidor = 1;
    component.selectionState = {
      ...selectAllFiltered(snapshotFromListParams({})),
      excludedIds: new Set(['unico']),
    };

    expect(component.acoesMenuItens()[0]?.disabled).toBeTrue();
    component.onItemAcaoSelecao(itemExcluir());

    expect(api.excluirClientesEmMassa).not.toHaveBeenCalled();
    expect(component.exclusaoEmMassaPendente).toBeFalse();
  });

  it('sucesso total, parcial e nenhum excluído usam as três mensagens', () => {
    const sucesso = 'Clientes excluídos com sucesso.';
    const parcial =
      'Exclusão parcialmente concluída. Alguns clientes foram excluídos, mas outros não puderam ser excluídos. Consulte os detalhes do resultado.';
    const nenhum =
      'Nenhum cliente foi excluído. Alguns registros possuem vínculos que impedem a exclusão ou não foram encontrados. Consulte os detalhes do resultado.';

    const component = prepararExclusaoMassa();
    component.totalServidor = 3;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    api.excluirClientesEmMassa.and.returnValue(
      of({ deleted: ['A', 'B'], blocked: [], notFound: [] }),
    );
    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();
    expect(toast.show).toHaveBeenCalledOnceWith(sucesso);
    expect(component.resultadoExclusaoMassa?.mensagem).toBe(sucesso);
    expect(component.resultadoExclusaoMassa?.excluidos).toEqual(['A', 'B']);
    expect(component.resultadoExclusaoMassa?.bloqueados).toEqual([]);
    expect(component.resultadoExclusaoMassa?.naoEncontrados).toEqual([]);

    toast.show.calls.reset();
    toast.showWarning.calls.reset();
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    component.totalServidor = 3;
    api.excluirClientesEmMassa.and.returnValue(
      of({
        deleted: ['A'],
        blocked: [{ id: 'B', tipo: 'comandas' }],
        notFound: ['C'],
      }),
    );
    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();
    expect(toast.show).not.toHaveBeenCalled();
    expect(toast.showWarning).toHaveBeenCalledWith(parcial);
    expect(component.resultadoExclusaoMassa?.mensagem).not.toBe(sucesso);
    expect(component.resultadoExclusaoMassa?.bloqueados).toEqual([
      { id: 'B', tipo: 'comandas' },
    ]);
    expect(component.resultadoExclusaoMassa?.naoEncontrados).toEqual(['C']);
    expect(component.textoBloqueadosExclusaoMassa(
      component.resultadoExclusaoMassa?.bloqueados ?? [],
    )).toBe('B (comandas)');

    toast.show.calls.reset();
    toast.showWarning.calls.reset();
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    component.totalServidor = 2;
    api.excluirClientesEmMassa.and.returnValue(
      of({
        deleted: [],
        blocked: [{ id: 'A' }],
        notFound: ['B'],
      }),
    );
    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();
    expect(toast.show).not.toHaveBeenCalled();
    expect(toast.showWarning).toHaveBeenCalledWith(nenhum);
    expect(component.resultadoExclusaoMassa?.mensagem).toBe(nenhum);
    expect(component.resultadoExclusaoMassa?.excluidos).toEqual([]);
    expect(
      component.textoBloqueadosExclusaoMassa(
        component.resultadoExclusaoMassa?.bloqueados ?? [],
      ),
    ).toBe('A');
    expect(component.resultadoExclusaoMassa?.naoEncontrados).toEqual(['B']);
  });

  it('falha sem envelope mantém a seleção e não reenvia o POST', () => {
    const component = prepararExclusaoMassa();
    component.totalServidor = 2;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    const antes = component.selectionState;
    api.excluirClientesEmMassa.and.returnValue(
      throwError(() => new Error('falha de rede')),
    );

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(api.excluirClientesEmMassa).toHaveBeenCalledTimes(1);
    expect(component.selectionState).toBe(antes);
    expect(component.resultadoExclusaoMassa).toBeNull();
    expect(toast.show).not.toHaveBeenCalled();
    expect(component.erroExclusaoMassa).toBe('falha de rede');
    expect(toast.showWarning).toHaveBeenCalledWith('falha de rede');
  });

  it('não envia a exclusão em massa duas vezes enquanto a primeira não termina', () => {
    const component = prepararExclusaoMassa();
    component.totalServidor = 2;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    const pendente = new Subject<{
      deleted: string[];
      blocked: [];
      notFound: [];
    }>();
    api.excluirClientesEmMassa.and.returnValue(pendente.asObservable());

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();
    component.confirmarExcluirCliente();

    expect(api.excluirClientesEmMassa).toHaveBeenCalledTimes(1);
    pendente.next({ deleted: ['A', 'B'], blocked: [], notFound: [] });
    pendente.complete();
  });

  it('resposta operacional limpa a seleção e preserva busca, filtros e page size', () => {
    const component = prepararExclusaoMassa();
    component.busca = 'maria';
    component.onBuscar();
    component.filtroStatusAtivos = true;
    component.filtroComCelular = true;
    component.filtroAniversarioInicioYmd = '2024-02-01';
    component.itensPorPagina = 50;
    component.pagina = 2;
    component.totalServidor = 80;
    component.selectionState = {
      ...selectAllFiltered(
        snapshotFromListParams({ search: 'ana', status: 'ativos' }),
      ),
      excludedIds: new Set(['EX']),
    };
    api.listClientesPaginado.calls.reset();
    api.listClientesPaginado.and.returnValue(
      of({
        items: [],
        total: 80,
        totalPages: 2,
        page: 2,
        pageSize: 50,
      }),
    );
    api.excluirClientesEmMassa.and.returnValue(
      of({ deleted: ['Z'], blocked: [], notFound: [] }),
    );

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(component.selectionState.allFiltered).toBeFalse();
    expect(component.selectionState.snapshot).toBeNull();
    expect(component.selectionState.selecionados.size).toBe(0);
    expect(component.selectionState.excludedIds.size).toBe(0);
    expect(component.busca).toBe('maria');
    expect(component.filtroStatusAtivos).toBeTrue();
    expect(component.filtroComCelular).toBeTrue();
    expect(component.filtroAniversarioInicioYmd).toBe('2024-02-01');
    expect(component.itensPorPagina).toBe(50);
    expect(component.pagina).toBe(2);
    const params = api.listClientesPaginado.calls.mostRecent().args[0];
    expect(params).toEqual(
      jasmine.objectContaining({
        search: 'maria',
        status: 'ativos',
        hasCellphone: true,
        birthdayFrom: '2024-02-01',
        pageSize: 50,
      }),
    );
  });

  it('se a página atual não existir, recarrega a última página válida', () => {
    const component = prepararExclusaoMassa();
    component.itensPorPagina = 20;
    component.pagina = 4;
    component.totalServidor = 40;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };
    api.listClientesPaginado.and.returnValues(
      of({ items: [], total: 25, totalPages: 2, page: 4, pageSize: 20 }),
      of({
        items: [cliente('Z')],
        total: 25,
        totalPages: 2,
        page: 2,
        pageSize: 20,
      }),
    );
    api.excluirClientesEmMassa.and.returnValue(
      of({ deleted: ['A'], blocked: [], notFound: [] }),
    );

    component.onItemAcaoSelecao(itemExcluir());
    component.confirmarExcluirCliente();

    expect(component.pagina).toBe(2);
    expect(component.itensPorPagina).toBe(20);
    expect(component.itens.map((item) => item.id)).toEqual(['Z']);
    const paginas = api.listClientesPaginado.calls
      .allArgs()
      .map((args) => args[0].page);
    expect(paginas).toContain(4);
    expect(paginas).toContain(2);
  });
});

describe('ClientesComponent texto da confirmação em massa', () => {
  let fixture: ComponentFixture<ClientesComponent>;

  beforeEach(async () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      media: '(min-width: 768px)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);

    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [
        {
          provide: SheetsApiService,
          useValue: {
            listClientesPaginado: () =>
              of({
                items: [],
                total: 0,
                totalPages: 0,
                page: 1,
                pageSize: 20,
              }),
            deleteCliente: () => of(undefined),
            excluirClientesEmMassa: () =>
              of({ deleted: [], blocked: [], notFound: [] }),
          },
        },
        { provide: ClienteCadastroDrawerService, useValue: { isAberto: false } },
        {
          provide: AppToastService,
          useValue: jasmine.createSpyObj<AppToastService>('AppToastService', [
            'showWarning',
            'show',
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('mostra o texto exato da confirmação em massa, sem quantidade', () => {
    const component = fixture.componentInstance;
    component.shellBottomNavEligible = false;
    component.totalServidor = 3;
    component.selectionState = {
      selecionados: new Set(['A', 'B']),
      allFiltered: false,
      snapshot: null,
      excludedIds: new Set(),
    };

    component.onItemAcaoSelecao({
      id: 'excluir',
      label: 'Excluir',
      icon: 'trash',
      danger: true,
    });
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Deseja excluir os clientes selecionados?');
    expect(texto).toContain(
      'Os clientes com registros vinculados não poderão ser excluídos. Essa ação não pode ser desfeita.',
    );
    expect(texto).toContain('Deseja continuar?');
    expect(texto).not.toContain('cliente selecionado');
  });
});
