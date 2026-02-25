import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard = async () => {
    const router = inject(Router);
    const authService = inject(AuthService);

    const isLoggedIn = await firstValueFrom(authService.isLoggedIn$);

    if (!isLoggedIn) {
        await router.navigate(['/login']);
        return false;
    }
    return true;
};
