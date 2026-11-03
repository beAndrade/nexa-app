import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { mediaQueryMin } from '../../../../styles/breakpoints';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import { FinCadastrosCategoriasTabComponent } from './fin-cadastros-categorias-tab.component';
import { FinCadastrosFormasTabComponent } from './fin-cadastros-formas-tab.component';
import { FinanceiroBloquearBtnComponent } from '../../../../shared/financeiro-bloquear-btn/financeiro-bloquear-btn.component';

type CadastroTab = 'categorias' | 'formas';

type ChipFiltroMobile = { id: 'status'; label: string };

const FIN_CADASTROS_BOTTOM_NAV_OWNER = 'financeiro-cadastros';

@Component({
  selector: 'app-financeiro-cadastros',
  standalone: true,
  imports: [
    FormsModule,
    FinCadastrosCategoriasTabComponent,
    FinCadastrosFormasTabComponent,
    FinanceiroBloquearBtnComponent,
    MobileFiltrosSheetComponent,
  ],
  templateUrl: './financeiro-cadastros.component.html',
  styleUrl: './financeiro-cadastros.component.scss',
})
export class FinanceiroCadastrosComponent
  implements AfterViewInit, OnDestroy
{
  private readonly shellUi = inject(AppShellUiService);

  @ViewChild(FinCadastrosCategoriasTabComponent)
  private categoriasTab?: FinCadastrosCategoriasTabComponent;

  @ViewChild(FinCadastrosFormasTabComponent)
  private formasTab?: FinCadastrosFormasTabComponent;

  @ViewChild('tabsNav', { read: ElementRef })
  private tabsNav?: ElementRef<HTMLElement>;

  readonly tabAtiva = signal<CadastroTab>('formas');
  tabsIndicatorLeft = 0;
  tabsIndicatorWidth = 0;

  readonly tabs: { id: CadastroTab; label: string }[] = [
    { id: 'formas', label: 'Formas de pagamento' },
    { id: 'categorias', label: 'Categorias' },
  ];

  busca = '';
  buscaAberta = false;
  filtrosAbertos = false;
  filtroAtivada = true;
  filtroDesativada = false;

  /** ≤767px — elegível a bottom nav MLP. */
  shellBottomNavEligible = false;
  private shellDesktopMq: MediaQueryList | null = null;
  private readonly onShellViewportChange = (): void => {
    this.shellBottomNavEligible = !(this.shellDesktopMq?.matches ?? true);
    if (!this.shellBottomNavEligible && this.filtrosAbertos) {
      this.filtrosAbertos = false;
    }
    this.syncShellBottomNavActions();
  };

  ngAfterViewInit(): void {
    this.sincronizarIndicadorTabs();
    this.setupShellBottomNav();
  }

  ngOnDestroy(): void {
    this.shellDesktopMq?.removeEventListener(
      'change',
      this.onShellViewportChange,
    );
    this.shellDesktopMq = null;
    this.shellUi.clearMobileBottomNavActions(FIN_CADASTROS_BOTTOM_NAV_OWNER);
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    this.onShellViewportChange();
    this.shellDesktopMq.addEventListener('change', this.onShellViewportChange);
  }

  /**
   * Formas: Filtro · Novo (busca no header; seleção desktop sem bulk → sem Selecionar).
   * Categorias: só Novo (sem filtros de status na aba).
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(FIN_CADASTROS_BOTTOM_NAV_OWNER);
      return;
    }
    if (this.tabAtiva() === 'formas') {
      this.shellUi.setMobileBottomNavActions(FIN_CADASTROS_BOTTOM_NAV_OWNER, [
        {
          id: 'filtro',
          label: 'Filtro',
          ariaLabel: this.filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
          icon: 'filter',
          active: this.filtrosAbertos,
          warn: this.filtroStatusAtivo && !this.filtrosAbertos,
          onClick: () => this.onFiltroMobile(),
        },
        {
          id: 'novo',
          label: 'Novo',
          ariaLabel: 'Nova forma de pagamento',
          icon: 'plus',
          accent: true,
          onClick: () => this.abrirNovo(),
        },
      ]);
      return;
    }
    this.shellUi.setMobileBottomNavActions(FIN_CADASTROS_BOTTOM_NAV_OWNER, [
      {
        id: 'novo',
        label: 'Novo',
        ariaLabel: 'Nova categoria',
        icon: 'plus',
        accent: true,
        onClick: () => this.abrirNovo(),
      },
    ]);
  }

  selecionarTab(id: CadastroTab): void {
    if (id !== 'formas') {
      this.filtrosAbertos = false;
    }
    this.tabAtiva.set(id);
    this.sincronizarIndicadorTabs();
    this.syncShellBottomNavActions();
  }

  private sincronizarIndicadorTabs(): void {
    const medir = () => {
      const nav = this.tabsNav?.nativeElement;
      if (!nav) return;
      const alvo = nav.querySelector(
        `.fin-cadastros__tab[data-aba="${this.tabAtiva()}"]`,
      ) as HTMLElement | null;
      if (!alvo) return;
      this.tabsIndicatorLeft = alvo.offsetLeft;
      this.tabsIndicatorWidth = alvo.offsetWidth;
    };
    requestAnimationFrame(medir);
  }

  get filtroStatusAtivo(): boolean {
    return !this.filtroAtivada || this.filtroDesativada;
  }

  get buscaPlaceholder(): string {
    if (this.shellBottomNavEligible) return 'Digite para buscar';
    return this.buscaAberta ? 'Procure por nome...' : '';
  }

  chipsFiltrosMobile(): ChipFiltroMobile[] {
    if (!this.filtroStatusAtivo) return [];
    if (this.filtroAtivada && this.filtroDesativada) {
      return [{ id: 'status', label: 'Status: Ativada e Desativada' }];
    }
    if (!this.filtroAtivada && this.filtroDesativada) {
      return [{ id: 'status', label: 'Status: Desativada' }];
    }
    return [];
  }

  removerChipFiltro(id: ChipFiltroMobile['id'], ev?: Event): void {
    ev?.stopPropagation();
    if (id !== 'status') return;
    this.filtroAtivada = true;
    this.filtroDesativada = false;
    this.aplicarFiltroStatus();
    this.syncShellBottomNavActions();
  }

  onBuscaWrapClick(): void {
    if (!this.buscaAberta) {
      this.abrirPainelBusca();
    }
  }

  fecharPainelBusca(): void {
    this.buscaAberta = false;
  }

  private abrirPainelBusca(): void {
    this.buscaAberta = true;
    queueMicrotask(() => {
      document.getElementById('fin-cad-busca')?.focus();
    });
  }

  onBuscaSubmit(): void {
    const el = document.getElementById('fin-cad-busca');
    if (el instanceof HTMLInputElement) {
      el.blur();
    }
  }

  onBuscaEnter(ev: Event): void {
    ev.preventDefault();
    this.onBuscaSubmit();
  }

  toggleFiltros(ev?: Event): void {
    ev?.stopPropagation();
    this.filtrosAbertos = !this.filtrosAbertos;
    this.syncShellBottomNavActions();
  }

  onFiltroMobile(): void {
    this.filtrosAbertos = !this.filtrosAbertos;
    this.syncShellBottomNavActions();
  }

  fecharFiltros(): void {
    this.filtrosAbertos = false;
    this.syncShellBottomNavActions();
  }

  toggleFiltroAtivada(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (!checked && !this.filtroDesativada) {
      (ev.target as HTMLInputElement).checked = true;
      return;
    }
    this.filtroAtivada = checked;
    this.aplicarFiltroStatus();
    this.syncShellBottomNavActions();
  }

  toggleFiltroDesativada(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (!checked && !this.filtroAtivada) {
      (ev.target as HTMLInputElement).checked = true;
      return;
    }
    this.filtroDesativada = checked;
    this.aplicarFiltroStatus();
    this.syncShellBottomNavActions();
  }

  private aplicarFiltroStatus(): void {
    this.formasTab?.carregar();
  }

  abrirNovo(): void {
    this.tabAtivo()?.abrirNovo();
  }

  tabAtivo():
    | FinCadastrosCategoriasTabComponent
    | FinCadastrosFormasTabComponent
    | undefined {
    return this.tabAtiva() === 'categorias'
      ? this.categoriasTab
      : this.formasTab;
  }

  labelBuscaInput(): string {
    return this.tabAtiva() === 'categorias'
      ? 'Buscar categorias'
      : 'Buscar formas de pagamento';
  }

  get filtrosAsideAbertos(): boolean {
    return (
      this.filtrosAbertos &&
      this.tabAtiva() === 'formas' &&
      !this.shellBottomNavEligible
    );
  }

  get filtrosSheetAberto(): boolean {
    return (
      this.shellBottomNavEligible &&
      this.filtrosAbertos &&
      this.tabAtiva() === 'formas'
    );
  }

  @HostListener('document:click', ['$event'])
  fecharPainelPorClickFora(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (this.buscaAberta && !t?.closest?.('.list-head__busca-wrap')) {
      this.fecharPainelBusca();
    }
    if (
      this.filtrosAbertos &&
      !this.shellBottomNavEligible &&
      !t?.closest?.('.fin-transacoes-filtros') &&
      !t?.closest?.('.list-head__toolbar-btn')
    ) {
      this.fecharFiltros();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  fecharPainelPorEscape(ev: KeyboardEvent): void {
    if (this.categoriasTab?.drawerAbertoShell) {
      ev.preventDefault();
      this.categoriasTab.fecharDrawer();
      return;
    }
    if (this.formasTab?.drawerAbertoShell) {
      ev.preventDefault();
      this.formasTab.fecharDrawer();
      return;
    }
    if (this.filtrosAbertos) {
      ev.preventDefault();
      this.fecharFiltros();
      return;
    }
    if (!this.buscaAberta) return;
    ev.preventDefault();
    this.fecharPainelBusca();
  }
}
