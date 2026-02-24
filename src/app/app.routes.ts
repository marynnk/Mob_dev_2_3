import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    },
    {
        path: 'item',
        loadComponent: () => import('./edit-item/edit-item.page').then((m) => m.EditItemPage),
    },
    {
        path: 'item/:id',
        loadComponent: () => import('./edit-item/edit-item.page').then((m) => m.EditItemPage),
    },
    {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
    },
];
