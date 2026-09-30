import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

/** Item do menu. A feature define label, danger e disabled; o componente só renderiza. */
export interface MobileListActionMenuItem {
  id: string;
  label: string;
  ariaLabel?: string;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Popover de ações acima da Bottom Navigation (Mobile List Pattern v1).
 * Sem regras de domínio. A feature permanece dona de `open` e dos itens.
 */
@Component({
  selector: 'app-mobile-list-actions-menu',
  standalone: true,
  templateUrl: './mobile-list-actions-menu.component.html',
  styleUrl: './mobile-list-actions-menu.component.scss',
})
export class MobileListActionsMenuComponent
  implements OnChanges, AfterViewChecked
{
  @Input() open = false;
  @Input() items: readonly MobileListActionMenuItem[] = [];
  /** Reservado para a feature. Os dois valores alinham o painel à direita da barra. */
  @Input() anchor: 'acoes' | 'end' = 'acoes';

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly itemSelect = new EventEmitter<MobileListActionMenuItem>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private focusPending = false;

  constructor() {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', this.onDocumentKeydown, true);
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('keydown', this.onDocumentKeydown, true);
      document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (!openChange) return;
    if (openChange.currentValue === true && !openChange.previousValue) {
      this.focusPending = true;
    }
    if (openChange.previousValue === true && openChange.currentValue === false) {
      this.blurIfFocusInside();
    }
  }

  ngAfterViewChecked(): void {
    if (!this.focusPending || !this.open) return;
    const btn = this.host.nativeElement.querySelector(
      '.mobile-list-actions-menu__item:not([disabled])',
    ) as HTMLButtonElement | null;
    this.focusPending = false;
    btn?.focus();
  }

  selectItem(item: MobileListActionMenuItem): void {
    if (item.disabled) return;
    this.itemSelect.emit(item);
    this.requestClose();
  }

  private requestClose(): void {
    this.openChange.emit(false);
    this.closed.emit();
    this.blurIfFocusInside();
  }

  private readonly onDocumentKeydown = (ev: KeyboardEvent): void => {
    if (!this.open || ev.key !== 'Escape') return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    this.requestClose();
  };

  private readonly onDocumentPointerDown = (ev: Event): void => {
    if (!this.open) return;
    const target = ev.target;
    if (!(target instanceof Node)) return;
    if (this.host.nativeElement.contains(target)) return;
    if (target instanceof Element && target.closest('.shell-bottom-nav')) return;
    this.requestClose();
  };

  private blurIfFocusInside(): void {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      this.host.nativeElement.contains(active)
    ) {
      active.blur();
    }
  }
}
