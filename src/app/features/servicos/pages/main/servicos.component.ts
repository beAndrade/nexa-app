import { CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import type { Servico } from '../../../../core/models/api.models';
import { valorMonetarioParaNumero } from '../../../../core/utils/atendimento-display';
import { formataMoedaBrl } from '../../../../core/utils/brl-digit-input';
import { lerServicoTexto } from '../../../../core/utils/servico-campos';
import { mediaQueryMin } from '../../../../styles/breakpoints';
import { ServicoCadastroDrawerService } from '../../../../shared/servico-cadastro-drawer/servico-cadastro-drawer.service';
import {
  areAllSelected,
  buildSelectionBottomNavActions,
  selectAllIds,
  toggleId,
} from '../../../../shared/mobile-list-selection/mobile-list-selection';
import { UiTipTriggerComponent } from '../../../../shared/ui-tip-trigger/ui-tip-trigger.component';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import {
  MobileListActionMenuItem,
  MobileListActionsMenuComponent,
} from '../../../../shared/components/mobile-list-actions-menu/mobile-list-actions-menu.component';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import { tooltipOrdenacaoProximoClique } from '../../../../shared/table-sort-tip.util';
import { FlipDropdownPanelDirective } from '../../../../shared/flip-dropdown-panel/flip-dropdown-panel.directive';
import {
  MegahairSubAba,
  ServicosMegahairPanelComponent,
} from './servicos-megahair-panel.component';

export type ServicosAba = 'servicos' | 'megahair';

const MEGAHAIR_CATALOGOS: { id: MegahairSubAba; label: string }[] = [
  { id: 'mega', label: 'Mega' },
  { id: 'pacote', label: 'Pacote' },
  { id: 'pacote_queratina', label: 'Pacote Adesivo+Queratina' },
  { id: 'cabelo', label: 'Cabelo' },
];

const SERVICOS_BOTTOM_NAV_OWNER = 'servicos';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [
    FlipDropdownPanelDirective,
    TableEmptyComponent,
    MobileFiltrosSheetComponent,
    MobileListActionsMenuComponent,
    FormsModule,
    CurrencyPipe,
    UiTipTriggerComponent,
    ServicosMegahairPanelComponent,
  ],
  templateUrl: './servicos.component.html',
  styleUrl: './servicos.component.scss',
})
export class ServicosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly api = inject(SheetsApiService);
  private readonly drawer = inject(ServicoCadastroDrawerService);
  private readonly shellUi = inject(AppShellUiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private salvoSub: Subscription | null = null;
  private shellDesktopMq: MediaQueryList | null = null;
  private readonly onShellViewportChange = (): void => {
    this.shellBottomNavEligible = !(this.shellDesktopMq?.matches ?? true);
    if (!this.shellBottomNavEligible && this.modoSelecao) {
      this.modoSelecao = false;
      this.acoesMenuAberto = false;
      this.selecionados.clear();
      this.limparFeedbackSelecionarTudo();
    }
    this.syncShellBottomNavActions();
    if (this.shellBottomNavEligible && this.aba === 'megahair') {
      this.rolarFaixaMegahair();
    }
  };

  @ViewChild('tabsNav') private tabsNav?: ElementRef<HTMLElement>;
  @ViewChild(ServicosMegahairPanelComponent)
  private megahairPanel?: ServicosMegahairPanelComponent;

  aba: ServicosAba = 'servicos';
  megahairSub: MegahairSubAba = 'mega';
  readonly megahairCatalogos = MEGAHAIR_CATALOGOS;
  tabsIndicatorLeft = 0;
  tabsIndicatorWidth = 0;

  carregando = false;
  erro = '';
  itens: Servico[] = [];
  /** Categorias ativas do catálogo (para datalist do drawer). */
  private categoriasAtivas: string[] = [];

  busca = '';
  buscaAberta = false;
  buscaPlaceholder = 'Buscar serviços';
  pulsoToolbarBusca = false;
  pulsoToolbarFiltro = false;
  private readonly duracaoPulsoToolbarMs = 420;
  private tPulsoFiltro = 0;

  filtrosAbertos = false;
  /** Status: Ativos = mostra no site; Inativos = ocultos do site. */
  filtroMostraSim = true;
  filtroMostraNao = true;
  filtroTipoFixo = true;
  filtroTipoTamanho = true;
  /** `null` = todas as categorias; Set = só as marcadas. */
  private filtroCategorias: Set<string> | null = null;

  pagina = 1;
  porPagina = 20;
  readonly opcoesPorPagina = [10, 20, 50];
  perPageMenuAberto = false;

  selecionados = new Set<string>();
  /** Seleção mobile. O checkbox da tabela desktop continua por página. */
  modoSelecao = false;
  acoesMenuAberto = false;
  shellBottomNavEligible = false;

  /** Coluna activa e direcção (padrão Nome asc). */
  ordenacaoColuna:
    | 'nome'
    | 'valor'
    | 'comissao'
    | 'duracao'
    | 'categoria'
    | 'mostra' = 'nome';
  ordenacaoDir: 'asc' | 'desc' = 'asc';

  excluirModalAberto = false;
  excluirModalMontado = false;
  excluirModalSaindo = false;
  excluirModalOrigem = { x: 0, y: 0 };
  private readonly excluirModalSaidaMs = 200;
  private excluirModalTimer: ReturnType<typeof setTimeout> | null = null;
  private excluirModalRaf = 0;
  private selecionarTudoBusy = false;
  private selecionarTudoFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
  excluindo = false;
  excluirAlvo: Servico | null = null;
  excluirErro = '';

  ngOnInit(): void {
    this.aplicarDeepLinkAbasSeHouver();
    this.setupShellBottomNav();
    this.carregar();
    this.salvoSub = this.drawer.salvo$.subscribe((item) =>
      this.aplicarServicoSalvo(item),
    );
  }

  ngAfterViewInit(): void {
    this.sincronizarIndicadorTabs();
    // Prefetch Megahair com o painel já montado (sem remount ao trocar aba).
    queueMicrotask(() => this.megahairPanel?.carregarSeNecessario());
  }

  /**
   * Só para entrada via `/pacotes` (redirect com ?aba=megahair).
   * Depois limpa a query — trocar abas não altera a URL (padrão Produtos).
   */
  private aplicarDeepLinkAbasSeHouver(): void {
    const qm = this.route.snapshot.queryParamMap;
    const aba = String(qm.get('aba') ?? '').trim().toLowerCase();
    const sub = String(qm.get('sub') ?? '').trim().toLowerCase();
    let mudou = false;
    if (aba === 'megahair') {
      this.aba = 'megahair';
      mudou = true;
    } else if (aba === 'servicos') {
      this.aba = 'servicos';
      mudou = true;
    }
    if (
      sub === 'mega' ||
      sub === 'pacote' ||
      sub === 'pacote_queratina' ||
      sub === 'cabelo'
    ) {
      this.megahairSub = sub;
      mudou = true;
    }
    this.atualizarPlaceholderBusca();
    if (mudou || qm.has('aba') || qm.has('sub')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { aba: null, sub: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  definirAba(aba: ServicosAba): void {
    if (this.aba === aba) return;
    if (this.modoSelecao) this.sairModoSelecao();
    if (this.shellBottomNavEligible && this.filtrosAbertos) this.fecharFiltros();
    this.aba = aba;
    this.busca = '';
    this.atualizarPlaceholderBusca();
    this.sincronizarIndicadorTabs();
    this.syncShellBottomNavActions();
    if (aba === 'megahair') this.rolarFaixaMegahair();
  }

  onMegahairSubChange(sub: MegahairSubAba): void {
    if (this.megahairSub === sub) return;
    this.megahairSub = sub;
    this.busca = '';
    this.atualizarPlaceholderBusca();
    this.rolarFaixaMegahair();
  }

  /** Mantém o catálogo ativo dentro da faixa, sem rolar a página. */
  private rolarFaixaMegahair(): void {
    if (!this.shellBottomNavEligible || typeof window === 'undefined') return;
    const reduzir =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    requestAnimationFrame(() => {
      const faixa = this.hostEl.nativeElement.querySelector(
        '.servicos-megahair-faixa',
      ) as HTMLElement | null;
      const ativo = faixa?.querySelector(
        '.servicos-megahair-faixa__item--ativo',
      ) as HTMLElement | null;
      if (!faixa || !ativo) return;
      const alvo = ativo.offsetLeft - (faixa.clientWidth - ativo.offsetWidth) / 2;
      faixa.scrollTo({
        left: Math.max(0, alvo),
        behavior: reduzir ? 'auto' : 'smooth',
      });
    });
  }

  private atualizarPlaceholderBusca(): void {
    this.buscaPlaceholder =
      this.aba === 'megahair' ? 'Buscar no catálogo' : 'Buscar serviços';
  }

  private sincronizarIndicadorTabs(): void {
    const medir = () => {
      const nav = this.tabsNav?.nativeElement;
      if (!nav) return;
      const alvo = nav.querySelector(
        `.list-page__tab[data-aba="${this.aba}"]`,
      ) as HTMLElement | null;
      if (!alvo) return;
      this.tabsIndicatorLeft = alvo.offsetLeft;
      this.tabsIndicatorWidth = alvo.offsetWidth;
    };
    requestAnimationFrame(medir);
  }

  ngOnDestroy(): void {
    this.shellDesktopMq?.removeEventListener('change', this.onShellViewportChange);
    this.shellDesktopMq = null;
    this.shellUi.clearMobileBottomNavActions(SERVICOS_BOTTOM_NAV_OWNER);
    this.limparFeedbackSelecionarTudo();
    this.limparAnimacaoExcluir();
    this.salvoSub?.unsubscribe();
    this.salvoSub = null;
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    this.onShellViewportChange();
    this.shellDesktopMq.addEventListener('change', this.onShellViewportChange);
  }

  /**
   * Menu fica no shell. Aba Serviços: Filtro | Selecionar | Novo.
   * Aba Megahair: só Novo. Em seleção de Serviços: Cancelar | Selecionar tudo | Ações.
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(SERVICOS_BOTTOM_NAV_OWNER);
      return;
    }
    if (this.modoSelecao) {
      const actions = buildSelectionBottomNavActions(this.todosFiltradosSelecionados(), {
        onCancel: () => this.sairModoSelecao(),
        onSelectAll: () => this.selecionarTodosMobile(),
        onActions: () => this.onAcoesSelecao(),
        selectAllAriaLabel: 'Selecionar todos os serviços filtrados',
      });
      const acoes = actions.find((action) => action.id === 'acoes');
      if (acoes) acoes.active = this.acoesMenuAberto;
      const selecionarTudo = actions.find((action) => action.id === 'selecionar-tudo');
      if (selecionarTudo) selecionarTudo.busy = this.selecionarTudoBusy;
      this.shellUi.setMobileBottomNavActions(SERVICOS_BOTTOM_NAV_OWNER, actions);
      return;
    }
    if (this.aba === 'megahair') {
      this.shellUi.setMobileBottomNavActions(SERVICOS_BOTTOM_NAV_OWNER, [
        {
          id: 'novo',
          label: 'Novo',
          ariaLabel: 'Novo',
          icon: 'plus',
          accent: true,
          onClick: () => this.abrirNovo(),
        },
      ]);
      return;
    }
    this.shellUi.setMobileBottomNavActions(SERVICOS_BOTTOM_NAV_OWNER, [
      {
        id: 'filtro',
        label: 'Filtro',
        ariaLabel: this.filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
        icon: 'filter',
        active: this.filtrosAbertos,
        onClick: () => this.onFiltroMobile(),
      },
      {
        id: 'selecionar',
        label: 'Selecionar',
        ariaLabel: 'Selecionar serviços',
        icon: 'check',
        active: false,
        onClick: () => this.entrarModoSelecao(),
      },
      {
        id: 'novo',
        label: 'Novo',
        ariaLabel: 'Novo serviço',
        icon: 'plus',
        accent: true,
        onClick: () => this.abrirNovo(),
      },
    ]);
  }

  /** Abaixo de 768, na aba Serviços, Filtro abre o sheet. */
  private onFiltroMobile(): void {
    if (this.aba !== 'servicos') return;
    this.filtrosAbertos = !this.filtrosAbertos;
    this.syncShellBottomNavActions();
  }

  fecharFiltros(): void {
    if (!this.filtrosAbertos) return;
    this.filtrosAbertos = false;
    this.syncShellBottomNavActions();
  }

  entrarModoSelecao(): void {
    if (this.aba !== 'servicos') return;
    if (this.shellBottomNavEligible && this.filtrosAbertos) this.fecharFiltros();
    this.modoSelecao = true;
    this.syncShellBottomNavActions();
  }

  sairModoSelecao(): void {
    this.modoSelecao = false;
    this.acoesMenuAberto = false;
    this.limparFeedbackSelecionarTudo();
    this.selecionados.clear();
    this.syncShellBottomNavActions();
  }

  todosFiltradosSelecionados(): boolean {
    return areAllSelected(
      this.filtrados().map((s) => String(s.id)),
      this.selecionados,
    );
  }

  selecionarTodosMobile(): void {
    this.selecionados = selectAllIds(
      this.selecionados,
      this.filtrados().map((s) => String(s.id)),
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

  private onAcoesSelecao(): void {
    this.acoesMenuAberto = !this.acoesMenuAberto;
    this.syncShellBottomNavActions();
  }

  acoesMenuItens(): MobileListActionMenuItem[] {
    const um = this.selecionados.size === 1;
    return [
      {
        id: 'editar',
        label: 'Editar',
        ariaLabel: 'Editar serviço selecionado',
        disabled: !um,
      },
      {
        id: 'excluir',
        label: 'Excluir',
        ariaLabel: 'Excluir serviço selecionado',
        icon: 'trash',
        danger: true,
        disabled: !um,
      },
    ];
  }

  onAcoesMenuOpenChange(open: boolean): void {
    if (open || !this.acoesMenuAberto) return;
    this.acoesMenuAberto = false;
    this.syncShellBottomNavActions();
  }

  onItemAcaoSelecao(item: MobileListActionMenuItem): void {
    if (this.selecionados.size !== 1) return;
    const id = [...this.selecionados][0];
    const servico = this.itens.find((s) => String(s.id) === id);
    if (!servico) return;
    if (item.id === 'editar') {
      this.sairModoSelecao();
      this.abrirEditar(servico);
      return;
    }
    if (item.id === 'excluir') this.pedirExcluir(servico);
  }

  onMobileCardClick(s: Servico, ev: Event): void {
    if (this.modoSelecao) {
      ev.preventDefault();
      ev.stopPropagation();
      this.selecionados = toggleId(this.selecionados, String(s.id));
      this.syncShellBottomNavActions();
      return;
    }
    this.abrirEditar(s);
  }

  servicoInativo(s: Servico): boolean {
    return s['mostra_no_site'] === false;
  }

  /**
   * Recarrega o catálogo. Com `focarId`, limpa busca/filtros e abre a página
   * onde o serviço cai (evita “sumir” na pág. 1 após Novo).
   */
  carregar(opts?: { focarId?: string }): void {
    this.carregando = true;
    this.erro = '';
    forkJoin({
      servicos: this.api.listServicos(),
      categorias: this.api.listCategoriasCatalogo(false),
    }).subscribe({
      next: ({ servicos, categorias }) => {
        this.itens = servicos;
        this.categoriasAtivas = (categorias ?? [])
          .map((c) => String(c.nome ?? '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'pt-BR'));
        this.carregando = false;
        this.selecionados.clear();
        this.syncShellBottomNavActions();
        if (opts?.focarId) {
          this.irParaServicoNaLista(opts.focarId);
        } else {
          this.pagina = 1;
        }
      },
      error: (e: Error) => {
        this.erro =
          e.message || 'Não foi possível carregar serviços. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  /** Insere/atualiza o item confirmado pela API e depois recarrega a lista. */
  private aplicarServicoSalvo(item: Servico): void {
    const id = String(item?.id ?? '').trim();
    const nome = String(item?.['Serviço'] ?? '').trim();
    if (!id || !nome) {
      this.erro =
        'O servidor não confirmou o serviço gravado. Recarregue e tente de novo.';
      this.carregar();
      return;
    }
    const rest = this.itens.filter((s) => String(s.id) !== id);
    this.itens = [...rest, item];
    this.irParaServicoNaLista(id);
    this.carregar({ focarId: id });
  }

  /** Limpa filtros ativos e posiciona a paginação no serviço indicado. */
  private irParaServicoNaLista(id: string): void {
    this.busca = '';
    this.buscaAberta = false;
    this.limparFiltros();
    this.filtrosAbertos = false;

    const idx = this.filtrados().findIndex((s) => String(s.id) === id);
    if (idx < 0) {
      this.pagina = 1;
      return;
    }
    this.pagina = Math.floor(idx / this.porPagina) + 1;
  }

  categoriasDisponiveis(): string[] {
    if (this.categoriasAtivas.length > 0) return this.categoriasAtivas.slice();
    const set = new Set<string>();
    for (const s of this.itens) {
      const c = String(s['Categoria'] ?? '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  filtrados(): Servico[] {
    const q = this.busca.trim().toLowerCase();
    const list = this.itens.filter((s) => {
      const nome = this.rotuloServico(s).toLowerCase();
      const cat = String(s['Categoria'] ?? '')
        .trim()
        .toLowerCase();
      if (q && !nome.includes(q) && !cat.includes(q)) return false;

      const noSite = s['mostra_no_site'] !== false;
      if (noSite && !this.filtroMostraSim) return false;
      if (!noSite && !this.filtroMostraNao) return false;

      const t = String(s['Tipo'] ?? '')
        .trim()
        .toLowerCase();
      const isFixo = t !== 'tamanho';
      if (isFixo && !this.filtroTipoFixo) return false;
      if (!isFixo && !this.filtroTipoTamanho) return false;

      if (this.filtroCategorias) {
        const catNome = String(s['Categoria'] ?? '').trim();
        if (!this.filtroCategorias.has(catNome)) return false;
      }

      return true;
    });

    const dir = this.ordenacaoDir === 'asc' ? 1 : -1;
    return list.slice().sort((a, b) => this.compararOrdenacao(a, b) * dir);
  }

  onOrdenarColuna(
    col: typeof this.ordenacaoColuna,
    event: MouseEvent,
  ): void {
    if (this.ordenacaoColuna === col) {
      this.ordenacaoDir = this.ordenacaoDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenacaoColuna = col;
      this.ordenacaoDir = 'asc';
    }
    this.pagina = 1;
    (event.currentTarget as HTMLButtonElement | null)?.blur();
  }

  tooltipOrdenacao(col: typeof this.ordenacaoColuna): string {
    return tooltipOrdenacaoProximoClique(
      this.ordenacaoColuna,
      this.ordenacaoDir,
      col,
    );
  }

  private compararOrdenacao(a: Servico, b: Servico): number {
    switch (this.ordenacaoColuna) {
      case 'nome':
        return this.rotuloServico(a).localeCompare(
          this.rotuloServico(b),
          'pt-BR',
          { sensitivity: 'base' },
        );
      case 'valor': {
        const va = this.valorExibicao(a) ?? -1;
        const vb = this.valorExibicao(b) ?? -1;
        return va - vb;
      }
      case 'comissao':
        return this.comissaoSortKey(a) - this.comissaoSortKey(b);
      case 'duracao': {
        return this.duracaoSortKey(a) - this.duracaoSortKey(b);
      }
      case 'categoria':
        return this.categoriaServico(a).localeCompare(
          this.categoriaServico(b),
          'pt-BR',
          { sensitivity: 'base' },
        );
      case 'mostra': {
        const ma = a['mostra_no_site'] === false ? 0 : 1;
        const mb = b['mostra_no_site'] === false ? 0 : 1;
        return ma - mb;
      }
      default:
        return 0;
    }
  }

  private comissaoSortKey(s: Servico): number {
    const tipo = lerServicoTexto(s, 'Tipo', 'tipo').toLowerCase();
    if (tipo === 'tamanho') {
      const pcts = this.comissaoPctsPorFaixa(s);
      if (pcts.length > 0) return Math.min(...pcts);
      return -1;
    }
    const pct = lerServicoTexto(s, 'Comissão %', 'comissao_pct')
      .replace('%', '')
      .replace(',', '.');
    if (pct) {
      const n = Number.parseFloat(pct);
      if (Number.isFinite(n)) return n;
    }
    return (
      valorMonetarioParaNumero(
        lerServicoTexto(s, 'Comissão Fixa', 'comissao_fixa'),
      ) ?? -1
    );
  }

  totalFiltrado(): number {
    return this.filtrados().length;
  }

  paginaItens(): Servico[] {
    const all = this.filtrados();
    const start = (this.pagina - 1) * this.porPagina;
    return all.slice(start, start + this.porPagina);
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalFiltrado() / this.porPagina));
  }

  irPagina(delta: number): void {
    this.pagina = Math.min(
      this.totalPaginas(),
      Math.max(1, this.pagina + delta),
    );
  }

  togglePerPageMenu(ev?: Event): void {
    ev?.stopPropagation();
    this.perPageMenuAberto = !this.perPageMenuAberto;
  }

  selecionarPorPagina(n: number, ev?: Event): void {
    ev?.stopPropagation();
    this.porPagina = n;
    this.pagina = 1;
    this.perPageMenuAberto = false;
  }

  onBuscaWrapClick(): void {
    if (!this.buscaAberta) {
      this.buscaAberta = true;
      this.dispararPulsoToolbar('busca');
      queueMicrotask(() => {
        document.getElementById('servicos-busca-input')?.focus();
      });
    }
  }

  onBuscaInput(): void {
    this.pagina = 1;
  }

  toggleFiltros(ev?: Event): void {
    ev?.stopPropagation();
    this.dispararPulsoToolbar('filtro');
    this.filtrosAbertos = !this.filtrosAbertos;
    if (this.shellBottomNavEligible) this.syncShellBottomNavActions();
  }

  private dispararPulsoToolbar(which: 'busca' | 'filtro'): void {
    if (which === 'busca') {
      this.pulsoToolbarBusca = false;
      queueMicrotask(() => {
        this.pulsoToolbarBusca = true;
        window.setTimeout(() => {
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

  toggleFiltroMostra(which: 'sim' | 'nao', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (which === 'sim') this.filtroMostraSim = checked;
    else this.filtroMostraNao = checked;
    if (!this.filtroMostraSim && !this.filtroMostraNao) {
      if (which === 'sim') this.filtroMostraNao = true;
      else this.filtroMostraSim = true;
    }
    this.pagina = 1;
  }

  toggleFiltroTipo(which: 'fixo' | 'tamanho', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (which === 'fixo') this.filtroTipoFixo = checked;
    else this.filtroTipoTamanho = checked;
    if (!this.filtroTipoFixo && !this.filtroTipoTamanho) {
      if (which === 'fixo') this.filtroTipoTamanho = true;
      else this.filtroTipoFixo = true;
    }
    this.pagina = 1;
  }

  todasCategoriasSelecionadas(): boolean {
    return this.filtroCategorias === null;
  }

  categoriaFiltroMarcada(cat: string): boolean {
    return this.filtroCategorias === null || this.filtroCategorias.has(cat);
  }

  toggleTodasCategorias(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.filtroCategorias = checked ? null : new Set();
    this.pagina = 1;
  }

  toggleFiltroCategoria(cat: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const todas = this.categoriasDisponiveis();
    if (this.filtroCategorias === null) {
      this.filtroCategorias = new Set(todas);
    }
    if (checked) this.filtroCategorias.add(cat);
    else this.filtroCategorias.delete(cat);
    if (
      this.filtroCategorias.size === 0 ||
      (todas.length > 0 && todas.every((c) => this.filtroCategorias!.has(c)))
    ) {
      this.filtroCategorias = this.filtroCategorias.size === 0 ? new Set() : null;
    }
    this.pagina = 1;
  }

  /** Chips só dos eixos fora do padrão. A ordem segue Status, Tipo, Categorias. */
  chipsFiltrosMobile(): { id: string; label: string }[] {
    const chips: { id: string; label: string }[] = [];
    if (this.filtroMostraSim && !this.filtroMostraNao) {
      chips.push({ id: 'status', label: 'Status: Ativos' });
    } else if (!this.filtroMostraSim && this.filtroMostraNao) {
      chips.push({ id: 'status', label: 'Status: Inativos' });
    }
    if (this.filtroTipoFixo && !this.filtroTipoTamanho) {
      chips.push({ id: 'tipo', label: 'Tipo: Preço fixo' });
    } else if (!this.filtroTipoFixo && this.filtroTipoTamanho) {
      chips.push({ id: 'tipo', label: 'Tipo: Por tamanho' });
    }
    if (this.filtroCategorias !== null) {
      if (this.filtroCategorias.size === 0) {
        chips.push({ id: 'cat-nenhuma', label: 'Categoria: nenhuma' });
      } else {
        for (const cat of this.categoriasDisponiveis()) {
          if (!this.filtroCategorias.has(cat)) continue;
          chips.push({ id: `cat:${cat}`, label: `Categoria: ${cat}` });
        }
      }
    }
    return chips;
  }

  removerChipFiltro(id: string, ev: Event): void {
    ev.stopPropagation();
    if (id === 'status') {
      this.filtroMostraSim = true;
      this.filtroMostraNao = true;
      this.pagina = 1;
      return;
    }
    if (id === 'tipo') {
      this.filtroTipoFixo = true;
      this.filtroTipoTamanho = true;
      this.pagina = 1;
      return;
    }
    if (id === 'cat-nenhuma') {
      this.filtroCategorias = null;
      this.pagina = 1;
      return;
    }
    if (id.startsWith('cat:')) {
      const falso = { target: { checked: false } } as unknown as Event;
      this.toggleFiltroCategoria(id.slice(4), falso);
    }
  }

  get filtroAlgumAtivo(): boolean {
    if (this.aba === 'megahair') {
      return this.megahairSub !== 'mega';
    }
    return (
      !this.filtroMostraSim ||
      !this.filtroMostraNao ||
      !this.filtroTipoFixo ||
      !this.filtroTipoTamanho ||
      this.filtroCategorias !== null
    );
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (this.buscaAberta && !t?.closest?.('.list-head__busca-wrap')) {
      if (!this.busca.trim()) this.buscaAberta = false;
    }
    if (this.perPageMenuAberto && !t?.closest?.('.list-footer__per-page')) {
      this.perPageMenuAberto = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(ev: KeyboardEvent): void {
    if (this.excluirModalAberto) {
      ev.preventDefault();
      this.fecharExcluir();
      return;
    }
    if (this.perPageMenuAberto) this.perPageMenuAberto = false;
    else if (this.filtrosAbertos) this.fecharFiltros();
    else if (this.buscaAberta) this.buscaAberta = false;
  }

  abrirNovo(): void {
    if (this.aba === 'megahair') {
      this.megahairPanel?.abrirNovo();
      return;
    }
    this.drawer.abrirNovo({
      categorias: this.categoriasDisponiveis(),
    });
  }

  abrirEditar(s: Servico): void {
    this.drawer.abrirEdicao(s, {
      categorias: this.categoriasDisponiveis(),
    });
  }

  pedirExcluir(s: Servico): void {
    this.excluirAlvo = s;
    this.excluirErro = '';
    if (!this.shellBottomNavEligible) {
      this.excluirModalSaindo = false;
      this.excluirModalMontado = true;
      this.excluirModalAberto = true;
      return;
    }
    this.excluirModalOrigem = this.medirOrigemPopoverAcoes();
    this.limparAnimacaoExcluir();
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

  fecharExcluir(): void {
    if (this.excluindo) return;
    if (!this.shellBottomNavEligible) {
      this.descartarModalExcluir();
      return;
    }
    if (!this.excluirModalAberto) {
      if (this.excluirModalRaf) this.descartarModalExcluir();
      return;
    }
    this.excluirModalOrigem = this.medirOrigemPopoverAcoes();
    this.excluirModalSaindo = true;
    this.excluirModalAberto = false;
    this.limparAnimacaoExcluir();
    this.excluirModalTimer = setTimeout(() => {
      this.excluirModalTimer = null;
      this.descartarModalExcluir();
    }, this.duracaoSaidaExcluir());
  }

  private descartarModalExcluir(): void {
    this.limparAnimacaoExcluir();
    this.excluirModalAberto = false;
    this.excluirModalSaindo = false;
    this.excluirModalMontado = false;
    this.excluirAlvo = null;
    this.excluirErro = '';
  }

  private duracaoSaidaExcluir(): number {
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

  private limparAnimacaoExcluir(): void {
    if (this.excluirModalTimer != null) {
      clearTimeout(this.excluirModalTimer);
      this.excluirModalTimer = null;
    }
    if (this.excluirModalRaf) {
      cancelAnimationFrame(this.excluirModalRaf);
      this.excluirModalRaf = 0;
    }
  }

  confirmarExcluir(): void {
    const s = this.excluirAlvo;
    if (!s || this.excluindo) return;
    this.excluindo = true;
    this.excluirErro = '';
    this.api.deleteServico(String(s.id)).subscribe({
      next: () => {
        this.excluindo = false;
        this.descartarModalExcluir();
        this.carregar();
      },
      error: (e: Error) => {
        this.excluindo = false;
        this.excluirErro =
          e.message || 'Não foi possível excluir o serviço.';
      },
    });
  }

  rotuloServico(s: Servico): string {
    return String(s['Serviço'] ?? '').trim();
  }

  categoriaServico(s: Servico): string {
    return String(s['Categoria'] ?? '').trim();
  }

  mostraNoSite(s: Servico): string {
    return s['mostra_no_site'] === false ? 'Não' : 'Sim';
  }

  valorExibicao(s: Servico): number | null {
    const tipo = String(s['Tipo'] ?? '')
      .trim()
      .toLowerCase();
    if (tipo === 'tamanho') {
      const precos = [
        s['Preço Curto'],
        s['Preço Médio'],
        s['Preço Médio/Longo'],
        s['Preço Longo'],
      ]
        .map((v) => valorMonetarioParaNumero(v))
        .filter((n): n is number => n != null && n > 0);
      if (precos.length === 0) return null;
      return Math.min(...precos);
    }
    return valorMonetarioParaNumero(s['Valor Base']);
  }

  valorPrefixo(s: Servico): string {
    const tipo = String(s['Tipo'] ?? '')
      .trim()
      .toLowerCase();
    return tipo === 'tamanho' ? 'a partir de ' : '';
  }

  comissaoExibicao(s: Servico): string {
    const tipo = lerServicoTexto(s, 'Tipo', 'tipo').toLowerCase();
    if (tipo === 'tamanho') {
      const pcts = this.comissaoPctsPorFaixa(s);
      if (pcts.length === 0) return '';
      const min = Math.min(...pcts);
      const max = Math.max(...pcts);
      return min === max ? `% ${min}` : `% ${min}–${max}`;
    }

    const pct = lerServicoTexto(s, 'Comissão %', 'comissao_pct');
    if (pct) {
      const n = pct.replace('%', '').trim();
      return n ? `% ${n}` : '';
    }
    const fixa = valorMonetarioParaNumero(
      lerServicoTexto(s, 'Comissão Fixa', 'comissao_fixa'),
    );
    if (fixa != null && fixa > 0) {
      return formataMoedaBrl(fixa);
    }
    return '';
  }

  /** % por faixa a partir de R$/preço (ou `comissao_pct` legado). */
  private comissaoPctsPorFaixa(s: Servico): number[] {
    const faixas: Array<[string[], string[]]> = [
      [['Preço Curto', 'preco_curto'], ['Curto', 'curto']],
      [['Preço Médio', 'preco_medio'], ['Médio', 'medio']],
      [['Preço Médio/Longo', 'preco_medio_longo'], ['M/L', 'm_l']],
      [['Preço Longo', 'preco_longo'], ['Longo', 'longo']],
    ];
    const out: number[] = [];
    for (const [precoKeys, comKeys] of faixas) {
      const preco = valorMonetarioParaNumero(lerServicoTexto(s, ...precoKeys));
      const comissao = valorMonetarioParaNumero(lerServicoTexto(s, ...comKeys));
      if (preco != null && preco > 0 && comissao != null && comissao > 0) {
        out.push(Math.round((comissao / preco) * 100));
      }
    }
    if (out.length > 0) return out;
    const pct = lerServicoTexto(s, 'Comissão %', 'comissao_pct')
      .replace('%', '')
      .replace(',', '.')
      .trim();
    if (pct) {
      const n = Number.parseFloat(pct);
      if (Number.isFinite(n) && n > 0) return [n];
    }
    return [];
  }

  duracaoExibicao(s: Servico): string {
    const tipo = String(s['Tipo'] ?? '')
      .trim()
      .toLowerCase();
    if (tipo === 'tamanho') {
      const faixas = this.duracoesFaixaMinutos(s);
      if (faixas.length > 0) {
        const min = Math.min(...faixas);
        const max = Math.max(...faixas);
        if (min === max) return `${min} min`;
        return `${min}–${max} min`;
      }
    }
    const m = Number(s['duracao_minutos'] ?? 30);
    if (!Number.isFinite(m) || m <= 0) return '';
    return `${m} min`;
  }

  private duracoesFaixaMinutos(s: Servico): number[] {
    const keys = [
      'duracao_curto',
      'duracao_medio',
      'duracao_m_l',
      'duracao_longo',
    ] as const;
    const out: number[] = [];
    for (const k of keys) {
      const raw = s[k];
      if (raw == null || raw === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
    return out;
  }

  private duracaoSortKey(s: Servico): number {
    const tipo = String(s['Tipo'] ?? '')
      .trim()
      .toLowerCase();
    if (tipo === 'tamanho') {
      const faixas = this.duracoesFaixaMinutos(s);
      if (faixas.length > 0) return Math.min(...faixas);
    }
    const m = Number(s['duracao_minutos'] ?? 0);
    return Number.isFinite(m) ? m : 0;
  }

  estaSelecionado(id: string): boolean {
    return this.selecionados.has(id);
  }

  toggleSelecionado(s: Servico, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const id = String(s.id);
    if (checked) this.selecionados.add(id);
    else this.selecionados.delete(id);
  }

  todosDaPaginaSelecionados(): boolean {
    const page = this.paginaItens();
    return page.length > 0 && page.every((s) => this.selecionados.has(String(s.id)));
  }

  toggleSelecionarTodos(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    for (const s of this.paginaItens()) {
      const id = String(s.id);
      if (checked) this.selecionados.add(id);
      else this.selecionados.delete(id);
    }
  }

  limparFiltros(): void {
    this.filtroMostraSim = true;
    this.filtroMostraNao = true;
    this.filtroTipoFixo = true;
    this.filtroTipoTamanho = true;
    this.filtroCategorias = null;
    this.pagina = 1;
  }
}
