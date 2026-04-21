import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { registeredGuard } from './core/guards/registered.guard';
import { ShellComponent } from './shared/shell';

export const routes: Routes = [
  { path: '', redirectTo: '/swag', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'swag',
        loadComponent: () =>
          import('./features/swag/swag-list').then((m) => m.SwagListComponent),
      },
      {
        path: 'swag/create',
        canActivate: [registeredGuard],
        loadComponent: () =>
          import('./features/swag/create-swag').then((m) => m.CreateSwagComponent),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard').then((m) => m.LeaderboardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/swag' },
];
