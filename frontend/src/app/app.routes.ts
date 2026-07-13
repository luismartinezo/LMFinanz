import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./features/shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts.page').then((m) => m.AccountsPage)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.page').then((m) => m.TransactionsPage)
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budgets/budgets.page').then((m) => m.BudgetsPage)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.page').then((m) => m.CategoriesPage)
      },
      {
        path: 'debts',
        loadComponent: () => import('./features/debts/debts.page').then((m) => m.DebtsPage)
      },
      {
        path: 'savings',
        loadComponent: () => import('./features/savings/savings.page').then((m) => m.SavingsPage)
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/assets/assets.page').then((m) => m.AssetsPage)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
