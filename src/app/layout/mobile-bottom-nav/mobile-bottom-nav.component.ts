import { Component, ElementRef, inject } from '@angular/core';
import {
  AppShellUiService,
  type MobileBottomNavAction,
} from '../../core/services/app-shell-ui.service';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  templateUrl: './mobile-bottom-nav.component.html',
  styleUrl: './mobile-bottom-nav.component.scss',
})
export class MobileBottomNavComponent {
  private readonly shellUi = inject(AppShellUiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly actions = this.shellUi.mobileBottomNavActions;

  abrirMenu(ev: Event): void {
    ev.stopPropagation();
    this.pulsarSeTeclado(ev);
    this.shellUi.requestToggleMobileNav();
  }

  executar(action: MobileBottomNavAction, ev: Event): void {
    // Igual aos triggers antigos da Agenda: evita que o document click
    // (outside-close) feche o menu/painel no mesmo gesto que abriu.
    ev.stopPropagation();
    this.pulsarSeTeclado(ev);
    action.onClick();
  }

  aoPressionar(ev: PointerEvent): void {
    const alvo = ev.target;
    if (!(alvo instanceof Element) || !alvo.closest('.shell-bottom-nav__btn')) return;
    this.pulsar();
  }

  private pulsarSeTeclado(ev: Event): void {
    if (ev instanceof MouseEvent && ev.detail === 0) this.pulsar();
  }

  private pulsar(): void {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const nav = this.host.nativeElement.querySelector('.shell-bottom-nav');
    if (!(nav instanceof HTMLElement)) return;
    nav.getAnimations().forEach((animacao) => animacao.cancel());
    const sombra =
      '0 6px 18px rgba(0, 0, 0, 0.09), 0 1px 4px rgba(0, 0, 0, 0.055)';
    nav.animate(
      [
        {
          transform: 'scale(1)',
          opacity: '1',
          boxShadow: sombra,
          offset: 0,
        },
        {
          transform: 'scale(0.985)',
          opacity: '0.97',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)',
          offset: 0.34,
        },
        {
          transform: 'scale(0.985)',
          opacity: '0.97',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)',
          offset: 0.48,
        },
        {
          transform: 'scale(1)',
          opacity: '1',
          boxShadow: sombra,
          offset: 1,
        },
      ],
      { duration: 380, easing: 'ease-out' },
    );
  }
}
