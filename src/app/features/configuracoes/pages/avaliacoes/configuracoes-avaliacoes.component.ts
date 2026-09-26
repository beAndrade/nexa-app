import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type { SalaoConfig } from '../../../../core/models/salao-config.model';
import { SalaoConfigService } from '../../../../core/services/salao-config/salao-config.service';
import { AppToastService } from '../../../../shared/app-toast/app-toast.service';

@Component({
  selector: 'app-configuracoes-avaliacoes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracoes-avaliacoes.component.html',
  styleUrl: './configuracoes-avaliacoes.component.scss',
})
export class ConfiguracoesAvaliacoesComponent implements OnInit {
  private readonly salao = inject(SalaoConfigService);
  private readonly toast = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  config: SalaoConfig | null = null;
  googleReviewUrl = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.salao
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.googleReviewUrl = cfg.google_review_url ?? '';
          this.carregando.set(false);
        },
        error: (e: Error) => {
          this.erro.set(SalaoConfigService.errorMessage(e));
          this.carregando.set(false);
        },
      });
  }

  salvar(): void {
    this.salvando.set(true);
    this.erro.set(null);
    this.salao
      .saveConfig({
        google_review_url: this.googleReviewUrl.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.googleReviewUrl = cfg.google_review_url ?? '';
          this.salvando.set(false);
          this.toast.show('Link de avaliação salvo.');
        },
        error: (e: Error) => {
          const msg = SalaoConfigService.errorMessage(e);
          this.erro.set(msg);
          this.salvando.set(false);
          this.toast.show(msg);
        },
      });
  }
}
