/**
 * Sobreposição do teclado virtual a partir do fundo da layout viewport.
 * Não inclui o inset da barra nem a safe-area: esses ficam no CSS.
 * Abaixo do limiar, a variação é tratada como chrome do browser (barra de URL).
 */
export const SHELL_KEYBOARD_MIN_PX = 80;

export interface ShellKeyboardMetrics {
  innerHeight: number;
  visualHeight: number;
  offsetTop: number;
  desktop: boolean;
}

export function shellKeyboardOffset(metrics: ShellKeyboardMetrics | null): number {
  if (!metrics || metrics.desktop) return 0;
  const overlap = metrics.innerHeight - metrics.visualHeight - metrics.offsetTop;
  if (!Number.isFinite(overlap) || overlap < SHELL_KEYBOARD_MIN_PX) return 0;
  return Math.round(overlap);
}
