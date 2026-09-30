import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

/**
 * Chrome do filter sheet mobile (Mobile List Pattern v1).
 * A feature permanece dona do conteúdo e do estado (`open`).
 */
@Component({
  selector: 'app-mobile-filtros-sheet',
  standalone: true,
  templateUrl: './mobile-filtros-sheet.component.html',
  styleUrl: './mobile-filtros-sheet.component.scss',
})
export class MobileFiltrosSheetComponent implements OnChanges, AfterViewChecked {
  @Input() open = false;
  @Input() title = 'Filtros';
  @Input() closeAriaLabel = 'Fechar filtros';
  /** Quando false, Escape fica a cargo da feature (ex.: stack de overlays). */
  @Input() closeOnEscape = true;

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;

  readonly titleId = `mobile-filtros-sheet-title-${Math.random().toString(36).slice(2, 9)}`;

  private focusClosePending = false;

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (!openChange) return;
    if (openChange.currentValue === true && !openChange.previousValue) {
      this.focusClosePending = true;
    }
  }

  ngAfterViewChecked(): void {
    if (!this.focusClosePending || !this.open) return;
    const btn = this.closeBtn?.nativeElement;
    if (!btn) return;
    this.focusClosePending = false;
    btn.focus();
  }

  requestClose(): void {
    this.openChange.emit(false);
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if (!this.open || !this.closeOnEscape || ev.key !== 'Escape') return;
    ev.preventDefault();
    this.requestClose();
  }
}
