import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { AppToastService } from '../../../../shared/app-toast/app-toast.service';
import { UiTipTriggerComponent } from '../../../../shared/ui-tip-trigger/ui-tip-trigger.component';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import { tooltipOrdenacaoProximoClique } from '../../../../shared/table-sort-tip.util';
import { FlipDropdownPanelDirective } from '../../../../shared/flip-dropdown-panel/flip-dropdown-panel.directive';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import {
  MobileListActionMenuItem,
  MobileListActionsMenuComponent,
} from '../../../../shared/components/mobile-list-actions-menu/mobile-list-actions-menu.component';
import {
  areAllSelected,
  buildSelectionBottomNavActions,
  selectAllIds,
  toggleId,
} from '../../../../shared/mobile-list-selection/mobile-list-selection';
import { mediaQueryMin } from '../../../../styles/breakpoints';

export interface MarcaListaItem {
  id: number;
  nome: string;
  ativo: boolean;
  qtdItens: number;
}

const DRAWER_ANIM_MS = 430;
const MARCA_SALVA_TOAST_MSG = 'Marca salva com sucesso!';
const MARCA_EXCLUIDA_TOAST_MSG = 'Marca excluída com sucesso!';
const MARCAS_BOTTOM_NAV_OWNER = 'marcas';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [
    FlipDropdownPanelDirective,
    TableEmptyComponent,
    FormsModule,
    UiTipTriggerComponent,
    MobileFiltrosSheetComponent,
    MobileListActionsMenuComponent,
  ],
  templateUrl: './marcas.component.html',
  styleUrl: './marcas.component.scss',
})
export class MarcasComponent implements OnInit, OnDestroy {
  private readonly api = inject(SheetsApiService);
  private readonly toast = inject(AppToastService);
  private readonly shellUi = inject(AppShellUiService);

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
  };

  carregando = false;
  erro = '';
  itens: MarcaListaItem[] = [];

  busca = '';
  buscaAberta = false;
  filtrosAbertos = false;
  pulsoToolbarBusca = false;
  pulsoToolbarFiltro = false;
  private readonly duracaoPulsoToolbarMs = 600;
  private tPulsoFiltro = 0;
  filtroAtivas = true;
  filtroInativas = false;

  pagina = 1;
  porPagina = 20;
  readonly opcoesPorPagina = [10, 20, 50];
  perPageMenuAberto = false;
  selecionados = new Set<number>();

  /** ≤767px: bottom nav contextual (Filtro · Selecionar · Novo). */
  shellBottomNavEligible = false;
  modoSelecao = false;
  acoesMenuAberto = false;
  selecionarTudoBusy = false;
  private selecionarTudoFeedbackTimer: ReturnType<typeof setTimeout> | null =
    null;

  ordenacaoColuna: 'nome' = 'nome';
  ordenacaoDir: 'asc' | 'desc' = 'asc';

  cadastroAberto = false;
  cadastroPanelOpen = false;
  cadastroNome = '';
  cadastroAtivo = true;
  cadastroSalvando = false;
  cadastroNomeErro = false;
  /** `null` = nova; item = edição. */
  cadastroEditando: MarcaListaItem | null = null;
  private cadastroCloseTimer: ReturnType<typeof setTimeout> | null = null;

  exclusaoModalItem: MarcaListaItem | null = null;
  exclusaoModalSalvando = false;

  get cadastroTitulo(): string {
    return this.cadastroEditando ? 'Editar marca' : 'Nova marca';
  }

  ngOnInit(): void {
    this.setupShellBottomNav();
    this.carregar();
  }

  ngOnDestroy(): void {
    if (this.cadastroCloseTimer != null) {
      clearTimeout(this.cadastroCloseTimer);
    }
    this.limparFeedbackSelecionarTudo();
    window.clearTimeout(this.tPulsoFiltro);
    this.shellDesktopMq?.removeEventListener(
      'change',
      this.onShellViewportChange,
    );
    this.shellDesktopMq = null;
    this.shellUi.clearMobileBottomNavActions(MARCAS_BOTTOM_NAV_OWNER);
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    this.onShellViewportChange();
    this.shellDesktopMq.addEventListener('change', this.onShellViewportChange);
  }

  /**
   * Menu no shell. Normal: Filtro · Selecionar · Novo.
   * Em seleção: Cancelar · Selecionar tudo · Ações (editar/excluir unitários).
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(MARCAS_BOTTOM_NAV_OWNER);
      return;
    }
    if (this.modoSelecao) {
      const actions = buildSelectionBottomNavActions(
        this.todosFiltradosSelecionados(),
        {
          onCancel: () => this.sairModoSelecao(),
          onSelectAll: () => this.selecionarTodosMobile(),
          onActions: () => this.onAcoesSelecao(),
          selectAllAriaLabel: 'Selecionar todas as marcas filtradas',
        },
      );
      const acoes = actions.find((action) => action.id === 'acoes');
      if (acoes) acoes.active = this.acoesMenuAberto;
      const selecionarTudo = actions.find(
        (action) => action.id === 'selecionar-tudo',
      );
      if (selecionarTudo) selecionarTudo.busy = this.selecionarTudoBusy;
      this.shellUi.setMobileBottomNavActions(MARCAS_BOTTOM_NAV_OWNER, actions);
      return;
    }
    this.shellUi.setMobileBottomNavActions(MARCAS_BOTTOM_NAV_OWNER, [
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
        ariaLabel: 'Selecionar marcas',
        icon: 'check',
        active: false,
        onClick: () => this.entrarModoSelecao(),
      },
      {
        id: 'novo',
        label: 'Novo',
        ariaLabel: 'Nova marca',
        icon: 'plus',
        accent: true,
        onClick: () => this.onNovo(),
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
      this.filtrados().map((m) => m.id),
      this.selecionados,
    );
  }

  selecionarTodosMobile(): void {
    this.selecionados = selectAllIds(
      this.selecionados,
      this.filtrados().map((m) => m.id),
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
        ariaLabel: 'Editar marca selecionada',
        disabled: !um,
      },
      {
        id: 'excluir',
        label: 'Excluir',
        ariaLabel: 'Excluir marca selecionada',
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
    const marca = this.itens.find((m) => m.id === id);
    if (!marca) return;
    if (item.id === 'editar') {
      this.sairModoSelecao();
      this.onEditar(marca);
      return;
    }
    if (item.id === 'excluir') this.onExcluir(marca);
  }

  onMobileCardClick(m: MarcaListaItem, ev: Event): void {
    if (this.modoSelecao) {
      ev.preventDefault();
      ev.stopPropagation();
      this.selecionados = toggleId(this.selecionados, m.id);
      this.syncShellBottomNavActions();
      return;
    }
    this.onEditar(m);
  }

  temFiltroAtivo(): boolean {
    return this.chipsFiltrosMobile().length > 0;
  }

  /** Chips só quando Status ≠ padrão (só Ativos). */
  chipsFiltrosMobile(): { id: string; label: string }[] {
    const chips: { id: string; label: string }[] = [];
    if (this.filtroAtivas && this.filtroInativas) {
      chips.push({ id: 'status', label: 'Status: Ativos e Inativos' });
    } else if (!this.filtroAtivas && this.filtroInativas) {
      chips.push({ id: 'status', label: 'Status: Inativos' });
    }
    return chips;
  }

  removerChipFiltro(id: string, ev: Event): void {
    ev.stopPropagation();
    if (id !== 'status') return;
    this.filtroAtivas = true;
    this.filtroInativas = false;
    this.pagina = 1;
    if (this.shellBottomNavEligible) this.syncShellBottomNavActions();
  }

  labelListaVazia(): string {
    if (this.itens.length === 0) return 'Nenhuma marca cadastrada';
    return 'Nenhuma marca encontrada';
  }

  get buscaPlaceholder(): string {
    return this.buscaAberta ? 'Buscar marcas…' : '';
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.api.listMarcasCatalogo(true).subscribe({
      next: (marcas) => {
        this.itens = (marcas ?? []).map((m) => ({
          id: m.id,
          nome: m.nome,
          ativo: m.ativo !== false,
          qtdItens: Number(m.qtd_itens ?? 0),
        }));
        this.carregando = false;
        this.pagina = 1;
        this.selecionados.clear();
        if (this.modoSelecao) this.syncShellBottomNavActions();
      },
      error: (e: Error) => {
        this.erro =
          e.message || 'Não foi possível carregar marcas. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  onBuscaWrapClick(): void {
    if (!this.buscaAberta) {
      this.dispararPulsoToolbar('busca');
      this.buscaAberta = true;
      queueMicrotask(() =>
        document.getElementById('marcas-busca-input')?.focus(),
      );
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

  toggleFiltroStatus(which: 'ativos' | 'inativos', ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (which === 'ativos') this.filtroAtivas = checked;
    else this.filtroInativas = checked;
    if (!this.filtroAtivas && !this.filtroInativas) {
      if (which === 'ativos') this.filtroInativas = true;
      else this.filtroAtivas = true;
    }
    this.pagina = 1;
    if (this.shellBottomNavEligible) this.syncShellBottomNavActions();
  }

  get filtroStatusAtivo(): boolean {
    return !this.filtroAtivas || this.filtroInativas;
  }

  /** Compatível com template legado / desktop indicator. */
  filtrosStatusAtivos(): boolean {
    return this.filtroStatusAtivo;
  }

  limparFiltros(): void {
    this.filtroAtivas = true;
    this.filtroInativas = false;
    this.pagina = 1;
    if (this.shellBottomNavEligible) this.syncShellBottomNavActions();
  }

  onNovo(): void {
    if (this.modoSelecao) this.sairModoSelecao();
    this.abrirCadastro(null, true);
  }

  toggleCadastroAtivo(ev: Event): void {
    if (this.cadastroSalvando) return;
    this.cadastroAtivo = !this.cadastroAtivo;
    const el = ev.currentTarget as HTMLElement | null;
    if (el) this.pulsarSwitch(el);
  }

  private pulsarSwitch(el: HTMLElement): void {
    el.classList.remove('drawer-switch--pulse');
    void el.offsetWidth;
    el.classList.add('drawer-switch--pulse');
    window.setTimeout(() => el.classList.remove('drawer-switch--pulse'), 1500);
  }

  private focarCampoNome(): void {
    queueMicrotask(() => {
      document.getElementById('marcas-cadastro-nome')?.focus();
    });
  }

  private abrirCadastro(item: MarcaListaItem | null, focarNome = false): void {
    if (this.cadastroCloseTimer != null) {
      clearTimeout(this.cadastroCloseTimer);
      this.cadastroCloseTimer = null;
    }
    this.cadastroEditando = item;
    this.cadastroNome = item?.nome ?? '';
    this.cadastroAtivo = item ? item.ativo !== false : true;
    this.cadastroSalvando = false;
    this.cadastroNomeErro = false;
    this.cadastroAberto = true;
    this.cadastroPanelOpen = false;
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.cadastroPanelOpen = true;
          if (focarNome) this.focarCampoNome();
        });
      });
    });
  }

  fecharCadastro(): void {
    if (!this.cadastroAberto || this.cadastroSalvando) return;
    this.cadastroPanelOpen = false;
    if (this.cadastroCloseTimer != null) {
      clearTimeout(this.cadastroCloseTimer);
    }
    this.cadastroCloseTimer = setTimeout(() => {
      this.cadastroCloseTimer = null;
      this.cadastroAberto = false;
      this.cadastroEditando = null;
      this.cadastroNome = '';
      this.cadastroAtivo = true;
      this.cadastroNomeErro = false;
    }, DRAWER_ANIM_MS);
  }

  onCadastroNomeInput(): void {
    if (this.cadastroNomeErro && this.cadastroNome.trim()) {
      this.cadastroNomeErro = false;
    }
  }

  salvarCadastro(): void {
    const nome = this.cadastroNome.trim();
    if (this.cadastroSalvando) return;
    if (!nome) {
      this.cadastroNomeErro = true;
      return;
    }
    this.cadastroNomeErro = false;
    this.cadastroSalvando = true;
    this.erro = '';
    const editando = this.cadastroEditando;
    const onOk = () => {
      this.cadastroSalvando = false;
      if (!this.cadastroAtivo && !this.filtroInativas) {
        this.filtroInativas = true;
        if (this.shellBottomNavEligible) this.syncShellBottomNavActions();
      }
      this.fecharCadastro();
      this.toast.show(MARCA_SALVA_TOAST_MSG);
      this.carregar();
    };
    const onErr = (e: Error) => {
      this.cadastroSalvando = false;
      this.toast.show(e.message || 'Não foi possível salvar a marca.');
    };
    if (editando) {
      this.api
        .atualizarMarcaCatalogo(editando.id, {
          nome,
          ativo: this.cadastroAtivo,
        })
        .subscribe({ next: onOk, error: onErr });
    } else {
      this.api
        .criarMarcaCatalogo({ nome, ativo: this.cadastroAtivo })
        .subscribe({ next: onOk, error: onErr });
    }
  }

  onEditar(item: MarcaListaItem): void {
    this.abrirCadastro(item, false);
  }

  onExcluir(item: MarcaListaItem, ev?: Event): void {
    ev?.stopPropagation();
    this.exclusaoModalItem = item;
  }

  fecharModalExclusao(): void {
    if (this.exclusaoModalSalvando) return;
    this.exclusaoModalItem = null;
  }

  confirmarModalExclusao(): void {
    const item = this.exclusaoModalItem;
    if (!item || this.exclusaoModalSalvando) return;
    this.exclusaoModalSalvando = true;
    this.api.excluirMarcaCatalogo(item.id).subscribe({
      next: (res) => {
        this.exclusaoModalSalvando = false;
        this.exclusaoModalItem = null;
        this.selecionados.delete(item.id);
        if (this.modoSelecao) this.sairModoSelecao();
        this.toast.show(
          res.result === 'deactivated'
            ? 'Marca desativada (já usada em produtos).'
            : MARCA_EXCLUIDA_TOAST_MSG,
        );
        this.carregar();
      },
      error: (e: Error) => {
        this.exclusaoModalSalvando = false;
        this.toast.show(e.message || 'Não foi possível excluir a marca.');
      },
    });
  }

  onOrdenarColuna(col: 'nome', ev?: Event): void {
    ev?.stopPropagation();
    if (this.ordenacaoColuna === col) {
      this.ordenacaoDir = this.ordenacaoDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenacaoColuna = col;
      this.ordenacaoDir = 'asc';
    }
    this.pagina = 1;
  }

  tooltipOrdenacao(col: 'nome'): string {
    return tooltipOrdenacaoProximoClique(
      this.ordenacaoColuna,
      this.ordenacaoDir,
      col,
    );
  }

  private normalizar(s: string): string {
    return String(s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  filtrados(): MarcaListaItem[] {
    const q = this.normalizar(this.busca);
    let list = this.itens.filter((i) => {
      if (i.ativo) return this.filtroAtivas;
      return this.filtroInativas;
    });
    if (q) {
      list = list.filter((i) => this.normalizar(i.nome).includes(q));
    }
    const dir = this.ordenacaoDir === 'asc' ? 1 : -1;
    list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') * dir);
    return list;
  }

  totalFiltrado(): number {
    return this.filtrados().length;
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalFiltrado() / this.porPagina) || 1);
  }

  paginaItens(): MarcaListaItem[] {
    const all = this.filtrados();
    const start = (this.pagina - 1) * this.porPagina;
    return all.slice(start, start + this.porPagina);
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

  rotuloItens(n: number): string {
    if (n <= 0) return 'Nenhum item associado';
    if (n === 1) return 'Possui um item associado';
    return `Possui ${n} itens associados`;
  }

  estaSelecionado(id: number): boolean {
    return this.selecionados.has(id);
  }

  toggleSelecionado(item: MarcaListaItem, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) this.selecionados.add(item.id);
    else this.selecionados.delete(item.id);
    if (this.modoSelecao) this.syncShellBottomNavActions();
  }

  todosDaPaginaSelecionados(): boolean {
    const page = this.paginaItens();
    return page.length > 0 && page.every((i) => this.selecionados.has(i.id));
  }

  toggleSelecionarTodos(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    for (const i of this.paginaItens()) {
      if (checked) this.selecionados.add(i.id);
      else this.selecionados.delete(i.id);
    }
    if (this.modoSelecao) this.syncShellBottomNavActions();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(ev: KeyboardEvent): void {
    if (this.exclusaoModalItem) {
      ev.preventDefault();
      this.fecharModalExclusao();
      return;
    }
    if (this.acoesMenuAberto) {
      ev.preventDefault();
      this.acoesMenuAberto = false;
      this.syncShellBottomNavActions();
      return;
    }
    if (this.cadastroAberto) {
      ev.preventDefault();
      this.fecharCadastro();
      return;
    }
    if (this.filtrosAbertos) {
      ev.preventDefault();
      this.fecharFiltros();
      return;
    }
    if (this.modoSelecao) {
      ev.preventDefault();
      this.sairModoSelecao();
      return;
    }
    if (this.perPageMenuAberto) this.perPageMenuAberto = false;
    else if (this.buscaAberta) this.buscaAberta = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (this.buscaAberta && !t?.closest?.('.list-head__busca-wrap')) {
      this.buscaAberta = false;
    }
    if (this.perPageMenuAberto && !t?.closest?.('.list-footer__per-page')) {
      this.perPageMenuAberto = false;
    }
  }
}
