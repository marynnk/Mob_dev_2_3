import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, from, firstValueFrom } from 'rxjs';
import { catchError, exhaustMap, tap } from 'rxjs/operators';
import {
    BiometricAuth,
    BiometryError,
    BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';
import { App } from '@capacitor/app';
import { PrivacyScreen } from '@capacitor/privacy-screen';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BiometricService {
    private readonly authService = inject(AuthService);
    private readonly auth = inject(Auth);

    readonly isLocked = signal(false);

    private failureCount = 0;
    private readonly MAX_FAILURES = 2;
    private readonly retrySubject = new Subject<void>();

    init(): void {
        this.lockIfLoggedIn();
        PrivacyScreen.enable({
            android: {
                dimBackground: true,
                privacyModeOnActivityHidden: 'splash'
            },
            ios: {
                blurEffect: 'light'
            }
        });

        App.addListener('appStateChange', async ({ isActive }) => {
            if (!isActive) {
                await this.lockIfLoggedIn();
            }
        });

        this.retrySubject.pipe(
            exhaustMap(() => this.authenticate$()),
        ).subscribe();
    }

    retry(): void {
        this.retrySubject.next();
    }

    private async lockIfLoggedIn(): Promise<void> {
        await this.auth.authStateReady();
        const isLoggedIn = await firstValueFrom(this.authService.isLoggedIn$);
        if (isLoggedIn) {
            this.isLocked.set(true);
        }
    }

    private authenticate$(): Observable<void> {
        return from(
            BiometricAuth.authenticate({
                reason: 'Підтвердіть особу для входу в додаток',
                cancelTitle: 'Скасувати',
            }),
        ).pipe(
            tap(() => {
                this.failureCount = 0;
                this.isLocked.set(false);
            }),
            catchError((error) => {
                if (!(error instanceof BiometryError)) {
                    this.isLocked.set(false);
                    return EMPTY;
                }

                switch (error.code) {
                    case BiometryErrorType.authenticationFailed:
                    case BiometryErrorType.userCancel:
                    case BiometryErrorType.systemCancel:
                    case BiometryErrorType.appCancel: {
                        this.failureCount++;
                        if (this.failureCount >= this.MAX_FAILURES) {
                            this.failureCount = 0;
                            this.isLocked.set(false);
                            return from(this.authService.logout());
                        }
                        return EMPTY;
                    }

                    case BiometryErrorType.biometryLockout: {
                        this.failureCount = 0;
                        this.isLocked.set(false);
                        return from(this.authService.logout());
                    }

                    default:
                        this.isLocked.set(false);
                        return EMPTY;
                }
            }),
        );
    }
}
