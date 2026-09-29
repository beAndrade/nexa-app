import { toYmd } from '../../core/utils/atendimento-display';
import { BRASILIA_IANA } from '../../core/utils/brasilia-time';
import {
  normalizarIntervaloYmd,
  ymdValido,
} from '../../shared/cliente-drawer-periodo-filtro/cliente-periodo-filtro.util';
import type { SaasSelectOption } from '../../shared/components/saas-select/saas-select.component';

export type AvaliacoesPeriodoPresetId =
  | 'hoje'
  | 'ultimos_7_dias'
  | 'esse_mes'
  | 'mes_passado'
  | 'personalizado';

export const AVALIACOES_PERIODO_PRESET_DEFAULT: AvaliacoesPeriodoPresetId =
  'esse_mes';

export const AVALIACOES_PERIODO_PRESET_OPTIONS: SaasSelectOption[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ultimos_7_dias', label: 'Últimos 7 dias' },
  { value: 'esse_mes', label: 'Este mês' },
  { value: 'mes_passado', label: 'Mês anterior' },
  { value: 'personalizado', label: 'Personalizado' },
];

export function ymdHojeSalao(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BRASILIA_IANA });
}

function refDatePartesSalao(): { y: number; m: number; d: number } {
  const ymd = ymdHojeSalao();
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return { y, m, d };
}

function addDiasYmd(ymd: string, dias: number): string {
  const s = String(ymd ?? '').trim().slice(0, 10);
  if (!ymdValido(s)) return s;
  const [y, mo, d] = s.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(y, mo - 1, d + dias);
  return toYmd(dt);
}

export function resolverAvaliacoesPeriodo(
  presetId: AvaliacoesPeriodoPresetId,
  customInicio?: string,
  customFim?: string,
): { dataInicio: string; dataFim: string } | null {
  const { y, m } = refDatePartesSalao();

  switch (presetId) {
    case 'hoje': {
      const t = ymdHojeSalao();
      return { dataInicio: t, dataFim: t };
    }
    case 'ultimos_7_dias': {
      const fim = ymdHojeSalao();
      const inicio = addDiasYmd(fim, -6);
      return { dataInicio: inicio, dataFim: fim };
    }
    case 'esse_mes': {
      const ini = new Date(y, m - 1, 1);
      const fim = new Date(y, m, 0);
      return { dataInicio: toYmd(ini), dataFim: toYmd(fim) };
    }
    case 'mes_passado': {
      const ini = new Date(y, m - 2, 1);
      const fim = new Date(y, m - 1, 0);
      return { dataInicio: toYmd(ini), dataFim: toYmd(fim) };
    }
    case 'personalizado': {
      const ini = String(customInicio ?? '').trim().slice(0, 10);
      const fim = String(customFim ?? '').trim().slice(0, 10);
      if (!ymdValido(ini) || !ymdValido(fim)) return null;
      const norm = normalizarIntervaloYmd(ini, fim);
      return { dataInicio: norm.inicioYmd, dataFim: norm.fimYmd };
    }
    default:
      return null;
  }
}

export function periodoPadraoAvaliacoes(): {
  preset: AvaliacoesPeriodoPresetId;
  dataInicio: string;
  dataFim: string;
} {
  const preset = AVALIACOES_PERIODO_PRESET_DEFAULT;
  const resolved = resolverAvaliacoesPeriodo(preset)!;
  return { preset, ...resolved };
}
