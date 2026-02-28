import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, from, merge, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, take, tap } from 'rxjs/operators';
import {
    BiometricAuth,
    BiometryError,
    BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
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
        PrivacyScreen.enable({
            android: { dimBackground: true, privacyModeOnActivityHidden: 'splash' },
            ios: { blurEffect: 'light' },
        });

        merge(
            of('lock' as const),
            this.appInactive$().pipe(map(() => 'lock' as const)),
            this.retrySubject.pipe(map(() => 'auth' as const)),
        ).pipe(
            exhaustMap((action) =>
                action === 'lock' ? this.lockIfLoggedIn$() : this.authenticate$()
            ),
        ).subscribe();
    }

    retry(): void {
        this.retrySubject.next();
    }

    private appInactive$(): Observable<void> {
        return new Observable<void>((subscriber) => {
            let handle: PluginListenerHandle | undefined;

            App.addListener('appStateChange', ({ isActive }) => {
                if (!isActive) subscriber.next();
            }).then((h) => { handle = h; });

            return () => void handle?.remove();
        });
    }

    private lockIfLoggedIn$(): Observable<void> {
        return from(this.auth.authStateReady()).pipe(
            switchMap(() => this.authService.isLoggedIn$.pipe(take(1))),
            tap((isLoggedIn) => {
                if (isLoggedIn) this.isLocked.set(true);
            }),
            map(() => void 0),
            catchError(() => EMPTY),
        );
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
