import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { SaasSelectComponent } from '../../../../shared/components/saas-select/saas-select.component';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { catchError, of } from 'rxjs';
import type { Cliente } from '../../../../core/models/api.models';
import type {
  FinComissaoDetalheItem,
  FinComissaoPagaItem,
  FinComissaoResumidaItem,
} from '../../../../core/models/api.models';
import type { ComandaDrawerContextoAgenda } from '../../../../shared/comanda-drawer/comanda-drawer.types';
import { NovaComandaDrawerComponent } from '../../../agenda/pages/hub/nova-comanda-drawer.component';
import type { SaasSelectOption } from '../../../../shared/components/saas-select/saas-select.component';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import type { MobileBottomNavAction } from '../../../../core/services/app-shell-ui.service';
import { FinanceiroComissoesPrintComponent } from './financeiro-comissoes-print.component';
import {
  FinComissoesPagarDrawerComponent,
  type FinComissaoPagarConfirmPayload,
  type FinComissaoPagarResumo,
} from './fin-comissoes-pagar-drawer.component';
import { AppToastService } from '../../../../shared/app-toast/app-toast.service';
import { ClienteDrawerPeriodoFiltroComponent } from '../../../../shared/cliente-drawer-periodo-filtro/cliente-drawer-periodo-filtro.component';
import {
  ClienteCadastroDrawerService,
  type AbrirCadastroClientePayload,
} from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service';
import { abrirCadastroClienteDesdeSidebarComanda } from '../../../../shared/cliente-cadastro-drawer/comanda-drawer-sidebar-cadastro.util';
import { ProfissionalCadastroDrawerService } from '../../../../shared/profissional-cadastro-drawer/profissional-cadastro-drawer.service';
import { FinFiltrosFloatingTipComponent } from '../transacoes/fin-filtros-floating-tip.component';
import { FinanceiroBloquearBtnComponent } from '../../../../shared/financeiro-bloquear-btn/financeiro-bloquear-btn.component';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import {
  areAllSelected,
  selectAllIds,
} from '../../../../shared/mobile-list-selection/mobile-list-selection';
import { mediaQueryMin } from '../../../../styles/breakpoints';

const DRAWER_ANIM_MS = 430;
const COMISSOES_BOTTOM_NAV_OWNER = 'financeiro-comissoes';

registerLocaleData(localePt);

export type FinComissaoTab = 'detalhadas' | 'pagas';

export interface FinComissaoProfissionalUi {
  id: number;
  nome: string;
  telefone: string;
}

export interface FinComissaoPagaLinhaUi {
  movimentacaoId: number;
  dataYmd: string;
  pagamentoYmd: string;
  profissionalNome: string;
  usuarioNome: string;
  comissoes: number;
  vales: number;
  bonificacoes: number;
  valorPago: number;
}

export interface FinComissaoLinhaUi {
  id: number;
  dataYmd: string;
  clienteNome: string;
  clienteNumero: number;
  idAtendimento?: string | null;
  idCliente?: string | null;
  numeroComanda?: number | null;
  servico: string;
  quantidade: number;
  valor: number;
  taxaAcumulada: string | null;
  comissaoPct: number;
  comissaoTipo: string;
  descontoAuxiliares: string | null;
  disponivel: number;
}

@Component({
  selector: 'app-financeiro-comissoes',
  standalone: true,
  imports: [
    TableEmptyComponent,
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    FinanceiroComissoesPrintComponent,
    FinComissoesPagarDrawerComponent,
    ClienteDrawerPeriodoFiltroComponent,
    NovaComandaDrawerComponent,
    SaasSelectComponent,
    FinFiltrosFloatingTipComponent,
    FinanceiroBloquearBtnComponent,
    MobileFiltrosSheetComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './financeiro-comissoes.component.html',
  styleUrl: './financeiro-comissoes.component.scss',
})
export class FinanceiroComissoesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly toast = inject(AppToastService);
  private readonly api = inject(SheetsApiService);
  private readonly cadastroDrawer = inject(ClienteCadastroDrawerService);
  private readonly profissionalDrawer = inject(ProfissionalCadastroDrawerService);
  private readonly shellUi = inject(AppShellUiService);

  private shellDesktopMq: MediaQueryList | null = null;
  private readonly onShellViewportChange = (): void => {
    this.shellBottomNavEligible = !(this.shellDesktopMq?.matches ?? true);
    if (!this.shellBottomNavEligible) {
      if (this.filtrosAbertos) this.filtrosAbertos = false;
      if (this.modoSelecao) this.sairModoSelecao();
    }
    this.syncShellBottomNavActions();
  };

  @ViewChild(NovaComandaDrawerComponent)
  private comandaDrawerRef?: NovaComandaDrawerComponent;

  @ViewChild('tabsNav', { read: ElementRef })
  private tabsNav?: ElementRef<HTMLElement>;

  tabsIndicatorLeft = 0;
  tabsIndicatorWidth = 0;

  private readonly comandaContextoHolder = {
    get: () => this.comandaDrawerContexto,
    set: (ctx: ComandaDrawerContextoAgenda) => {
      this.comandaDrawerContexto = ctx;
    },
  };

  pagarDrawerAberto = false;
  pagarDrawerPanelOpen = false;
  private pagarDrawerCloseTimer: ReturnType<typeof setTimeout> | null = null;

  comandaPainelAberto = false;
  comandaDrawerPanelOpen = false;
  comandaDrawerContexto: ComandaDrawerContextoAgenda | null = null;
  private comandaDrawerCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private abrindoComanda = false;
  private pageScrollLockAtivo = false;
  private bodyScrollPreDrawer = 0;
  private carregarLinhasSeq = 0;
  private carregarPagasSeq = 0;


  readonly tabs: { id: FinComissaoTab; label: string }[] = [
    { id: 'detalhadas', label: 'Detalhadas' },
    { id: 'pagas', label: 'Pagas' },
  ];

  readonly profissionais = signal<FinComissaoProfissionalUi[]>([]);

  readonly profissionaisSelectOptions = computed(() =>
    this.profissionais().map((p) => ({
      value: String(p.id),
      label: p.nome,
    })),
  );
  readonly linhasDetalhe = signal<FinComissaoLinhaUi[]>([]);
  readonly linhasPagas = signal<FinComissaoPagaLinhaUi[]>([]);
  readonly erroCarregamento = signal('');
  readonly menuAcoesPagasAberto = signal<number | null>(null);
  readonly resumoFolha = signal<{
    totalComissao: number;
    totalPago: number;
    saldo: number;
  } | null>(null);

  readonly vista = signal<'filtros' | 'detalhe'>('filtros');
  readonly tabAtiva = signal<FinComissaoTab>('detalhadas');
  readonly profissionalSelecionado = signal<FinComissaoProfissionalUi | null>(
    null,
  );
  readonly sidebarAberto = signal(true);
  readonly carregando = signal(false);

  periodoInicio = '';
  periodoFim = '';
  mostrarAnteriores = false;
  profissionalIdSidebar: number | null = null;

  /** ≤767 — bottom nav contextual MLP. */
  shellBottomNavEligible = false;
  filtrosAbertos = false;
  modoSelecao = false;
  selecionarTudoBusy = false;
  private selecionarTudoFeedbackTimer: ReturnType<typeof setTimeout> | null =
    null;

  private readonly selecionados = signal<ReadonlySet<number>>(new Set());

  readonly qtdSelecionados = computed(() => this.selecionados().size);

  readonly totalComissoes = computed(() => {
    const sel = this.selecionados();
    let sum = 0;
    for (const row of this.linhasDetalhe()) {
      if (!sel.has(row.id)) continue;
      sum += row.disponivel;
    }
    return Math.round(sum * 100) / 100;
  });

  readonly podePagar = computed(() => this.selecionados().size > 0);

  readonly totalComissoesLista = computed(() => {
    let sum = 0;
    for (const row of this.linhasDetalhe()) {
      sum += row.disponivel;
    }
    return Math.round(sum * 100) / 100;
  });

  readonly totalLiquidoImpressao = computed(() => this.totalComissoesLista());

  readonly resumoPagar = computed(
    (): FinComissaoPagarResumo => ({
      comissoes: this.totalComissoes(),
      vales: 0,
      bonificacoes: 0,
      bloqueado: 0,
      liquido: this.totalComissoes(),
    }),
  );

  ngOnInit(): void {
    const { inicio, fim } = this.periodoPadraoMesAtualAteHoje();
    this.periodoInicio = inicio;
    this.periodoFim = fim;
    this.setupShellBottomNav();
    this.recarregarProfissionais();
  }

  ngAfterViewInit(): void {
    this.sincronizarIndicadorTabs();
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    this.onShellViewportChange();
    this.shellDesktopMq.addEventListener('change', this.onShellViewportChange);
  }

  /**
   * Hub filtros: bar limpa (só Menu).
   * Detalhe Detalhadas: Filtro · Selecionar · Imprimir.
   * Seleção: Cancelar · Selecionar tudo · Pagar (accent, sem popover Ações).
   * Pagas: Filtro · Imprimir · Atualizar.
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER);
      return;
    }

    if (this.tabAtiva() === 'detalhadas' && this.vista() === 'filtros') {
      this.shellUi.setMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER, []);
      return;
    }

    if (this.modoSelecao && this.tabAtiva() === 'detalhadas') {
      const allSelected = this.todosFiltradosSelecionados();
      const pode = this.podePagar();
      const actions: MobileBottomNavAction[] = [
        {
          id: 'cancelar-selecao',
          label: 'Cancelar',
          ariaLabel: 'Cancelar seleção',
          icon: 'x',
          onClick: () => this.sairModoSelecao(),
        },
        {
          id: 'selecionar-tudo',
          label: 'Selecionar tudo',
          ariaLabel: 'Selecionar todas as comissões carregadas',
          icon: 'check',
          active: allSelected,
          activeAria: 'pressed',
          busy: this.selecionarTudoBusy,
          onClick: () => this.selecionarTodosMobile(),
        },
        {
          id: 'pagar',
          label: 'Pagar',
          ariaLabel: pode
            ? `Pagar comissões selecionadas (${this.qtdSelecionados()})`
            : 'Pagar comissões — selecione ao menos uma',
          icon: 'bolt',
          accent: true,
          onClick: () => this.onPagarMobile(),
        },
      ];
      this.shellUi.setMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER, actions);
      return;
    }

    if (this.tabAtiva() === 'pagas') {
      this.shellUi.setMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER, [
        {
          id: 'filtro',
          label: 'Filtro',
          ariaLabel: this.filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
          icon: 'filter',
          active: this.filtrosAbertos,
          warn: this.temFiltroAtivo() && !this.filtrosAbertos,
          onClick: () => this.onFiltroMobile(),
        },
        {
          id: 'imprimir',
          label: 'Imprimir',
          ariaLabel: 'Imprimir',
          icon: 'print',
          onClick: () => this.imprimir(),
        },
        {
          id: 'atualizar',
          label: 'Atualizar',
          ariaLabel: 'Atualizar lista',
          icon: 'refresh',
          onClick: () => this.atualizarLista(),
        },
      ]);
      return;
    }

    // Detalhe Detalhadas (normal)
    this.shellUi.setMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER, [
      {
        id: 'filtro',
        label: 'Filtro',
        ariaLabel: this.filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
        icon: 'filter',
        active: this.filtrosAbertos,
        warn: this.temFiltroAtivo() && !this.filtrosAbertos,
        onClick: () => this.onFiltroMobile(),
      },
      {
        id: 'selecionar',
        label: 'Selecionar',
        ariaLabel: 'Selecionar comissões',
        icon: 'check',
        onClick: () => this.entrarModoSelecao(),
      },
      {
        id: 'imprimir',
        label: 'Imprimir',
        ariaLabel: 'Imprimir',
        icon: 'print',
        onClick: () => this.imprimir(),
      },
    ]);
  }

  private onFiltroMobile(): void {
    this.filtrosAbertos = !this.filtrosAbertos;
    this.syncShellBottomNavActions();
  }

  fecharFiltros(): void {
    if (!this.filtrosAbertos) return;
    this.filtrosAbertos = false;
    this.syncShellBottomNavActions();
  }

  entrarModoSelecao(): void {
    if (this.tabAtiva() !== 'detalhadas' || this.vista() !== 'detalhe') return;
    if (this.shellBottomNavEligible && this.filtrosAbertos) this.fecharFiltros();
    this.modoSelecao = true;
    this.syncShellBottomNavActions();
  }

  sairModoSelecao(): void {
    this.modoSelecao = false;
    this.limparFeedbackSelecionarTudo();
    this.selecionados.set(new Set());
    this.syncShellBottomNavActions();
  }

  todosFiltradosSelecionados(): boolean {
    return areAllSelected(
      this.linhasDetalhe().map((r) => r.id),
      this.selecionados(),
    );
  }

  selecionarTodosMobile(): void {
    this.selecionados.set(
      selectAllIds(
        this.selecionados(),
        this.linhasDetalhe().map((r) => r.id),
      ),
    );
    this.dispararFeedbackSelecionarTudo();
    this.syncShellBottomNavActions();
  }

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

  private onPagarMobile(): void {
    if (!this.podePagar()) {
      this.toast.show('Selecione ao menos uma comissão para pagar.');
      return;
    }
    this.abrirPagarDrawer();
  }

  /** Filtros além do padrão (1º dia do mês → hoje; sem anteriores; sem prof. em pagas). */
  temFiltroAtivo(): boolean {
    return this.chipsFiltrosMobile().length > 0;
  }

  chipsFiltrosMobile(): { id: string; label: string }[] {
    const chips: { id: string; label: string }[] = [];
    const padrao = this.periodoPadraoMesAtualAteHoje();
    if (
      this.periodoInicio !== padrao.inicio ||
      this.periodoFim !== padrao.fim
    ) {
      chips.push({ id: 'periodo', label: 'Período' });
    }
    if (this.tabAtiva() === 'detalhadas' && this.mostrarAnteriores) {
      chips.push({ id: 'anteriores', label: 'Anteriores' });
    }
    if (this.tabAtiva() === 'pagas' && this.profissionalIdSidebar != null) {
      const nome = this.nomeProfissionalAtual() || 'Profissional';
      chips.push({ id: 'profissional', label: nome });
    }
    return chips;
  }

  removerChipFiltro(id: string, ev?: Event): void {
    ev?.stopPropagation();
    if (id === 'periodo') {
      const padrao = this.periodoPadraoMesAtualAteHoje();
      this.periodoInicio = padrao.inicio;
      this.periodoFim = padrao.fim;
      this.onPeriodoAlterado();
      this.syncShellBottomNavActions();
      return;
    }
    if (id === 'anteriores') {
      this.mostrarAnteriores = false;
      this.onMostrarAnterioresChange();
      this.syncShellBottomNavActions();
      return;
    }
    if (id === 'profissional') {
      this.profissionalIdSidebar = null;
      this.onProfissionalSidebarChange();
      this.syncShellBottomNavActions();
    }
  }

  recarregarProfissionais(selecionarId?: number): void {
    this.api
      .listProfissionais()
      .pipe(
        catchError((e: Error) => {
          this.erroCarregamento.set(
            e.message || 'Não foi possível carregar os profissionais.',
          );
          return of([]);
        }),
      )
      .subscribe((items) => {
        const lista = items
          .filter((p) => p.id > 0)
          .map((p) => ({
            id: p.id,
            nome: p.nome,
            telefone: p.celular ?? '',
          }));
        this.profissionais.set(lista);
        if (selecionarId != null) {
          this.profissionalIdSidebar = selecionarId;
        } else if (lista.length > 0 && this.profissionalIdSidebar == null) {
          this.profissionalIdSidebar = lista[0].id;
        }
      });
  }

  ngOnDestroy(): void {
    this.shellDesktopMq?.removeEventListener('change', this.onShellViewportChange);
    this.shellDesktopMq = null;
    this.shellUi.clearMobileBottomNavActions(COMISSOES_BOTTOM_NAV_OWNER);
    this.limparFeedbackSelecionarTudo();
    if (this.pagarDrawerCloseTimer != null) {
      clearTimeout(this.pagarDrawerCloseTimer);
    }
    if (this.comandaDrawerCloseTimer != null) {
      clearTimeout(this.comandaDrawerCloseTimer);
    }
    this.desbloquearScrollPagina();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.fecharMenuAcoesPagas();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeGlobal(ev: KeyboardEvent): void {
    if (this.cadastroDrawer.isAberto) {
      // ESC da ficha/pilha: app-cliente-cadastro-drawer-host (um nível por vez).
      return;
    }
    if (this.comandaPainelAberto) {
      ev.preventDefault();
      if (this.comandaDrawerRef?.tratarEscapeInterno()) return;
      this.fecharComandaDrawer();
      return;
    }
    if (this.pagarDrawerAberto) {
      ev.preventDefault();
      this.fecharPagarDrawer();
      return;
    }
    if (this.modoSelecao && this.shellBottomNavEligible) {
      ev.preventDefault();
      this.sairModoSelecao();
      return;
    }
    if (this.filtrosAbertos) {
      ev.preventDefault();
      this.fecharFiltros();
    }
  }

  periodoLabel(): string {
    return `${this.ymdParaDdMm(this.periodoInicio)} → ${this.ymdParaDdMm(this.periodoFim)}`;
  }

  nomeProfissionalAtual(): string {
    const id = this.profissionalIdSidebar;
    const porId = this.profissionais().find((p) => p.id === id);
    if (porId?.nome) return porId.nome;
    return this.profissionalSelecionado()?.nome ?? '';
  }

  formatarData(ymd: string): string {
    return this.ymdParaDdMm(ymd);
  }

  rotuloNumeroComanda(row: FinComissaoLinhaUi): number {
    const n = row.numeroComanda ?? row.clienteNumero;
    return Number.isFinite(n) && n > 0 ? n : row.clienteNumero;
  }

  podeAbrirComanda(row: FinComissaoLinhaUi): boolean {
    return !!String(row.idAtendimento ?? '').trim();
  }

  abrirComanda(row: FinComissaoLinhaUi, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const idAt = String(row.idAtendimento ?? '').trim();
    if (!idAt || this.abrindoComanda) return;

    const cid = String(row.idCliente ?? '').trim();
    const numero = this.rotuloNumeroComanda(row);
    const dataYmd = String(row.dataYmd ?? '').trim().slice(0, 10);
    const nomeLista = String(row.clienteNome ?? '').trim();

    const abrirComCliente = (cliente: Cliente | null) => {
      if (!cid) {
        this.toast.show('Comanda sem cliente associado.');
        return;
      }
      this.abrirDrawerComanda({
        acessar: true,
        idAtendimento: idAt,
        numeroComandaTitulo: numero,
        clienteId: cid,
        cliente,
        opcoesClientes: this.opcoesClientesParaComanda(cid, nomeLista, cliente),
        dataYmd: /^\d{4}-\d{2}-\d{2}$/.test(dataYmd) ? dataYmd : null,
        linhasSnapshot: [],
      });
    };

    if (cid) {
      this.abrindoComanda = true;
      this.api
        .getCliente(cid)
        .pipe(catchError(() => of(null)))
        .subscribe({
          next: (cliente) => {
            this.abrindoComanda = false;
            abrirComCliente(cliente);
          },
          error: () => {
            this.abrindoComanda = false;
            this.toast.show('Não foi possível carregar a comanda.');
          },
        });
      return;
    }

    this.abrindoComanda = true;
    this.api
      .listAgendamentos(undefined, undefined, idAt)
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (items) => {
          this.abrindoComanda = false;
          const l0 = items[0];
          const idCliente = String(l0?.idCliente ?? '').trim();
          if (!l0 || !idCliente) {
            this.toast.show(
              'Não foi possível abrir a comanda. Pedido não encontrado.',
            );
            return;
          }
          const nApi = l0.numeroComanda;
          const numeroResolvido =
            typeof nApi === 'number' && nApi > 0 ? nApi : numero;
          const ymd = String(l0.data ?? dataYmd).trim().slice(0, 10);
          this.api
            .getCliente(idCliente)
            .pipe(catchError(() => of(null)))
            .subscribe({
              next: (cliente) => {
                this.abrirDrawerComanda({
                  acessar: true,
                  idAtendimento: idAt,
                  numeroComandaTitulo: numeroResolvido,
                  clienteId: idCliente,
                  cliente,
                  opcoesClientes: this.opcoesClientesParaComanda(
                    idCliente,
                    String(l0.nomeCliente ?? nomeLista).trim(),
                    cliente,
                  ),
                  dataYmd: /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null,
                  linhasSnapshot: [],
                });
              },
            });
        },
        error: () => {
          this.abrindoComanda = false;
          this.toast.show('Não foi possível carregar a comanda.');
        },
      });
  }

  fecharComandaDrawer(): void {
    if (!this.comandaPainelAberto) return;
    this.comandaDrawerPanelOpen = false;
    if (this.comandaDrawerCloseTimer != null) {
      clearTimeout(this.comandaDrawerCloseTimer);
    }
    this.comandaDrawerCloseTimer = setTimeout(() => {
      this.comandaDrawerCloseTimer = null;
      this.comandaPainelAberto = false;
      this.comandaDrawerContexto = null;
      if (!this.pagarDrawerAberto) {
        this.desbloquearScrollPagina();
      }
    }, DRAWER_ANIM_MS);
  }

  onComandaExcluida(): void {
    this.fecharComandaDrawer();
    this.carregarLinhasDetalhe();
  }

  /** Links «Informações» na sidebar do drawer de comanda (ficha global + aba correta). */
  onAbrirCadastroClienteDaComanda(
    payload: AbrirCadastroClientePayload = {},
  ): void {
    abrirCadastroClienteDesdeSidebarComanda(
      this.cadastroDrawer,
      this.comandaContextoHolder,
      payload,
      (cid) => this.comandaDrawerRef?.recarregarClienteAposSalvarFicha(cid),
    );
  }

  ariaLabelComandaDrawer(): string {
    const n = this.comandaDrawerContexto?.numeroComandaTitulo;
    if (this.comandaDrawerContexto?.idAtendimento?.trim() && n != null && n > 0) {
      return `Visualizando comanda #${n}`;
    }
    return 'Visualizando comanda';
  }

  private abrirDrawerComanda(ctx: ComandaDrawerContextoAgenda): void {
    this.comandaDrawerContexto = ctx;
    this.comandaDrawerPanelOpen = false;
    this.comandaPainelAberto = true;
    if (!this.pageScrollLockAtivo) {
      this.bloquearScrollPagina();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.comandaDrawerPanelOpen = true;
      });
    });
  }

  private opcoesClientesParaComanda(
    cid: string,
    nomeLista: string,
    cliente: Cliente | null,
  ): SaasSelectOption[] {
    const label = cliente?.nome?.trim() || nomeLista || cid || '';
    return [{ value: cid, label }];
  }

  emLayoutLista(): boolean {
    return this.tabAtiva() === 'pagas' || this.vista() === 'detalhe';
  }

  selecionarTab(id: FinComissaoTab): void {
    const anterior = this.tabAtiva();
    this.tabAtiva.set(id);
    this.menuAcoesPagasAberto.set(null);
    if (this.modoSelecao) this.sairModoSelecao();
    if (this.filtrosAbertos) this.fecharFiltros();
    this.sincronizarIndicadorTabs();
    if (id === 'pagas') {
      this.profissionalIdSidebar = null;
      this.sidebarAberto.set(true);
      this.carregarLinhasPagas();
      this.syncShellBottomNavActions();
      return;
    }
    if (anterior === 'pagas') {
      if (
        this.profissionalIdSidebar == null &&
        this.profissionais().length > 0
      ) {
        this.profissionalIdSidebar = this.profissionais()[0].id;
      }
      if (this.vista() === 'detalhe') {
        this.carregarLinhasDetalhe();
      }
    }
    this.syncShellBottomNavActions();
  }

  private sincronizarIndicadorTabs(): void {
    const medir = () => {
      const nav = this.tabsNav?.nativeElement;
      if (!nav) return;
      const alvo = nav.querySelector(
        `.fin-comissoes__tab[data-aba="${this.tabAtiva()}"]`,
      ) as HTMLElement | null;
      if (!alvo) return;
      this.tabsIndicatorLeft = alvo.offsetLeft;
      this.tabsIndicatorWidth = alvo.offsetWidth;
    };
    requestAnimationFrame(medir);
  }

  abrirProfissional(prof: FinComissaoProfissionalUi): void {
    this.profissionalSelecionado.set(prof);
    this.profissionalIdSidebar = prof.id;
    this.selecionados.set(new Set());
    if (this.modoSelecao) this.sairModoSelecao();
    this.sidebarAberto.set(true);
    this.vista.set('detalhe');
    this.carregarLinhasDetalhe();
    this.carregarResumoFolha();
    this.syncShellBottomNavActions();
  }

  onMostrarAnterioresChange(): void {
    if (this.vista() === 'detalhe') this.carregarLinhasDetalhe();
    this.syncShellBottomNavActions();
  }

  onPeriodoAlterado(): void {
    if (this.tabAtiva() === 'pagas') this.carregarLinhasPagas();
    else if (this.vista() === 'detalhe') {
      this.carregarLinhasDetalhe();
      this.carregarResumoFolha();
    }
    this.syncShellBottomNavActions();
  }

  onCriarProfissional(): void {
    this.profissionalDrawer.abrirNovo({
      onSalvo: (p) => {
        this.recarregarProfissionais(p.id);
        this.onProfissionalSidebarChange();
      },
    });
  }

  onProfissionalSidebarChange(): void {
    if (this.tabAtiva() === 'pagas') this.carregarLinhasPagas();
    else if (this.vista() === 'detalhe') {
      this.carregarLinhasDetalhe();
      this.carregarResumoFolha();
    }
    this.syncShellBottomNavActions();
  }

  toggleSidebarFiltros(): void {
    if (this.shellBottomNavEligible) {
      this.onFiltroMobile();
      return;
    }
    this.sidebarAberto.update((aberto) => !aberto);
  }

  filtrosPainelDesktopAberto(): boolean {
    return this.sidebarAberto() && !this.shellBottomNavEligible;
  }

  imprimir(): void {
    window.print();
  }

  abrirPagarDrawer(): void {
    if (!this.podePagar()) return;
    this.pagarDrawerPanelOpen = false;
    this.pagarDrawerAberto = true;
    this.bloquearScrollPagina();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.pagarDrawerPanelOpen = true;
      });
    });
  }

  fecharPagarDrawer(): void {
    if (!this.pagarDrawerAberto) return;
    this.pagarDrawerPanelOpen = false;
    if (this.pagarDrawerCloseTimer != null) {
      clearTimeout(this.pagarDrawerCloseTimer);
    }
    this.pagarDrawerCloseTimer = setTimeout(() => {
      this.pagarDrawerCloseTimer = null;
      this.pagarDrawerAberto = false;
      if (!this.comandaPainelAberto) {
        this.desbloquearScrollPagina();
      }
    }, DRAWER_ANIM_MS);
  }

  onPagarComissoesConfirmado(ev: FinComissaoPagarConfirmPayload): void {
    const profId = this.profissionalIdSidebar;
    if (profId == null || profId <= 0) return;

    const idsPagos = [...this.selecionados()];
    if (idsPagos.length === 0) return;

    this.api
      .pagarComissoes({
        profissional_id: profId,
        data_pagamento: ev.dataPagamentoYmd,
        atendimento_ids: idsPagos,
        pagamentos: ev.pagamentos.map((p) => ({
          metodo: p.metodo,
          valor: p.valor,
        })),
      })
      .pipe(
        catchError((e: unknown) => {
          const msg =
            e instanceof Error
              ? e.message
              : 'Não foi possível registar o pagamento de comissões.';
          this.toast.show(msg);
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.toast.show('Pagamento de comissões realizado com sucesso!');
        this.fecharPagarDrawer();
        this.linhasDetalhe.update((linhas) =>
          linhas.filter((row) => !idsPagos.includes(row.id)),
        );
        this.selecionados.set(new Set());
        if (this.modoSelecao) this.sairModoSelecao();
        else this.syncShellBottomNavActions();
        this.carregarLinhasPagas();
        this.carregarResumoFolha();
      });
  }

  alternarMenuAcoesPagas(movimentacaoId: number, ev: Event): void {
    ev.stopPropagation();
    this.menuAcoesPagasAberto.update((atual) =>
      atual === movimentacaoId ? null : movimentacaoId,
    );
  }

  fecharMenuAcoesPagas(): void {
    this.menuAcoesPagasAberto.set(null);
  }

  estornarPagamentoComissao(row: FinComissaoPagaLinhaUi): void {
    this.menuAcoesPagasAberto.set(null);
    if (
      !window.confirm(
        'Estornar este pagamento de comissões? As linhas voltarão à aba Detalhadas.',
      )
    ) {
      return;
    }
    this.api.estornarComissaoMovimentacao(row.movimentacaoId).subscribe({
      next: () => {
        this.toast.show('Pagamento de comissões estornado.');
        this.carregarLinhasPagas();
        if (this.vista() === 'detalhe' && this.tabAtiva() === 'detalhadas') {
          this.carregarLinhasDetalhe();
          this.carregarResumoFolha();
        }
      },
      error: (e: unknown) => {
        const msg =
          e instanceof Error
            ? e.message
            : 'Não foi possível estornar o pagamento.';
        this.toast.show(msg);
      },
    });
  }

  private bloquearScrollPagina(): void {
    if (this.pageScrollLockAtivo) return;
    this.bodyScrollPreDrawer = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${this.bodyScrollPreDrawer}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    this.pageScrollLockAtivo = true;
  }

  private desbloquearScrollPagina(): void {
    if (!this.pageScrollLockAtivo) return;
    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    this.pageScrollLockAtivo = false;
    window.scrollTo(0, this.bodyScrollPreDrawer);
  }

  atualizarLista(): void {
    if (this.tabAtiva() === 'pagas') this.carregarLinhasPagas();
    else this.carregarLinhasDetalhe();
  }

  private carregarLinhasPagas(): void {
    const di = this.periodoInicio.trim();
    const df = this.periodoFim.trim();
    if (!di || !df) {
      this.linhasPagas.set([]);
      return;
    }

    const profId = this.profissionalIdSidebar;
    const seq = ++this.carregarPagasSeq;
    this.linhasPagas.set([]);
    this.carregando.set(true);
    this.erroCarregamento.set('');

    this.api
      .listComissoesPagas({
        dataInicio: di,
        dataFim: df,
        profissionalId: profId != null && profId > 0 ? profId : null,
      })
      .pipe(
        catchError((e: Error) => {
          this.erroCarregamento.set(
            e.message ||
              'Não foi possível carregar as comissões pagas. Confirme a API.',
          );
          return of([] as FinComissaoPagaItem[]);
        }),
      )
      .subscribe((items) => {
        if (seq !== this.carregarPagasSeq) return;
        const linhas = items.map((r) => this.mapLinhaPagaApi(r));
        this.linhasPagas.set(linhas);
        this.carregando.set(false);
      });
  }

  private mapLinhaPagaApi(r: FinComissaoPagaItem): FinComissaoPagaLinhaUi {
    return {
      movimentacaoId: r.movimentacao_id,
      dataYmd: r.data_ymd,
      pagamentoYmd: r.pagamento_ymd,
      profissionalNome: r.profissional_nome,
      usuarioNome: r.usuario_nome,
      comissoes: r.comissoes,
      vales: r.vales,
      bonificacoes: r.bonificacoes,
      valorPago: r.valor_pago,
    };
  }

  /** Linhas vêm de `GET /api/financeiro/comissoes/detalhadas` → tabela `atendimentos`. */
  private carregarLinhasDetalhe(): void {
    const profId = this.profissionalIdSidebar;
    if (profId == null || profId <= 0) {
      this.linhasDetalhe.set([]);
      this.carregando.set(false);
      return;
    }
    const di = this.periodoInicio.trim();
    const df = this.periodoFim.trim();
    if (!di || !df) {
      this.linhasDetalhe.set([]);
      return;
    }

    const seq = ++this.carregarLinhasSeq;
    this.linhasDetalhe.set([]);
    this.selecionados.set(new Set());
    this.carregando.set(true);
    this.erroCarregamento.set('');
    this.api
      .listComissoesDetalhadas({
        dataInicio: di,
        dataFim: df,
        profissionalId: profId,
        mostrarAnteriores: this.mostrarAnteriores,
      })
      .pipe(
        catchError((e: Error) => {
          this.erroCarregamento.set(
            e.message ||
              'Não foi possível carregar as comissões. Confirme a API.',
          );
          return of([] as FinComissaoDetalheItem[]);
        }),
      )
      .subscribe((items) => {
        if (seq !== this.carregarLinhasSeq) return;
        this.linhasDetalhe.set(items.map((r) => this.mapLinhaApi(r)));
        this.selecionados.set(new Set());
        this.carregando.set(false);
        if (this.modoSelecao) this.syncShellBottomNavActions();
      });
  }

  private carregarResumoFolha(): void {
    if (this.tabAtiva() !== 'detalhadas' || this.vista() !== 'detalhe') {
      this.resumoFolha.set(null);
      return;
    }
    const profId = this.profissionalIdSidebar;
    const di = this.periodoInicio.trim();
    const df = this.periodoFim.trim();
    if (profId == null || profId <= 0 || !di || !df) {
      this.resumoFolha.set(null);
      return;
    }

    this.api
      .listComissoesResumidas({
        dataInicio: di,
        dataFim: df,
        profissionalId: profId,
      })
      .pipe(catchError(() => of([] as FinComissaoResumidaItem[])))
      .subscribe((items) => {
        let totalComissao = 0;
        let totalPago = 0;
        let saldo = 0;
        for (const row of items) {
          totalComissao += row.total_comissao;
          totalPago += row.total_pago;
          saldo += row.saldo;
        }
        this.resumoFolha.set({
          totalComissao: Math.round(totalComissao * 100) / 100,
          totalPago: Math.round(totalPago * 100) / 100,
          saldo: Math.round(saldo * 100) / 100,
        });
      });
  }

  private mapLinhaApi(r: FinComissaoDetalheItem): FinComissaoLinhaUi {
    const nComanda = r.numero_comanda;
    return {
      id: r.id,
      dataYmd: r.data_ymd,
      clienteNome: r.cliente_nome,
      clienteNumero: nComanda ?? 0,
      idAtendimento: r.id_atendimento,
      idCliente: r.id_cliente,
      numeroComanda: nComanda,
      servico: r.servico,
      quantidade: r.quantidade,
      valor: r.valor,
      taxaAcumulada: null,
      comissaoPct: r.comissao_pct ?? 0,
      comissaoTipo: r.comissao_tipo,
      descontoAuxiliares: null,
      disponivel: r.disponivel,
    };
  }

  /** Padrão do filtro: 1º dia do mês atual → hoje. */
  private periodoPadraoMesAtualAteHoje(): { inicio: string; fim: string } {
    const fim = new Date();
    const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
    return { inicio: this.dateParaYmd(inicio), fim: this.dateParaYmd(fim) };
  }

  private dateParaYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  voltarFiltros(): void {
    if (this.modoSelecao) this.sairModoSelecao();
    if (this.filtrosAbertos) this.fecharFiltros();
    this.vista.set('filtros');
    this.profissionalSelecionado.set(null);
    this.selecionados.set(new Set());
    this.syncShellBottomNavActions();
  }

  linhaSelecionada(id: number): boolean {
    return this.selecionados().has(id);
  }

  todosSelecionados(): boolean {
    return this.todosFiltradosSelecionados();
  }

  /** No mobile MLP, checks só no modo seleção; desktop sempre. */
  mostraSelecaoLinha(): boolean {
    return !this.shellBottomNavEligible || this.modoSelecao;
  }

  toggleLinha(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.selecionados.update((atual) => {
      const next = new Set(atual);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    if (this.modoSelecao) this.syncShellBottomNavActions();
  }

  toggleTodos(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) {
      this.selecionados.set(new Set(this.linhasDetalhe().map((r) => r.id)));
    } else {
      this.selecionados.set(new Set());
    }
    if (this.modoSelecao) this.syncShellBottomNavActions();
  }

  onMobileCardToggleSelecao(row: FinComissaoLinhaUi, ev: Event): void {
    if (!this.shellBottomNavEligible || !this.modoSelecao) return;
    const target = ev.target as HTMLElement | null;
    if (target?.closest('button, a, input, label')) return;
    const on = !this.linhaSelecionada(row.id);
    this.selecionados.update((atual) => {
      const next = new Set(atual);
      if (on) next.add(row.id);
      else next.delete(row.id);
      return next;
    });
    this.syncShellBottomNavActions();
  }

  private ymdParaDdMm(ymd: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim().slice(0, 10));
    if (!m) return ymd;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
}
