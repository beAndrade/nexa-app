import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
