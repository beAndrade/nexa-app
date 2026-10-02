import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ClienteCadastroDrawerService } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service';
import { ClienteCadastroFormComponent } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-form.component';

@Component({
  selector: 'app-clientes-editar',
  standalone: true,
  imports: [RouterLink, ClienteCadastroFormComponent],
  templateUrl: './clientes-editar.component.html',
  styleUrl: '../novo/clientes-novo.component.scss',
})
export class ClientesEditarComponent implements OnInit, OnDestroy {
  private readonly apiRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly d = inject(ClienteCadastroDrawerService);

  ngOnInit(): void {
    const id = this.apiRoute.snapshot.paramMap.get('id')?.trim() ?? '';
    if (!id) {
      void this.router.navigate(['/clientes']);
      return;
    }
    this.d.iniciarPaginaEdicao(id, () => {
      void this.router.navigate(['/clientes']);
    });
  }

  ngOnDestroy(): void {
    if (this.d.exibicao === 'pagina') {
      this.d.encerrarPagina();
    }
  }

  onVoltar(ev: Event): void {
    ev.preventDefault();
    this.d.pedirFechar(() => {
      void this.router.navigate(['/clientes']);
    });
  }

  canDeactivate(): Observable<boolean> | boolean {
    return this.d.canDeactivatePagina();
  }
}
