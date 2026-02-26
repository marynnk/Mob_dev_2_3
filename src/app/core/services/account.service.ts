import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
    collection,
    collectionData,
    doc,
    Firestore,
    query,
    serverTimestamp,
    setDoc,
    where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';
import { Profile } from '../models/profile.model';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private readonly collection = 'users';
    private readonly firestore = inject(Firestore);
    private readonly authService = inject(AuthService);

    private account$ = new BehaviorSubject<Profile | null>(null);

    getAccount$(): Observable<Profile | null> {
        return this.account$;
    }

    constructor() {
        this.loadAccount();
    }

    private findUserAccount(user: User | null) {
        if (!user) {
            return of(null);
        }

        const profileRef = collection(this.firestore, this.collection);
        const profileQuery = query(profileRef, where('uid', '==', user.uid));
        return collectionData(profileQuery).pipe(switchMap(profiles => profiles.length > 0 ? of(profiles[0] as Profile) : of(null)));
    }

    private loadAccount() {
        this.authService.user$
            .pipe(
                switchMap(user => this.findUserAccount(user).pipe(
                    catchError(() => of(null))
                ))
            ).subscribe(account => this.account$.next(account));
    }

    private upsertProfileForUser(profile: Profile, user: User) {
        const profileDoc = doc(this.firestore, this.collection, user.uid.toString());

        return setDoc(profileDoc, {
            ...profile,
            uid: user.uid,
            updatedAt: serverTimestamp(),
        });
    }

    private upsertProfile(profile: Profile) {
        return this.authService.user$.pipe(
            take(1),
            switchMap(user => this.upsertProfileForUser(profile, user!))
        );
    }

    addProfile$(profileData: Profile, user: User): Observable<Profile> {
        const registerData: Profile = {
            ...profileData,
            uid: user.uid,
            createdAt: serverTimestamp(),
        };
        return this.account$.pipe(
            take(1),
            switchMap(profile => {
                const updated = {...profile, ...registerData, createdAt: serverTimestamp() };
                return this.upsertProfile(updated).pipe(
                    tap(() => this.account$.next(updated)),
                    map(() => updated)
                );
            })
        );
    }

}
