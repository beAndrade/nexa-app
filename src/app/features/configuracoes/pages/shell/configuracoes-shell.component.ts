import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-configuracoes-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './configuracoes-shell.component.html',
  styleUrl: './configuracoes-shell.component.scss',
})
export class ConfiguracoesShellComponent {}
