import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MobileListActionMenuItem,
  MobileListActionsMenuComponent,
} from './mobile-list-actions-menu.component';

@Component({
  standalone: true,
  imports: [MobileListActionsMenuComponent],
  template: `
    <button type="button" class="outside">fora</button>
    <div class="shell-bottom-nav">
      <button type="button" class="bar">Ações</button>
    </div>
    <app-mobile-list-actions-menu
      [open]="open"
      [items]="items"
      (closed)="closedCount = closedCount + 1"
      (openChange)="lastOpen = $event"
      (itemSelect)="lastItem = $event"
    />
  `,
})
class HostComponent {
  open = false;
  closedCount = 0;
  lastOpen: boolean | null = null;
  lastItem: MobileListActionMenuItem | null = null;
  items: MobileListActionMenuItem[] = [
    { id: 'arquivar', label: 'Arquivar' },
    { id: 'off', label: 'Indisponível', disabled: true },
    { id: 'remover', label: 'Remover', danger: true, ariaLabel: 'Remover item' },
  ];
}

function menuCssIncludes(fragment: string): boolean {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (rule.cssText.includes(fragment)) return true;
    }
  }
  return false;
}

describe('MobileListActionsMenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('abre com menu acessível e mantém o open da feature no Escape', () => {
    const host = fixture.componentInstance;
    host.open = true;
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '.mobile-list-actions-menu',
    ) as HTMLElement;
    const items = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
    expect(panel.classList.contains('mobile-list-actions-menu--open')).toBe(true);
    expect(panel.getAttribute('role')).toBe('menu');
    expect(items.length).toBe(3);
    expect(document.activeElement).toBe(items[0]);
    expect(menuCssIncludes('min-height: 44px')).toBe(true);
    expect(menuCssIncludes('930')).toBe(true);
    expect(menuCssIncludes('0.18s')).toBe(true);
    expect(menuCssIncludes('prefers-reduced-motion')).toBe(true);

    let leaked = false;
    const leak = (): void => {
      leaked = true;
    };
    document.addEventListener('keydown', leak);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    document.removeEventListener('keydown', leak);
    fixture.detectChanges();

    expect(leaked).toBe(false);
    expect(host.closedCount).toBe(1);
    expect(host.lastOpen).toBe(false);
    expect(host.open).toBe(true);
  });

  it('fecha no clique fora e ignora a bottom nav', () => {
    const host = fixture.componentInstance;
    host.open = true;
    fixture.detectChanges();

    const bar = fixture.nativeElement.querySelector('.bar') as HTMLButtonElement;
    bar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.closedCount).toBe(0);

    const outside = fixture.nativeElement.querySelector(
      '.outside',
    ) as HTMLButtonElement;
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
    expect(host.lastOpen).toBe(false);
    expect(host.open).toBe(true);
  });

  it('emite o item habilitado e não dispara o disabled', () => {
    const host = fixture.componentInstance;
    host.open = true;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '.mobile-list-actions-menu__item',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[1].disabled).toBe(true);
    buttons[1].click();
    fixture.detectChanges();
    expect(host.lastItem).toBeNull();
    expect(host.closedCount).toBe(0);

    buttons[2].click();
    fixture.detectChanges();
    expect(host.lastItem?.id).toBe('remover');
    expect(host.closedCount).toBe(1);
    expect(host.lastOpen).toBe(false);
    expect(host.open).toBe(true);
  });
});
