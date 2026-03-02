import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [noAuthGuard],
        loadComponent: () => import('./feature/login/login.page').then((m) => m.LoginPage),
    },
    {
        path: 'register',
        canActivate: [noAuthGuard],
        loadComponent: () => import('./feature/register/register.page').then((m) => m.RegisterPage),
    },
    {
        path: 'forgot-password',
        canActivate: [noAuthGuard],
        loadComponent: () => import('./feature/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./feature/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
    },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: 'item',
                loadComponent: () => import('./feature/items/items.page').then((m) => m.ItemsPage),
            },
            {
                path: 'item/add',
                loadComponent: () => import('./feature/item-edit/item-edit.page').then((m) => m.ItemEditPage),
            },
            {
                path: 'item/:id',
                loadComponent: () => import('./feature/item-edit/item-edit.page').then((m) => m.ItemEditPage),
            },
            {
                path: '',
                redirectTo: 'item',
                pathMatch: 'full',
            },
        ]
    }
];
