import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/api.models';

export interface AvaliacaoSolicitacao {
  id: number;
  id_atendimento: string | null;
  cliente_id: string | null;
  telefone: string;
  google_review_url: string;
  status: string;
  whatsapp_aberto_em: string;
  created_at: string;
}

export interface AvaliacaoSolicitacaoLista extends AvaliacaoSolicitacao {
  numero_comanda: number | null;
  cliente_nome: string | null;
}

export interface AvaliacaoSolicitacoesResumo {
  total: number;
  este_mes: number;
  clientes_alcancados: number;
  ultima_solicitacao_em: string | null;
}

export interface AvaliacaoSolicitacoesLista {
  resumo: AvaliacaoSolicitacoesResumo;
  items: AvaliacaoSolicitacaoLista[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListarAvaliacaoSolicitacoesParams {
  search?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
}

export interface CriarAvaliacaoSolicitacaoPayload {
  id_atendimento: string;
  cliente_id: string;
  telefone: string;
  google_review_url: string;
}

@Injectable({ providedIn: 'root' })
export class AvaliacaoSolicitacoesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  listar(
    params?: ListarAvaliacaoSolicitacoesParams,
  ): Observable<AvaliacaoSolicitacoesLista> {
    let httpParams = new HttpParams();
    const search = String(params?.search ?? '').trim();
    if (search) httpParams = httpParams.set('search', search);
    const status = String(params?.status ?? '').trim();
    if (status) httpParams = httpParams.set('status', status);
    const di = String(params?.dataInicio ?? '').trim().slice(0, 10);
    if (di) httpParams = httpParams.set('data_inicio', di);
    const df = String(params?.dataFim ?? '').trim().slice(0, 10);
    if (df) httpParams = httpParams.set('data_fim', df);
    if (params?.page != null) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('page_size', String(params.pageSize));
    }

    return this.http
      .get<ApiResponse<AvaliacaoSolicitacoesLista>>(
        `${this.baseUrl}/api/avaliacoes/solicitacoes`,
        { params: httpParams },
      )
      .pipe(
        map((r) => {
          if (!r.ok || r.data == null) {
            throw new Error(
              r.error?.message ?? 'Não foi possível carregar as solicitações.',
            );
          }
          return r.data;
        }),
      );
  }

  registrar(
    payload: CriarAvaliacaoSolicitacaoPayload,
  ): Observable<AvaliacaoSolicitacao> {
    return this.http
      .post<ApiResponse<{ solicitacao: AvaliacaoSolicitacao }>>(
        `${this.baseUrl}/api/avaliacoes/solicitacoes`,
        payload,
      )
      .pipe(
        map((r) => {
          if (!r.ok || r.data == null) {
            throw new Error(
              r.error?.message ?? 'Não foi possível registrar a solicitação.',
            );
          }
          return r.data.solicitacao;
        }),
      );
  }
}
