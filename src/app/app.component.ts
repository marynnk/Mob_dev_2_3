import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BiometricService } from './core/services/biometric.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, globeOutline } from 'ionicons/icons';
import { ConnectionService } from './core/services/connection.service';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { NotificationService } from './core/services/notification.service';
import { TaskService } from './core/services/task.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SettingsService } from './core/services/settings.servce';
import { PushService } from './core/services/push.service';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [IonApp, IonRouterOutlet, IonButton, IonIcon, AsyncPipe, TranslatePipe],
})
export class AppComponent implements OnInit {
    readonly biometricService = inject(BiometricService);
    readonly connectionService = inject(ConnectionService);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);
    private readonly taskService = inject(TaskService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly pushService = inject(PushService);
    private translate = inject(TranslateService);
    private settings = inject(SettingsService);

    constructor() {
        addIcons({ lockClosedOutline, globeOutline });
        this.translate.addLangs(['uk', 'en']);
        this.translate.setFallbackLang('en');
        this.translate.use(this.settings.getLanguage());
    }

    ngOnInit(): void {
        void this.biometricService.init();

        void App.addListener('appUrlOpen', ({ url }) => {
            try {
                const params = new URL(url).searchParams;
                const mode = params.get('mode');
                const oobCode = params.get('oobCode');
                if (mode === 'resetPassword' && oobCode) {
                    void this.router.navigate(['/reset-password'], { queryParams: { oobCode } });
                }
            } catch {}
        });

        this.biometricService.suppressLock();
        this.notificationService.requestPermissions$().pipe(
            catchError(() => of(undefined)),
            switchMap(() => {
                this.biometricService.restoreLock();
                void this.pushService.init();
                return this.taskService.getItems$();
            }),
            map(items => items.filter(t => !t.completed).length),
            switchMap(count => this.notificationService.setBadge$(count)),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    retry(): void {
        void this.biometricService.retry();
    }
}
