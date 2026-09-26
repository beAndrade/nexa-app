import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/api.models';
import type {
  SalaoConfig,
  SalaoConfigPayload,
} from '../../models/salao-config.model';
import { extractApiErrorMessage } from '../../utils/api-error-message';

@Injectable({ providedIn: 'root' })
export class SalaoConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  private unwrap<T>(r: ApiResponse<T>): T {
    if (!r.ok || r.data == null) {
      throw new Error(r.error?.message ?? 'Erro na configuração do salão.');
    }
    return r.data;
  }

  getConfig(): Observable<SalaoConfig> {
    return this.http
      .get<ApiResponse<{ config: SalaoConfig }>>(
        `${this.baseUrl}/api/salao/config`,
      )
      .pipe(map((r) => this.unwrap<{ config: SalaoConfig }>(r).config));
  }

  saveConfig(payload: SalaoConfigPayload): Observable<SalaoConfig> {
    return this.http
      .put<ApiResponse<{ config: SalaoConfig }>>(
        `${this.baseUrl}/api/salao/config`,
        payload,
      )
      .pipe(map((r) => this.unwrap<{ config: SalaoConfig }>(r).config));
  }

  static errorMessage(err: unknown): string {
    return extractApiErrorMessage(err);
  }
}
