import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
} from 'rxjs';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import {
  AvaliacaoSolicitacaoLista,
  AvaliacaoSolicitacoesResumo,
  AvaliacaoSolicitacoesService,
  type ListarAvaliacaoSolicitacoesParams,
} from '../../../../core/services/avaliacoes/avaliacao-solicitacoes.service';
import {
  AppShellUiService,
  type MobileBottomNavAction,
} from '../../../../core/services/app-shell-ui.service';
import { extractApiErrorMessage } from '../../../../core/utils/api-error-message';
import { formatarTelefoneBrDeValor } from '../../../../core/utils/telefone-br';
import { mediaQueryMin } from '../../../../styles/breakpoints';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import { SaasSelectComponent } from '../../../../shared/components/saas-select/saas-select.component';
import { ClienteDrawerPeriodoFiltroComponent } from '../../../../shared/cliente-drawer-periodo-filtro/cliente-drawer-periodo-filtro.component';
import {
  AVALIACOES_PERIODO_PRESET_DEFAULT,
  AVALIACOES_PERIODO_PRESET_OPTIONS,
  periodoPadraoAvaliacoes,
  resolverAvaliacoesPeriodo,
  type AvaliacoesPeriodoPresetId,
} from '../../avaliacoes-periodo.util';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 450;
const AVALIACOES_BOTTOM_NAV_OWNER = 'avaliacoes';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'whatsapp_aberto', label: 'WhatsApp aberto' },
];

@Component({
  selector: 'app-avaliacoes',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    TableEmptyComponent,
    SaasSelectComponent,
    MobileFiltrosSheetComponent,
    ClienteDrawerPeriodoFiltroComponent,
  ],
  templateUrl: './avaliacoes.component.html',
  styleUrl: './avaliacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvaliacoesComponent {
  private readonly api = inject(AvaliacaoSolicitacoesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly shellUi = inject(AppShellUiService);
  private readonly searchInput$ = new Subject<string>();

  readonly periodoPresetOptions = AVALIACOES_PERIODO_PRESET_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  readonly periodoPresetControl = new FormControl<AvaliacoesPeriodoPresetId>(
    AVALIACOES_PERIODO_PRESET_DEFAULT,
    { nonNullable: true },
  );
  readonly statusControl = new FormControl<string>('', { nonNullable: true });

  readonly carregandoInicial = signal(true);
  readonly carregandoLista = signal(false);
  readonly erro = signal<string | null>(null);
  readonly resumo = signal<AvaliacaoSolicitacoesResumo | null>(null);
  readonly items = signal<AvaliacaoSolicitacaoLista[]>([]);

  readonly searchDraft = signal('');
  readonly searchAplicada = signal('');
  readonly periodoPresetId = signal<AvaliacoesPeriodoPresetId>(
    AVALIACOES_PERIODO_PRESET_DEFAULT,
  );
  periodoInicioYmd = '';
  periodoFimYmd = '';

  readonly page = signal(1);
  readonly shellMobile = signal(false);
  readonly filtrosAbertos = signal(false);
  readonly buscaAberta = signal(false);
  readonly pulsoToolbarBusca = signal(false);
  readonly pulsoToolbarFiltro = signal(false);
  private tPulsoBusca: ReturnType<typeof setTimeout> | null = null;
  private tPulsoFiltro: ReturnType<typeof setTimeout> | null = null;
  private readonly duracaoPulsoToolbarMs = 600;

  readonly temFiltroAtivo = computed(() => this.calcularFiltroAtivo());

  readonly mostrarEmptyGlobal = computed(() => {
    const r = this.resumo();
    if (!r || r.total > 0) return false;
    return !this.calcularFiltroAtivo();
  });

  readonly mostrarEmptyFiltrado = computed(() => {
    if (this.items().length > 0) return false;
    if (this.mostrarEmptyGlobal()) return false;
    return this.calcularFiltroAtivo() || (this.resumo()?.total ?? 0) > 0;
  });

  constructor() {
    const padrao = periodoPadraoAvaliacoes();
    this.periodoInicioYmd = padrao.dataInicio;
    this.periodoFimYmd = padrao.dataFim;

    this.setupShellMobile();
    this.setupSearchDebounce();
    this.setupSelectHandlers();
    // MLP: bar Buscar · Filtros; reage a shellMobile / busca / sheet / warn.
    effect(() => this.syncShellBottomNavActions());
    this.carregar(true);
  }

  carregar(inicial = false): void {
    if (inicial) {
      this.carregandoInicial.set(true);
    } else {
      this.carregandoLista.set(true);
    }
    this.erro.set(null);

    this.api
      .listar(this.montarParams())
      .pipe(
        finalize(() => {
          this.carregandoInicial.set(false);
          this.carregandoLista.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.resumo.set(data.resumo);
          this.items.set(data.items);
        },
        error: (err: unknown) => {
          this.erro.set(
            extractApiErrorMessage(err) ||
              'Não foi possível carregar as solicitações de avaliação.',
          );
        },
      });
  }

  montarParams(): ListarAvaliacaoSolicitacoesParams {
    const params: ListarAvaliacaoSolicitacoesParams = {
      page: this.page(),
      pageSize: PAGE_SIZE,
    };
    const q = this.searchAplicada().trim();
    if (q) params.search = q;
    const st = this.statusControl.value.trim();
    if (st) params.status = st;
    const periodo = resolverAvaliacoesPeriodo(
      this.periodoPresetId(),
      this.periodoInicioYmd,
      this.periodoFimYmd,
    );
    if (periodo) {
      params.dataInicio = periodo.dataInicio;
      params.dataFim = periodo.dataFim;
    }
    return params;
  }

  onSearchInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.searchDraft.set(v);
    this.searchInput$.next(v);
  }

  onPeriodoPresetChange(preset: AvaliacoesPeriodoPresetId): void {
    this.periodoPresetId.set(preset);
    if (preset !== 'personalizado') {
      const resolved = resolverAvaliacoesPeriodo(preset);
      if (resolved) {
        this.periodoInicioYmd = resolved.dataInicio;
        this.periodoFimYmd = resolved.dataFim;
      }
      this.page.set(1);
      this.carregar();
    }
  }

  onPeriodoPersonalizadoAlterado(): void {
    if (this.periodoPresetId() !== 'personalizado') return;
    this.page.set(1);
    this.carregar();
  }

  onStatusChange(): void {
    this.page.set(1);
    this.carregar();
  }

  limparFiltros(): void {
    const padrao = periodoPadraoAvaliacoes();
    this.searchDraft.set('');
    this.searchAplicada.set('');
    this.periodoPresetId.set(padrao.preset);
    this.periodoInicioYmd = padrao.dataInicio;
    this.periodoFimYmd = padrao.dataFim;
    this.periodoPresetControl.setValue(padrao.preset, { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.page.set(1);
    this.carregar();
  }

  fecharFiltros(): void {
    if (!this.filtrosAbertos()) return;
    this.filtrosAbertos.set(false);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeFiltros(ev: KeyboardEvent): void {
    if (!this.shellMobile() || !this.filtrosAbertos()) return;
    if (
      document.querySelector(
        '.periodo-filtro__panel--sheet.periodo-filtro__panel--open',
      )
    ) {
      return;
    }
    ev.preventDefault();
    this.fecharFiltros();
  }

  onBuscaWrapClick(): void {
    this.abrirBuscaComFoco();
  }

  /** Bottom nav · Buscar: abre/fecha o mesmo campo (sem duplicar no header fechado). */
  private onBuscaMobile(): void {
    if (this.filtrosAbertos()) this.fecharFiltros();
    if (this.buscaAberta()) {
      this.fecharPainelBusca();
      return;
    }
    this.abrirBuscaComFoco();
  }

  private onFiltroMobile(): void {
    if (this.buscaAberta()) this.fecharPainelBusca();
    this.dispararPulsoToolbar('filtro');
    this.filtrosAbertos.update((v) => !v);
  }

  private abrirBuscaComFoco(): void {
    if (!this.buscaAberta()) {
      this.dispararPulsoToolbar('busca');
      this.buscaAberta.set(true);
      // OnPush: aplicar --search-open (visibility/pointer-events) antes do focus.
      this.cdr.detectChanges();
    }
    this.focarInputBusca();
  }

  private focarInputBusca(): void {
    const tryFocus = (): boolean => {
      const input = document.getElementById(
        'avaliacoes-busca-input',
      ) as HTMLInputElement | null;
      if (!input) return false;
      input.focus({ preventScroll: true });
      return document.activeElement === input;
    };

    if (tryFocus()) return;
    requestAnimationFrame(() => {
      if (tryFocus()) return;
      setTimeout(() => tryFocus(), 0);
    });
  }

  fecharPainelBusca(): void {
    if (!this.buscaAberta()) return;
    this.buscaAberta.set(false);
  }

  selecionarPresetMobile(preset: string): void {
    this.periodoPresetControl.setValue(preset as AvaliacoesPeriodoPresetId, {
      emitEvent: true,
    });
  }

  selecionarStatusMobile(status: string): void {
    this.statusControl.setValue(status, { emitEvent: true });
  }

  rotuloAtendimento(item: AvaliacaoSolicitacaoLista): string {
    if (item.numero_comanda != null) return `#${item.numero_comanda}`;
    const id = item.id_atendimento?.trim();
    return id || '—';
  }

  rotuloCliente(item: AvaliacaoSolicitacaoLista): string {
    const nome = item.cliente_nome?.trim();
    return nome || '—';
  }

  rotuloTelefone(telefone: string): string {
    return formatarTelefoneBrDeValor(telefone) || telefone;
  }

  rotuloStatus(status: string): string {
    if (status === 'whatsapp_aberto') return 'WhatsApp aberto';
    return status;
  }

  rotuloData(iso: string | null | undefined): string {
    if (!iso) return 'Nenhuma';
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return 'Nenhuma';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (this.buscaAberta() && !t?.closest?.('.list-head__busca-wrap')) {
      this.fecharPainelBusca();
    }
  }

  private calcularFiltroAtivo(): boolean {
    if (this.searchAplicada().trim()) return true;
    if (this.statusControl.value.trim()) return true;
    if (this.periodoPresetId() !== AVALIACOES_PERIODO_PRESET_DEFAULT) {
      return true;
    }
    const padrao = periodoPadraoAvaliacoes();
    const ini = this.periodoInicioYmd.trim().slice(0, 10);
    const fim = this.periodoFimYmd.trim().slice(0, 10);
    return ini !== padrao.dataInicio || fim !== padrao.dataFim;
  }

  private setupSearchDebounce(): void {
    this.searchInput$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((q) => {
        this.searchAplicada.set(q.trim());
        this.page.set(1);
        this.carregar();
      });
  }

  private setupSelectHandlers(): void {
    this.periodoPresetControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.onPeriodoPresetChange(v));

    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onStatusChange());
  }

  private setupShellMobile(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(mediaQueryMin('shellMobile'));
    const apply = (): void => {
      const mobile = !mq.matches;
      this.shellMobile.set(mobile);
      if (!mobile) {
        this.filtrosAbertos.set(false);
        this.buscaAberta.set(false);
      }
    };
    apply();
    mq.addEventListener('change', apply);
    this.destroyRef.onDestroy(() => {
      mq.removeEventListener('change', apply);
      this.shellUi.clearMobileBottomNavActions(AVALIACOES_BOTTOM_NAV_OWNER);
    });
  }

  /**
   * ≤767: Menu + Buscar · Filtros (exceção MLP sem Criar/Selecionar).
   * `active` no sheet/busca abertos; `warn` com filtro ≠ default e sheet fechado.
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellMobile()) {
      this.shellUi.clearMobileBottomNavActions(AVALIACOES_BOTTOM_NAV_OWNER);
      return;
    }
    const buscaAberta = this.buscaAberta();
    const filtrosAbertos = this.filtrosAbertos();
    const actions: MobileBottomNavAction[] = [
      {
        id: 'buscar',
        label: 'Buscar',
        ariaLabel: buscaAberta ? 'Fechar busca' : 'Buscar solicitações',
        icon: 'search',
        active: buscaAberta,
        onClick: () => this.onBuscaMobile(),
      },
      {
        id: 'filtro',
        label: 'Filtros',
        ariaLabel: filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
        icon: 'filter',
        active: filtrosAbertos,
        warn: this.temFiltroAtivo() && !filtrosAbertos,
        onClick: () => this.onFiltroMobile(),
      },
    ];
    this.shellUi.setMobileBottomNavActions(AVALIACOES_BOTTOM_NAV_OWNER, actions);
  }

  private dispararPulsoToolbar(which: 'busca' | 'filtro'): void {
    if (which === 'busca') {
      window.clearTimeout(this.tPulsoBusca ?? undefined);
      this.pulsoToolbarBusca.set(false);
      queueMicrotask(() => {
        this.pulsoToolbarBusca.set(true);
        this.tPulsoBusca = window.setTimeout(() => {
          this.pulsoToolbarBusca.set(false);
        }, this.duracaoPulsoToolbarMs);
      });
      return;
    }
    window.clearTimeout(this.tPulsoFiltro ?? undefined);
    this.pulsoToolbarFiltro.set(false);
    queueMicrotask(() => {
      this.pulsoToolbarFiltro.set(true);
      this.tPulsoFiltro = window.setTimeout(() => {
        this.pulsoToolbarFiltro.set(false);
      }, this.duracaoPulsoToolbarMs);
    });
  }
}
