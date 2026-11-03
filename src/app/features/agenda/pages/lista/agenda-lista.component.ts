import {
  Component,
  inject,
  LOCALE_ID,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { SheetsApiService } from '../../../../core/services/sheets-api.service';
import { AppShellUiService } from '../../../../core/services/app-shell-ui.service';
import { AtendimentoListaItem } from '../../../../core/models/api.models';
import {
  dataDdMmAaaa,
  parseFiltroDataDdMm,
  toDdMmYyyy,
  valorMonetarioParaNumero,
} from '../../../../core/utils/atendimento-display';
import { MobileFiltrosSheetComponent } from '../../../../shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component';
import { mediaQueryMin } from '../../../../styles/breakpoints';

registerLocaleData(localePt);

const AGENDA_LISTA_BOTTOM_NAV_OWNER = 'agenda-lista';

function periodoPadraoUltimos90Dias(): { ini: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - 90);
  return { ini: toDdMmYyyy(inicio), fim: toDdMmYyyy(hoje) };
}

@Component({
  selector: 'app-agenda-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, MobileFiltrosSheetComponent],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './agenda-lista.component.html',
  styleUrl: './agenda-lista.component.scss',
})
export class AgendaListaComponent implements OnInit, OnDestroy {
  private readonly api = inject(SheetsApiService);
  private readonly shellUi = inject(AppShellUiService);
  private readonly router = inject(Router);

  private shellDesktopMq: MediaQueryList | null = null;
  private readonly onShellViewportChange = (): void => {
    this.shellBottomNavEligible = !(this.shellDesktopMq?.matches ?? true);
    if (!this.shellBottomNavEligible && this.filtrosAbertos) {
      this.filtrosAbertos = false;
    }
    this.syncShellBottomNavActions();
  };

  readonly dataDdMmAaaa = dataDdMmAaaa;
  readonly valorNum = valorMonetarioParaNumero;

  dataInicio = '';
  dataFim = '';
  /** Rascunho do sheet mobile — só entra na lista após Aplicar/Limpar. */
  draftInicio = '';
  draftFim = '';
  carregando = false;
  erro = '';
  itens: AtendimentoListaItem[] = [];

  shellBottomNavEligible = false;
  filtrosAbertos = false;

  ngOnInit(): void {
    const padrao = periodoPadraoUltimos90Dias();
    this.dataInicio = padrao.ini;
    this.dataFim = padrao.fim;
    this.draftInicio = padrao.ini;
    this.draftFim = padrao.fim;
    this.setupShellBottomNav();
    this.carregar();
  }

  ngOnDestroy(): void {
    this.shellDesktopMq?.removeEventListener('change', this.onShellViewportChange);
    this.shellDesktopMq = null;
    this.shellUi.clearMobileBottomNavActions(AGENDA_LISTA_BOTTOM_NAV_OWNER);
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    const di = parseFiltroDataDdMm(this.dataInicio);
    const df = parseFiltroDataDdMm(this.dataFim);
    if (!di || !df) {
      this.carregando = false;
      this.erro =
        'Use o formato dia-mês-ano nas duas datas (ex.: 09-04-2026). Também aceita barras: 09/04/2026.';
      return;
    }
    if (di > df) {
      this.carregando = false;
      this.erro = 'A data “De” não pode ser depois da data “Até”.';
      return;
    }
    this.api.listAgendamentos(di, df).subscribe({
      next: (items) => {
        this.itens = items.slice().sort((a, b) => {
          const c = a.data.localeCompare(b.data);
          return c !== 0 ? c : a.nomeCliente.localeCompare(b.nomeCliente);
        });
        this.carregando = false;
      },
      error: (e: Error) => {
        this.erro =
          e.message ||
          'Não foi possível carregar a agenda. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  /** Período aplicado ≠ default dos últimos 90 dias. */
  temFiltroAtivo(): boolean {
    const padrao = periodoPadraoUltimos90Dias();
    return this.dataInicio !== padrao.ini || this.dataFim !== padrao.fim;
  }

  private setupShellBottomNav(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.shellDesktopMq = window.matchMedia(mediaQueryMin('shellMobile'));
    this.onShellViewportChange();
    this.shellDesktopMq.addEventListener('change', this.onShellViewportChange);
  }

  /**
   * ≤767: Menu + Filtros · Novo.
   * `active` com sheet aberto; `warn` com período ≠ 90 dias e sheet fechado.
   */
  private syncShellBottomNavActions(): void {
    if (!this.shellBottomNavEligible) {
      this.shellUi.clearMobileBottomNavActions(AGENDA_LISTA_BOTTOM_NAV_OWNER);
      return;
    }
    this.shellUi.setMobileBottomNavActions(AGENDA_LISTA_BOTTOM_NAV_OWNER, [
      {
        id: 'filtro',
        label: 'Filtros',
        ariaLabel: this.filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros',
        icon: 'filter',
        active: this.filtrosAbertos,
        warn: this.temFiltroAtivo() && !this.filtrosAbertos,
        onClick: () => this.onFiltroMobile(),
      },
      {
        id: 'novo',
        label: 'Novo',
        ariaLabel: 'Novo agendamento',
        icon: 'plus',
        accent: true,
        onClick: () => void this.router.navigate(['/agenda/novo']),
      },
    ]);
  }

  private onFiltroMobile(): void {
    if (this.filtrosAbertos) {
      this.fecharFiltros();
      return;
    }
    this.abrirFiltros();
  }

  abrirFiltros(): void {
    this.draftInicio = this.dataInicio;
    this.draftFim = this.dataFim;
    this.filtrosAbertos = true;
    this.syncShellBottomNavActions();
  }

  fecharFiltros(): void {
    if (!this.filtrosAbertos) return;
    this.filtrosAbertos = false;
    this.syncShellBottomNavActions();
  }

  aplicarFiltrosMobile(): void {
    this.dataInicio = this.draftInicio;
    this.dataFim = this.draftFim;
    this.carregar();
    this.fecharFiltros();
  }

  limparFiltrosMobile(): void {
    const padrao = periodoPadraoUltimos90Dias();
    this.draftInicio = padrao.ini;
    this.draftFim = padrao.fim;
    this.dataInicio = padrao.ini;
    this.dataFim = padrao.fim;
    this.carregar();
    this.fecharFiltros();
  }
}
