import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ClienteCadastroDrawerService } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service';
import { ClienteCadastroFormComponent } from '../../../../shared/cliente-cadastro-drawer/cliente-cadastro-form.component';

@Component({
  selector: 'app-clientes-novo',
  standalone: true,
  imports: [RouterLink, ClienteCadastroFormComponent],
  templateUrl: './clientes-novo.component.html',
  styleUrl: './clientes-novo.component.scss',
})
export class ClientesNovoComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly d = inject(ClienteCadastroDrawerService);

  ngOnInit(): void {
    this.d.iniciarPaginaNovo(() => {
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
