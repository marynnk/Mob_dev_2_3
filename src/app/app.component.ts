import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BiometricService } from './core/services/biometric.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, globeOutline } from 'ionicons/icons';
import { ConnectionService } from './core/services/connection.service';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [IonApp, IonRouterOutlet, IonButton, IonIcon, AsyncPipe],
})
export class AppComponent implements OnInit {
    readonly biometricService = inject(BiometricService);
    readonly connectionService = inject(ConnectionService);
    private readonly router = inject(Router);

    constructor() {
        addIcons({ lockClosedOutline, globeOutline });
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
    }

    retry(): void {
        void this.biometricService.retry();
    }
}
