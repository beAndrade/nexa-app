import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileFiltrosSheetComponent } from './mobile-filtros-sheet.component';

@Component({
  standalone: true,
  imports: [MobileFiltrosSheetComponent],
  template: `
    <app-mobile-filtros-sheet
      [open]="open"
      [closeOnEscape]="closeOnEscape"
      title="Filtros"
      (closed)="closedCount = closedCount + 1"
      (openChange)="lastOpen = $event"
    >
      <p class="probe">conteúdo</p>
    </app-mobile-filtros-sheet>
  `,
})
class HostComponent {
  open = false;
  closeOnEscape = true;
  closedCount = 0;
  lastOpen: boolean | null = null;
}

function sheetDeclaresHeightDvh(): boolean {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (rule.cssText.includes('100dvh')) return true;
    }
  }
  return false;
}

describe('MobileFiltrosSheetComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('fica fechado e emite closed no Escape quando aberto', () => {
    const host = fixture.componentInstance;
    host.open = true;
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.mobile-filtros-sheet') as HTMLElement;
    expect(panel.classList.contains('mobile-filtros-sheet--open')).toBe(true);
    expect(sheetDeclaresHeightDvh()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
    expect(host.lastOpen).toBe(false);
    expect(host.open).toBe(true);
  });

  it('scrim emite closed sem alterar o estado da feature', () => {
    const host = fixture.componentInstance;
    host.open = true;
    fixture.detectChanges();

    const scrim = fixture.nativeElement.querySelector(
      '.mobile-filtros-sheet__overlay',
    ) as HTMLElement;
    scrim.click();
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
    expect(host.lastOpen).toBe(false);
  });

  it('não fecha no Escape quando closeOnEscape é false', () => {
    const host = fixture.componentInstance;
    host.open = true;
    host.closeOnEscape = false;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.closedCount).toBe(0);
    expect(host.lastOpen).toBeNull();
  });
});
