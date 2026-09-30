import {
  SHELL_KEYBOARD_MIN_PX,
  shellKeyboardOffset,
  type ShellKeyboardMetrics,
} from './shell-keyboard';

function metrics(patch: Partial<ShellKeyboardMetrics> = {}): ShellKeyboardMetrics {
  return {
    innerHeight: 844,
    visualHeight: 844,
    offsetTop: 0,
    desktop: false,
    ...patch,
  };
}

describe('shellKeyboardOffset', () => {
  it('começa em zero quando a visual viewport cobre a layout viewport', () => {
    expect(shellKeyboardOffset(metrics())).toBe(0);
  });

  it('calcula o overlap no resize, descontando offsetTop', () => {
    expect(
      shellKeyboardOffset(
        metrics({ visualHeight: 420, offsetTop: 24 }),
      ),
    ).toBe(844 - 420 - 24);
  });

  it('reage ao scroll da visual viewport pelo offsetTop', () => {
    const resized = shellKeyboardOffset(metrics({ visualHeight: 500, offsetTop: 0 }));
    const scrolled = shellKeyboardOffset(metrics({ visualHeight: 500, offsetTop: 40 }));
    expect(scrolled).toBe(resized - 40);
  });

  it('ignora variação menor que o limiar', () => {
    expect(
      shellKeyboardOffset(
        metrics({ visualHeight: 844 - (SHELL_KEYBOARD_MIN_PX - 1) }),
      ),
    ).toBe(0);
  });

  it('não aplica no desktop', () => {
    expect(
      shellKeyboardOffset(metrics({ desktop: true, visualHeight: 400 })),
    ).toBe(0);
  });

  it('faz no-op quando visualViewport não existe', () => {
    expect(shellKeyboardOffset(null)).toBe(0);
  });
});
