import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, arrayUnion } from '@angular/fire/firestore';
import { filter, firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
    private readonly firestore = inject(Firestore);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly ngZone = inject(NgZone);

    async init(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;

        try {
            OneSignal.initialize(environment.oneSignalAppId);

            OneSignal.Notifications.addEventListener('click', (event) => {
                const data = event.notification.additionalData as Record<string, unknown> | undefined;
                const taskId = data?.['taskId'] as string | undefined;
                if (taskId) {
                    this.ngZone.run(() => {
                        void this.router.navigate(['/item', taskId]);
                    });
                }
            });

            await OneSignal.Notifications.requestPermission(true);

            const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
            if (!subscriptionId) return;

            const user = await firstValueFrom(
                this.authService.user$.pipe(filter(u => !!u))
            );
            if (!user) return;

            const userDocRef = doc(this.firestore, 'users', user.uid);
            await setDoc(userDocRef, { oneSignalIds: arrayUnion(subscriptionId) }, { merge: true });

            console.log('[PushService] Initialized. subscriptionId:', subscriptionId);
        } catch (error) {
            console.error('[PushService.init]', error);
        }
    }
}
