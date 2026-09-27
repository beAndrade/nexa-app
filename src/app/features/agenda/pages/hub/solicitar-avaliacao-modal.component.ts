import { Component, input, output } from '@angular/core';

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
  readonly fechar = output<void>();

  onOverlayClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.fechar.emit();
  }
}
