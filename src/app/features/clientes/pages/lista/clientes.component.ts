import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { Cliente } from '../../../../core/models/api.models';
import { ClienteCadastroDrawerService } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service';
import { ClienteAvatarComponent } from '../../../../shared/cliente-avatar/cliente-avatar.component';
import { AppToastService } from '../../../../shared/app-toast/app-toast.service';
import { ClienteDrawerPeriodoFiltroComponent } from '../../../../shared/cliente-drawer-periodo-filtro/cliente-drawer-periodo-filtro.component';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import {
  MobileListActionMenuItem,
  MobileListActionsMenuComponent,
} from '../../../../shared/components/mobile-list-actions-menu/mobile-list-actions-menu.component';
import { buildSelectionBottomNavActions } from '../../../../shared/mobile-list-selection/mobile-list-selection';
import { ymdValido } from '../../../../shared/cliente-drawer-periodo-filtro/cliente-periodo-filtro.util';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import { FlipDropdownPanelDirective } from '../../../../shared/flip-dropdown-panel/flip-dropdown-panel.directive';
import { mediaQueryMin } from '../../../../styles/breakpoints';
import {
  applyIndividualDeleteToSelection,
  clearClientesSelection,
  emptyClientesSelection,
  hasActiveSelection,
  isItemSelected,
  isSelectAllPressed,
  selectAllFiltered,
  snapshotFromListParams,
  toggleClientesSelectionItem,
  type ClientesListFilterPredicates,
  type ClientesSelectionState,
} from './clientes-selection-state';

const CLIENTES_BOTTOM_NAV_OWNER = 'clientes';
const CLIENTES_SEARCH_DEBOUNCE_MS = 300;
const CLIENTES_PAGE_SIZES = [20, 50, 100] as const;
/** Ausência de e-mail ou aniversário na lista (L-C01). */
const CLIENTES_AUSENCIA = '\u2014';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    FlipDropdownPanelDirective,
    TableEmptyComponent,
    FormsModule,
    ClienteAvatarComponent,
    ClienteDrawerPeriodoFiltroComponent,
    MobileFiltrosSheetComponent,
    MobileListActionsMenuComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit, OnDestroy {
  private readonly api = inject(SheetsApiService);
  private readonly cadastroDrawer = inject(ClienteCadastroDrawerService);
  private readonly shellUi = inject(AppShellUiService);
  private readonly toast = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  /** Viewport do shell ≤767px — Bottom Nav visível (template + registry). */
  shellBottomNavEligible = false;
  private selecionarTudoBusy = false;
  private selecionarTudoFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
  chipsScrollVisivel = false;
  private chipsScrollTimer: ReturnType<typeof setTimeout> | null = null;

  carregando = false;
  erro = '';
  itens: Cliente[] = [];

  busca = '';
  /** Termo efetivamente enviado à API (após debounce). */
  private buscaAplicada = '';
  private readonly searchInput$ = new Subject<string>();
  /**
   * Sequência + sub ativa do GET paginado: ignora respostas stale
   * (padrão Angular do projeto — ex.: nova-comanda-drawer).
   */
  private listaLoadSeq = 0;
  private listaLoadSub: { unsubscribe(): void } | null = null;
  buscaAberta = false;
  filtrosAbertos = false;
  /** Mobile: exibe checkboxes na lista e permite seleção em lote. */
  modoSelecao = false;
  acoesMenuAberto = false;
  pulsoToolbarFiltro = false;
  pulsoToolbarBusca = false;
  private readonly duracaoPulsoToolbarMs = 600;
  private tPulsoFiltro = 0;
  private tPulsoBusca = 0;

  /** Todos: nenhum extremo de status marcado (omite `status` na API). */
  filtroStatusAtivos = false;
  filtroStatusInativos = false;
  filtroComCelular = false;
  filtroSemCelular = false;
  filtroAniversarioInicioYmd = '';
  filtroAniversarioFimYmd = '';

  pagina = 1;
  itensPorPagina: (typeof CLIENTES_PAGE_SIZES)[number] = 20;
  readonly opcoesItensPorPagina = [...CLIENTES_PAGE_SIZES];
  /** Totais do conjunto filtrado no servidor (CC-09-A/B). */
  totalServidor = 0;
  totalPaginasServidor = 0;
  perPageMenuAberto = false;

  /** Seleção mobile: vazia | ids | allFiltered+snapshot+excludedIds (CC-09-D). */
  selectionState: ClientesSelectionState = emptyClientesSelection();
  excluindoId: string | null = null;
  excluirModalAberto = false;
  /** Mantém o modal no DOM até a saída mobile terminar. */
  excluirModalMontado = false;
  /** Saída mobile: encolhe em direção ao popover. */
  excluirModalSaindo = false;
  /** Deslocamento do centro do popover até o centro da tela. */
  excluirModalOrigem = { x: 0, y: 0 };
  clientePendenteExclusao: Cliente | null = null;
  excluindoClienteModal = false;
  private readonly excluirModalSaidaMs = 200;
  private excluirModalTimer: ReturnType<typeof setTimeout> | null = null;
  private excluirModalRaf = 0;

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.carregar();
    this.setupShellBottomNav();
  }

  ngOnDestroy(): void {
    this.listaLoadSub?.unsubscribe();
    this.listaLoadSub = null;
    this.shellUi.clearMobileBottomNavActions(CLIENTES_BOTTOM_NAV_OWNER);
  }

  private setupSearchDebounce(): void {
    this.searchInput$
      .pipe(
        debounceTime(CLIENTES_SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((q) => {
        this.buscaAplicada = String(q ?? '').trim();
        this.resetPageAndSelection();
        this.carregarLista();
      });
  }

  /**
   * Page reset + limpa seleção ao mudar search/filtros (seleção UI = CC-09-D).
   * Fecha o menu de ações para o popover não permanecer com seleção vazia.
   * A bottom nav sincroniza aqui para a busca seguir o mesmo efeito dos filtros.
   */
  private resetPageAndSelection(): void {
    this.pagina = 1;
    this.selectionState = clearClientesSelection();
    this.acoesMenuAberto = false;
    this.syncShellBottomNavActions();
  }

  private normalizePageSize(raw: number): (typeof CLIENTES_PAGE_SIZES)[number] {
    const n = Math.trunc(Number(raw));
    if ((CLIENTES_PAGE_SIZES as readonly number[]).includes(n)) {
      return n as (typeof CLIENTES_PAGE_SIZES)[number];
    }
    return 20;
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    const apply = (): void => {
      this.shellBottomNavEligible = !shellDesktopMq.matches;
      if (!this.shellBottomNavEligible && this.modoSelecao) {
        this.modoSelecao = false;
        this.selectionState = clearClientesSelection();
      }
      if (!this.shellBottomNavEligible) {
        this.acoesMenuAberto = false;
      }
      if (!this.shellBottomNavEligible && this.filtrosAbertos) {
        this.filtrosAbertos = false;
      }
      this.syncShellBottomNavActions();
    };
    apply();
    shellDesktopMq.addEventListener('change', apply);
    this.destroyRef.onDestroy(() => {
      shellDesktopMq.removeEventListener('change', apply);
      this.limparFeedbackSelecionarTudo();
      this.limparChipsScroll();
      this.limparAnimacaoExcluirCliente();
    });
  }

  /**
   * Menu | Filtro | Selecionar | Novo — só em ≤767.
   * Em modo seleção: Cancelar | Selecionar tudo | Ações.
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(CLIENTES_BOTTOM_NAV_OWNER);
      return;
    }
    if (this.modoSelecao) {
      const actions = buildSelectionBottomNavActions(
        this.todosFiltradosSelecionados(),
        {
          onCancel: () => this.sairModoSelecao(),
          onSelectAll: () => this.selecionarTodosMobile(),
          onActions: () => this.onAcoesSelecao(),
          selectAllAriaLabel: 'Selecionar todos os clientes',
        },
      );
      const acoes = actions.find((action) => action.id === 'acoes');
      if (acoes) acoes.active = this.acoesMenuAberto;
      const selecionarTudo = actions.find((action) => action.id === 'selecionar-tudo');
      if (selecionarTudo) {
        selecionarTudo.busy = this.selecionarTudoBusy;
        selecionarTudo.activeAria = 'pressed';
      }
      this.shellUi.setMobileBottomNavActions(CLIENTES_BOTTOM_NAV_OWNER, actions);
      return;
    }
    this.shellUi.setMobileBottomNavActions(CLIENTES_BOTTOM_NAV_OWNER, [
      {
        id: 'filtro',
        label: 'Filtro',
        ariaLabel: 'Abrir filtros',
        icon: 'filter',
        active: this.filtrosAbertos,
        warn: this.temFiltroAtivo(),
        onClick: () => this.toggleFiltros(),
      },
      {
        id: 'selecionar',
        label: 'Selecionar',
        ariaLabel: 'Selecionar clientes',
        icon: 'check',
        active: false,
        onClick: () => this.entrarModoSelecao(),
      },
      {
        id: 'novo',
        label: 'Novo',
        ariaLabel: 'Novo cliente',
        icon: 'plus',
        accent: true,
        onClick: () => this.onNovoCliente(),
      },
    ]);
  }

  /** Filtros além do padrão (Todos, sem os outros critérios). */
  temFiltroAtivo(): boolean {
    return this.filtrosAtivosBadges().length > 0;
  }

  filtrosAtivosBadges(): { id: string; label: string }[] {
    const badges: { id: string; label: string }[] = [];
    if (this.filtroStatusAtivos && this.filtroStatusInativos) {
      badges.push({ id: 'status-ambos', label: 'Ativos e Inativos' });
    } else if (this.filtroStatusAtivos) {
      badges.push({ id: 'status-ativos', label: 'Ativos' });
    } else if (this.filtroStatusInativos) {
      badges.push({ id: 'status-inativos', label: 'Inativos' });
    }
    if (this.filtroComCelular) {
      badges.push({ id: 'cel-com', label: 'Com celular' });
    }
    if (this.filtroSemCelular) {
      badges.push({ id: 'cel-sem', label: 'Sem celular' });
    }
    const ini = this.filtroAniversarioInicioYmd.trim();
    const fim = this.filtroAniversarioFimYmd.trim();
    if (ini || fim) {
      badges.push({ id: 'aniversario', label: 'Aniversário' });
    }
    return badges;
  }

  removerFiltroBadge(id: string, ev?: Event): void {
    ev?.stopPropagation();
    switch (id) {
      case 'status-ambos':
      case 'status-ativos':
      case 'status-inativos':
        this.filtroStatusAtivos = false;
        this.filtroStatusInativos = false;
        break;
      case 'cel-com':
        this.filtroComCelular = false;
        break;
      case 'cel-sem':
        this.filtroSemCelular = false;
        break;
      case 'aniversario':
        this.filtroAniversarioInicioYmd = '';
        this.filtroAniversarioFimYmd = '';
        break;
      default:
        break;
    }
    this.resetPageAndSelection();
    this.carregarLista();
  }

  entrarModoSelecao(): void {
    if (this.filtrosAbertos) this.fecharFiltros();
    this.modoSelecao = true;
    this.syncShellBottomNavActions();
  }

  sairModoSelecao(): void {
    this.modoSelecao = false;
    this.acoesMenuAberto = false;
    this.limparFeedbackSelecionarTudo();
    this.selectionState = clearClientesSelection();
    this.syncShellBottomNavActions();
  }

  /** @deprecated use entrar/sair — mantido para compat. */
  toggleModoSelecao(): void {
    if (this.modoSelecao) this.sairModoSelecao();
    else this.entrarModoSelecao();
  }

  /** Pressionado só com o conjunto filtrado inteiro, sem exceções. */
  todosFiltradosSelecionados(): boolean {
    return isSelectAllPressed(this.selectionState);
  }

  /** Ativa allFiltered + snapshot; não faz fetch de todos os itens. */
  selecionarTodosMobile(): void {
    this.selectionState = selectAllFiltered(
      snapshotFromListParams(this.predicadosListagem()),
    );
    this.dispararFeedbackSelecionarTudo();
    this.syncShellBottomNavActions();
  }

  /** Ícone gira ~250ms. A seleção já foi aplicada antes deste timer. */
  private dispararFeedbackSelecionarTudo(): void {
    this.limparFeedbackSelecionarTudo();
    this.selecionarTudoBusy = true;
    this.selecionarTudoFeedbackTimer = setTimeout(() => {
      this.selecionarTudoFeedbackTimer = null;
      this.selecionarTudoBusy = false;
      if (this.modoSelecao) this.syncShellBottomNavActions();
    }, 250);
  }

  private limparFeedbackSelecionarTudo(): void {
    if (this.selecionarTudoFeedbackTimer != null) {
      clearTimeout(this.selecionarTudoFeedbackTimer);
      this.selecionarTudoFeedbackTimer = null;
    }
    this.selecionarTudoBusy = false;
  }

  onChipsScroll(): void {
    this.chipsScrollVisivel = true;
    if (this.chipsScrollTimer != null) clearTimeout(this.chipsScrollTimer);
    this.chipsScrollTimer = setTimeout(() => {
      this.chipsScrollTimer = null;
      this.chipsScrollVisivel = false;
    }, 1000);
  }

  private limparChipsScroll(): void {
    if (this.chipsScrollTimer != null) {
      clearTimeout(this.chipsScrollTimer);
      this.chipsScrollTimer = null;
    }
    this.chipsScrollVisivel = false;
  }

  onAcoesSelecao(): void {
    if (!hasActiveSelection(this.selectionState, this.totalServidor)) {
      this.toast.showWarning(
        'Selecione pelo menos um cliente para acessar as ações.',
      );
      if (this.acoesMenuAberto) {
        this.acoesMenuAberto = false;
        this.syncShellBottomNavActions();
      }
      return;
    }
    this.acoesMenuAberto = !this.acoesMenuAberto;
    this.syncShellBottomNavActions();
  }

  acoesMenuItens(): MobileListActionMenuItem[] {
    // Exclusão em massa = CC-09-E; aqui só exclusão individual (1 id explícito).
    const umIdExplicito =
      !this.selectionState.allFiltered &&
      this.selectionState.selecionados.size === 1;
    return [
      {
        id: 'excluir',
        label: 'Excluir',
        icon: 'trash',
        danger: true,
        disabled: !umIdExplicito,
      },
    ];
  }

  onAcoesMenuOpenChange(open: boolean): void {
    if (open || !this.acoesMenuAberto) return;
    this.acoesMenuAberto = false;
    this.syncShellBottomNavActions();
  }

  onItemAcaoSelecao(item: MobileListActionMenuItem): void {
    if (
      item.id !== 'excluir' ||
      this.selectionState.allFiltered ||
      this.selectionState.selecionados.size !== 1
    ) {
      return;
    }
    const id = [...this.selectionState.selecionados][0];
    const cliente = this.itens.find((c) => c.id === id);
    if (!cliente) return;
    this.onExcluirCliente(cliente);
  }

  carregar(): void {
    this.carregarLista();
  }

  /** Recarrega a página atual da lista paginada (CC-09-A/B). */
  private carregarLista(): void {
    const seq = ++this.listaLoadSeq;
    this.listaLoadSub?.unsubscribe();
    this.carregando = true;
    this.erro = '';

    this.listaLoadSub = this.api
      .listClientesPaginado(this.montarParamsListagem())
      .subscribe({
        next: (data) => {
          if (seq !== this.listaLoadSeq) return;
          this.itens = data.items ?? [];
          this.totalServidor = Number(data.total ?? 0);
          this.totalPaginasServidor = Number(data.totalPages ?? 0);
          this.pagina = Number(data.page ?? this.pagina) || 1;
          this.itensPorPagina = this.normalizePageSize(
            Number(data.pageSize ?? this.itensPorPagina),
          );
          this.carregando = false;
        },
        error: (e: Error) => {
          if (seq !== this.listaLoadSeq) return;
          this.erro =
            e.message ||
            'Não foi possível carregar clientes. Tente novamente.';
          this.carregando = false;
        },
      });
  }

  /**
   * Predicados de busca/filtros com a mesma semântica do GET
   * (chave omitida = sem filtro). Usado no snapshot de allFiltered.
   */
  private predicadosListagem(): ClientesListFilterPredicates {
    const params: ClientesListFilterPredicates = {};

    const q = this.buscaAplicada.trim();
    if (q) params.search = q;

    if (this.filtroStatusAtivos && !this.filtroStatusInativos) {
      params.status = 'ativos';
    } else if (!this.filtroStatusAtivos && this.filtroStatusInativos) {
      params.status = 'inativos';
    }

    if (this.filtroComCelular && !this.filtroSemCelular) {
      params.hasCellphone = true;
    } else if (!this.filtroComCelular && this.filtroSemCelular) {
      params.hasCellphone = false;
    }

    const ini = this.filtroAniversarioInicioYmd.trim().slice(0, 10);
    const fim = this.filtroAniversarioFimYmd.trim().slice(0, 10);
    if (ymdValido(ini)) params.birthdayFrom = ini;
    if (ymdValido(fim)) params.birthdayTo = fim;

    return params;
  }

  private montarParamsListagem(): {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    hasCellphone?: boolean;
    birthdayFrom?: string;
    birthdayTo?: string;
  } {
    const pageSize = this.normalizePageSize(this.itensPorPagina);
    this.itensPorPagina = pageSize;
    return {
      page: this.pagina,
      pageSize,
      ...this.predicadosListagem(),
    };
  }

  get buscaPlaceholder(): string {
    return this.buscaAberta ? 'Digite para buscar' : '';
  }

  private dispararPulsoToolbar(which: 'busca' | 'filtro'): void {
    if (which === 'busca') {
      window.clearTimeout(this.tPulsoBusca);
      this.pulsoToolbarBusca = false;
      queueMicrotask(() => {
        this.pulsoToolbarBusca = true;
        this.tPulsoBusca = window.setTimeout(() => {
          this.pulsoToolbarBusca = false;
        }, this.duracaoPulsoToolbarMs);
      });
      return;
    }
    window.clearTimeout(this.tPulsoFiltro);
    this.pulsoToolbarFiltro = false;
    queueMicrotask(() => {
      this.pulsoToolbarFiltro = true;
      this.tPulsoFiltro = window.setTimeout(() => {
        this.pulsoToolbarFiltro = false;
      }, this.duracaoPulsoToolbarMs);
    });
  }

  fecharPainelBusca(): void {
    this.buscaAberta = false;
  }

  onBuscaWrapClick(): void {
    if (!this.buscaAberta) {
      this.dispararPulsoToolbar('busca');
      this.buscaAberta = true;
      queueMicrotask(() => {
        document.getElementById('clientes-busca-input')?.focus();
      });
    }
  }

  onBuscaInput(): void {
    this.searchInput$.next(this.busca);
  }

  onBuscaEnter(ev: Event): void {
    ev.preventDefault();
    this.onBuscar();
  }

  onBuscar(): void {
    this.buscaAplicada = this.busca.trim();
    this.resetPageAndSelection();
    this.carregarLista();
  }

  toggleFiltros(ev?: Event): void {
    ev?.stopPropagation();
    if (this.modoSelecao) return;
    this.dispararPulsoToolbar('filtro');
    this.filtrosAbertos = !this.filtrosAbertos;
    this.syncShellBottomNavActions();
  }

  fecharFiltros(): void {
    if (!this.filtrosAbertos) return;
    this.filtrosAbertos = false;
    this.syncShellBottomNavActions();
  }

  onMobileItemClick(c: Cliente, ev: Event): void {
    if (this.modoSelecao) {
      ev.preventDefault();
      ev.stopPropagation();
      this.toggleSelecionadoCliente(c);
      this.syncShellBottomNavActions();
      return;
    }
    this.abrirPerfilCliente(c, ev);
  }

  private toggleSelecionadoCliente(c: Cliente): void {
    const pageIds = this.itensPagina().map((item) => item.id);
    this.selectionState = toggleClientesSelectionItem(
      this.selectionState,
      c.id,
      pageIds,
    );
  }

  toggleFiltroStatus(which: 'ativos' | 'inativos', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (which === 'ativos') this.filtroStatusAtivos = checked;
    else this.filtroStatusInativos = checked;
    this.resetPageAndSelection();
    this.carregarLista();
  }

  toggleFiltroCelular(which: 'com' | 'sem', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (which === 'com') this.filtroComCelular = checked;
    else this.filtroSemCelular = checked;
    this.resetPageAndSelection();
    this.carregarLista();
  }

  onAniversarioPeriodoAlterado(): void {
    this.resetPageAndSelection();
    this.carregarLista();
  }

  onNovoCliente(): void {
    this.cadastroDrawer.abrirNovo('', {
      onSalvo: () => this.carregar(),
    });
  }

  onExcluirCliente(c: Cliente): void {
    const id = c.id?.trim();
    if (!id || this.excluindoClienteModal) return;
    this.clientePendenteExclusao = c;
    if (!this.shellBottomNavEligible) {
      this.excluirModalMontado = true;
      this.excluirModalAberto = true;
      return;
    }
    this.excluirModalOrigem = this.medirOrigemPopoverAcoes();
    this.limparAnimacaoExcluirCliente();
    this.excluirModalSaindo = false;
    this.excluirModalMontado = true;
    this.excluirModalAberto = false;
    this.excluirModalRaf = requestAnimationFrame(() => {
      this.excluirModalRaf = requestAnimationFrame(() => {
        this.excluirModalRaf = 0;
        this.excluirModalAberto = true;
      });
    });
  }

  fecharModalExcluirCliente(): void {
    if (this.excluindoClienteModal) return;
    if (!this.shellBottomNavEligible) {
      this.descartarModalExcluirCliente();
      return;
    }
    if (!this.excluirModalAberto) {
      if (this.excluirModalRaf) this.descartarModalExcluirCliente();
      return;
    }
    this.excluirModalOrigem = this.medirOrigemPopoverAcoes();
    this.excluirModalSaindo = true;
    this.excluirModalAberto = false;
    this.limparAnimacaoExcluirCliente();
    this.excluirModalTimer = setTimeout(() => {
      this.excluirModalTimer = null;
      this.descartarModalExcluirCliente();
    }, this.duracaoSaidaExcluirCliente());
  }

  private descartarModalExcluirCliente(): void {
    this.limparAnimacaoExcluirCliente();
    this.excluirModalAberto = false;
    this.excluirModalSaindo = false;
    this.excluirModalMontado = false;
    this.clientePendenteExclusao = null;
  }

  private duracaoSaidaExcluirCliente(): number {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 120;
    }
    return this.excluirModalSaidaMs;
  }

  /** Centro do popover de Ações em relação ao centro da viewport. */
  private medirOrigemPopoverAcoes(): { x: number; y: number } {
    const menu = this.hostEl.nativeElement.querySelector(
      '.mobile-list-actions-menu',
    ) as HTMLElement | null;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    if (!menu) {
      return { x: 0, y: Math.round(window.innerHeight * 0.28) };
    }
    const r = menu.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      return { x: 0, y: Math.round(window.innerHeight * 0.28) };
    }
    const fechado = !menu.classList.contains('mobile-list-actions-menu--open');
    return {
      x: Math.round(r.left + r.width / 2 - cx),
      y: Math.round(r.top + r.height / 2 - cy - (fechado ? 8 : 0)),
    };
  }

  private limparAnimacaoExcluirCliente(): void {
    if (this.excluirModalTimer != null) {
      clearTimeout(this.excluirModalTimer);
      this.excluirModalTimer = null;
    }
    if (this.excluirModalRaf) {
      cancelAnimationFrame(this.excluirModalRaf);
      this.excluirModalRaf = 0;
    }
  }

  confirmarExcluirCliente(): void {
    const c = this.clientePendenteExclusao;
    const id = c?.id?.trim();
    if (!id || this.excluindoClienteModal) {
      this.fecharModalExcluirCliente();
      return;
    }
    this.excluindoId = id;
    this.excluindoClienteModal = true;
    this.erro = '';
    this.api.deleteCliente(id).subscribe({
      next: () => {
        this.excluindoId = null;
        this.excluindoClienteModal = false;
        this.descartarModalExcluirCliente();
        this.selectionState = applyIndividualDeleteToSelection(
          this.selectionState,
          id,
        );
        if (this.cadastroDrawer.clienteId === id) {
          this.cadastroDrawer.fechar();
        }
        this.carregar();
      },
      error: (e: Error) => {
        this.excluindoId = null;
        this.excluindoClienteModal = false;
        this.erro =
          e.message || 'Não foi possível excluir o cliente. Tente novamente.';
      },
    });
  }

  abrirPerfilCliente(cliente: Cliente, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    const id = cliente.id?.trim();
    if (!id) return;

    this.cadastroDrawer.abrirEdicao(id, {
      nomeLista: cliente.nome?.trim() ?? '',
      fotoUrlInicial: cliente.fotoUrl,
      abaInicial: 'Cadastro',
      callbacks: {
        onSalvo: (c) => this.atualizarClienteNaLista(c),
        onClienteCarregado: (c) => this.atualizarClienteNaLista(c),
      },
    });
  }

  private atualizarClienteNaLista(c: Cliente): void {
    const id = c.id?.trim();
    if (!id) return;
    const ix = this.itens.findIndex((item) => item.id === id);
    if (ix >= 0) {
      const next = [...this.itens];
      next[ix] = c;
      this.itens = next;
    }
  }

  comDadosValidos(): Cliente[] {
    return this.itens.filter((c) => Boolean(c.id?.trim() && c.nome?.trim()));
  }

  filtrados(): Cliente[] {
    // Search / status / hasCellphone / aniversário: server-side (CC-09-B).
    // Ordenação fixa na API (nome_exibido ASC, id_cliente ASC).
    return this.comDadosValidos();
  }

  totalFiltrado(): number {
    return this.totalServidor;
  }

  itensPagina(): Cliente[] {
    // Página já veio da API; não re-slice client-side.
    return this.filtrados();
  }

  totalPaginas(): number {
    return Math.max(1, this.totalPaginasServidor || 1);
  }

  paginaAnterior(): void {
    if (this.pagina > 1) {
      this.pagina--;
      this.carregarLista();
    }
  }

  paginaSeguinte(): void {
    if (this.pagina < this.totalPaginas()) {
      this.pagina++;
      this.carregarLista();
    }
  }

  togglePerPageMenu(ev: Event): void {
    ev.stopPropagation();
    if (this.carregando) return;
    this.perPageMenuAberto = !this.perPageMenuAberto;
  }

  selecionarItensPorPagina(n: number, ev: Event): void {
    ev.stopPropagation();
    this.itensPorPagina = this.normalizePageSize(n);
    this.perPageMenuAberto = false;
    this.pagina = 1;
    this.carregarLista();
  }

  estaSelecionado(id: string): boolean {
    return isItemSelected(this.selectionState, id);
  }

  /** Celular da lista: só `celular`. Sem telefone fixo nem telefone legado. */
  textoCelularLista(c: Cliente): string {
    const cel = String(c.celular ?? '').trim();
    return cel || 'Sem celular';
  }

  textoEmailLista(c: Cliente): string {
    const email = String(c.email ?? '').trim();
    return email || CLIENTES_AUSENCIA;
  }

  /** `aniversario` já chega em DD/MM/AAAA. Não reformatar. */
  textoAniversarioLista(c: Cliente): string {
    const data = String(c.aniversario ?? '').trim();
    return data || CLIENTES_AUSENCIA;
  }

  /** Só `statusOperacional`. Texto, não só cor. */
  textoStatusLista(c: Cliente): string {
    const status = String(c.statusOperacional ?? '').trim().toLowerCase();
    if (status === 'ativo') return 'Ativo';
    if (status === 'inativo') return 'Inativo';
    return '';
  }

  apelidoLista(c: Cliente): string {
    return String(c.apelido ?? '').trim();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(ev: KeyboardEvent): void {
    if (ev.defaultPrevented) return;
    if (this.excluirModalAberto || this.excluirModalMontado) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (this.excluirModalAberto && !this.excluindoClienteModal) {
        this.fecharModalExcluirCliente();
      }
      return;
    }
    if (this.cadastroDrawer.isAberto) {
      // ESC da ficha/pilha: app-cliente-cadastro-drawer-host (um nível por vez).
      return;
    }
    if (this.filtrosAbertos) {
      if (
        document.querySelector(
          '.periodo-filtro__panel--sheet.periodo-filtro__panel--open',
        )
      ) {
        return;
      }
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.fecharFiltros();
      return;
    }
    if (this.buscaAberta) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.fecharPainelBusca();
      return;
    }
    if (this.perPageMenuAberto) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.perPageMenuAberto = false;
      return;
    }
    if (this.modoSelecao) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.sairModoSelecao();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (this.buscaAberta && !t?.closest?.('.list-head__busca-wrap')) {
      this.fecharPainelBusca();
    }
    if (
      this.perPageMenuAberto &&
      t &&
      !t.closest('.list-footer__per-page')
    ) {
      this.perPageMenuAberto = false;
    }
  }
}
