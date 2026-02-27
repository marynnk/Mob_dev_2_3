import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, from, merge, of } from 'rxjs';
import { catchError, exhaustMap, filter, switchMap, take, tap } from 'rxjs/operators';
import {
    BiometricAuth,
    BiometryError,
    BiometryErrorType,
    CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BiometricService {
    private readonly authService = inject(AuthService);
    private readonly auth = inject(Auth);

    readonly isLocked = signal(false);

    private failureCount = 0;
    private readonly MAX_FAILURES = 5;
    private cooldownUntil = 0;
    private readonly COOLDOWN_MS = 2000;

    private readonly retrySubject = new Subject<void>();

    init(): void {
        from(BiometricAuth.checkBiometry()).pipe(
            catchError(() => EMPTY),
            switchMap(() => merge(
                of(null),
                this.resumeEvents$().pipe(filter((i) => i.isAvailable)),
                this.retrySubject,
            )),
            filter(() => Date.now() >= this.cooldownUntil),
            exhaustMap(() => this.lockAndAuthIfLoggedIn$()),
        ).subscribe();
    }

    retry(): void {
        this.retrySubject.next();
    }

    private resumeEvents$(): Observable<CheckBiometryResult> {
        return new Observable<CheckBiometryResult>((subscriber) => {
            let handle: Awaited<ReturnType<typeof BiometricAuth.addResumeListener>>;

            BiometricAuth.addResumeListener((info) => subscriber.next(info))
                .then((h) => {
                    handle = h;
                });

            return () => void handle?.remove();
        });
    }

    private lockAndAuthIfLoggedIn$(): Observable<void> {
        this.isLocked.set(true);

        return from(this.auth.authStateReady()).pipe(
            switchMap(() => this.authService.isLoggedIn$.pipe(take(1))),
            switchMap((isLoggedIn) => {
                if (!isLoggedIn) {
                    this.isLocked.set(false);
                    return EMPTY;
                }
                return this.authenticate$();
            }),
            catchError((e) => {
                this.isLocked.set(false);
                console.error('[BiometricService]', e);
                return EMPTY;
            }),
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
                this.cooldownUntil = Date.now() + this.COOLDOWN_MS;
                this.isLocked.set(false);
            }),
            catchError((error) => {
                if (!(error instanceof BiometryError)) {
                    this.isLocked.set(false);
                    return EMPTY;
                }

                switch (error.code) {
                    case BiometryErrorType.authenticationFailed: {
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

                    case BiometryErrorType.userCancel:
                    case BiometryErrorType.systemCancel:
                    case BiometryErrorType.appCancel:
                        return EMPTY;

                    default:
                        this.isLocked.set(false);
                        return EMPTY;
                }
            }),
        );
    }
}
