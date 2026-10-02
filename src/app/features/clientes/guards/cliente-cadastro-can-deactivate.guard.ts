import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export type ClienteCadastroPodeSair = {
  canDeactivate: () => Observable<boolean> | boolean;
};

export const clienteCadastroCanDeactivateGuard: CanDeactivateFn<
  ClienteCadastroPodeSair
> = (component) => {
  if (!component?.canDeactivate) return true;
  return component.canDeactivate();
};
