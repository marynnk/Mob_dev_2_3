import { inject, Injectable } from '@angular/core';
import { filter, firstValueFrom, from, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Auth, authState } from '@angular/fire/auth';
import {
    User,
    confirmPasswordReset,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    verifyPasswordResetCode,
} from 'firebase/auth';
import { Profile } from '../models/profile.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly auth = inject(Auth);
    private router = inject(Router);

    readonly user$: Observable<User | null> = authState(this.auth).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
    );

    readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(
        map((u) => !!u),
        shareReplay({ bufferSize: 1, refCount: false }),
    );

    async login(email: string, password: string): Promise<User> {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        return cred.user;
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        await firstValueFrom(this.user$.pipe(filter(u => !u)));
        await this.router.navigate(['/login']);
    }

    async register(email: string, password: string, extra: Omit<Profile, 'uid'>): Promise<User> {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        if (extra.displayName?.trim()) {
            await updateProfile(cred.user, { displayName: extra.displayName.trim() });
        }
        return cred.user;
    }

    sendPasswordReset$(email: string) {
        return from(sendPasswordResetEmail(this.auth, email, {
            url: `https://${environment.firebase.projectId}.firebaseapp.com/__/auth/action`,
            handleCodeInApp: true,
        }));
    }

    verifyResetCode$(oobCode: string): Observable<string> {
        return from(verifyPasswordResetCode(this.auth, oobCode));
    }

    confirmPasswordReset$(oobCode: string, newPassword: string) {
        return from(confirmPasswordReset(this.auth, oobCode, newPassword));
    }
}
