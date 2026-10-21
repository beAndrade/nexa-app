import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
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
    ]);

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
          },
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

  it('Ações com exceção parcial abre o menu e Excluir em massa segue indisponível', () => {
    const component = entrarComTudoSelecionado();
    component.onMobileItemClick(cliente('ex'), clique());

    component.onAcoesSelecao();

    expect(toast.showWarning).not.toHaveBeenCalled();
    expect(component.acoesMenuAberto).toBeTrue();
    expect(component.acoesMenuItens()[0]?.disabled).toBeTrue();
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
});
