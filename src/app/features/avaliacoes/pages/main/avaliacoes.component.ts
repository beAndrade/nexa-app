import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableEmptyComponent } from '../../../../shared/table-empty/table-empty.component';
import {
  AvaliacaoSolicitacaoLista,
  AvaliacaoSolicitacoesResumo,
  AvaliacaoSolicitacoesService,
} from '../../../../core/services/avaliacoes/avaliacao-solicitacoes.service';
import { extractApiErrorMessage } from '../../../../core/utils/api-error-message';
import { formatarTelefoneBrDeValor } from '../../../../core/utils/telefone-br';

@Component({
  selector: 'app-avaliacoes',
  standalone: true,
  imports: [TableEmptyComponent],
  templateUrl: './avaliacoes.component.html',
  styleUrl: './avaliacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvaliacoesComponent {
  private readonly api = inject(AvaliacaoSolicitacoesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly resumo = signal<AvaliacaoSolicitacoesResumo | null>(null);
  readonly items = signal<AvaliacaoSolicitacaoLista[]>([]);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.resumo.set(data.resumo);
          this.items.set(data.items);
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(
            extractApiErrorMessage(err) ||
              'Não foi possível carregar as solicitações de avaliação.',
          );
          this.carregando.set(false);
        },
      });
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
}
