import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppShellUiService } from '../../core/services/app-shell-ui.service';
import { MobileBottomNavComponent } from './mobile-bottom-nav.component';

describe('MobileBottomNavComponent semântica de active', () => {
  let fixture: ComponentFixture<MobileBottomNavComponent>;
  let shell: AppShellUiService;
  const onSelectAll = jasmine.createSpy('onSelectAll');
  const onActions = jasmine.createSpy('onActions');
  const onFilter = jasmine.createSpy('onFilter');

  function botao(label: string): HTMLButtonElement {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.shell-bottom-nav__btn',
    ) as NodeListOf<HTMLButtonElement>;
    const found = Array.from(buttons).find(
      (button) => button.getAttribute('aria-label') === label,
    );
    if (!found) throw new Error(`Botão não encontrado: ${label}`);
    return found;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileBottomNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileBottomNavComponent);
    shell = TestBed.inject(AppShellUiService);
    onSelectAll.calls.reset();
    onActions.calls.reset();
    onFilter.calls.reset();
  });

  afterEach(() => {
    shell.clearMobileBottomNavActions('spec-bottom-nav');
    fixture.destroy();
  });

  it('Selecionar tudo anuncia pressed e Ações/Filtro continuam expanded', () => {
    shell.setMobileBottomNavActions('spec-bottom-nav', [
      {
        id: 'selecionar-tudo',
        label: 'Selecionar tudo',
        icon: 'check',
        active: true,
        activeAria: 'pressed',
        onClick: onSelectAll,
      },
      {
        id: 'acoes',
        label: 'Ações',
        icon: 'more',
        active: true,
        onClick: onActions,
      },
      {
        id: 'filtro',
        label: 'Filtro',
        icon: 'filter',
        active: false,
        onClick: onFilter,
      },
    ]);
    fixture.detectChanges();

    const selecionarTudo = botao('Selecionar tudo');
    expect(selecionarTudo.getAttribute('aria-pressed')).toBe('true');
    expect(selecionarTudo.hasAttribute('aria-expanded')).toBeFalse();
    expect(
      selecionarTudo.classList.contains('shell-bottom-nav__btn--active'),
    ).toBeTrue();

    const acoes = botao('Ações');
    expect(acoes.getAttribute('aria-expanded')).toBe('true');
    expect(acoes.hasAttribute('aria-pressed')).toBeFalse();
    expect(acoes.classList.contains('shell-bottom-nav__btn--active')).toBeTrue();

    const filtro = botao('Filtro');
    expect(filtro.getAttribute('aria-expanded')).toBe('false');
    expect(filtro.hasAttribute('aria-pressed')).toBeFalse();
    expect(
      filtro.classList.contains('shell-bottom-nav__btn--active'),
    ).toBeFalse();

    selecionarTudo.click();
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('Selecionar tudo inativo permanece pressed false, sem expanded', () => {
    shell.setMobileBottomNavActions('spec-bottom-nav', [
      {
        id: 'selecionar-tudo',
        label: 'Selecionar tudo',
        icon: 'check',
        active: false,
        activeAria: 'pressed',
        onClick: onSelectAll,
      },
    ]);
    fixture.detectChanges();

    const selecionarTudo = botao('Selecionar tudo');
    expect(selecionarTudo.getAttribute('aria-pressed')).toBe('false');
    expect(selecionarTudo.hasAttribute('aria-expanded')).toBeFalse();
    expect(
      selecionarTudo.classList.contains('shell-bottom-nav__btn--active'),
    ).toBeFalse();
  });
});
