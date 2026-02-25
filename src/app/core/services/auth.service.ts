import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {Auth, authState} from '@angular/fire/auth';
import {
    User,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Register } from '../models/register.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly auth = inject(Auth);
    private readonly firestore = inject(Firestore);

    readonly user$: Observable<User | null> = authState(this.auth).pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(
        map((u) => !!u),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    constructor() {
        void setPersistence(this.auth, browserLocalPersistence);
    }

    async login(email: string, password: string): Promise<User> {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        return cred.user;
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }

    async register(email: string, password: string, extra: Omit<Register, 'uid'>): Promise<User> {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);

        if (extra.displayName?.trim()) {
            await updateProfile(cred.user, { displayName: extra.displayName.trim() });
        }

        const registerData: Register = {
            ...extra,
            email,
            uid: cred.user.uid,
            createdAt: serverTimestamp(),
        };
        await setDoc(doc(this.firestore, 'users', cred.user.uid), registerData, { merge: true });
        return cred.user;
    }
}
