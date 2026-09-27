import { Component, input, output } from '@angular/core';

export const TEXTO_CORPO_SOLICITACAO_AVALIACAO =
  'Foi um prazer receber você no Espaço Lounge. Se você gostou do atendimento, poderia compartilhar sua experiência com a gente no Google?';

export function saudacaoSolicitacaoAvaliacao(nome: string): string {
  const n = String(nome ?? '').trim();
  return n ? `Olá, ${n}!` : 'Olá!';
}

/** Texto da prévia e do wa.me. O link entra uma vez, no fim. */
export function textoSolicitacaoAvaliacao(nome: string, link: string): string {
  return `${saudacaoSolicitacaoAvaliacao(nome)}\n\n${TEXTO_CORPO_SOLICITACAO_AVALIACAO}\n\n${String(link ?? '').trim()}`;
}

@Component({
  selector: 'app-solicitar-avaliacao-modal',
  standalone: true,
  templateUrl: './solicitar-avaliacao-modal.component.html',
  styleUrl: './solicitar-avaliacao-modal.component.scss',
})
export class SolicitarAvaliacaoModalComponent {
  readonly nome = input('');
  readonly link = input<string | null>(null);
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  /** Aviso da prévia (telefone inválido ou falha ao montar o link). */
  readonly aviso = input<string | null>(null);
  readonly podeAbrir = input(false);
  readonly fechar = output<void>();
  readonly abrirWhatsapp = output<void>();

  readonly corpoMensagem = TEXTO_CORPO_SOLICITACAO_AVALIACAO;

  saudacao(): string {
    return saudacaoSolicitacaoAvaliacao(this.nome());
  }

  onOverlayClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.fechar.emit();
  }
}
