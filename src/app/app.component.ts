import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BiometricService } from './core/services/biometric.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, globeOutline } from 'ionicons/icons';
import { ConnectionService } from './core/services/connection.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [IonApp, IonRouterOutlet, IonButton, IonIcon, AsyncPipe],
})
export class AppComponent implements OnInit {
    readonly biometricService = inject(BiometricService);
    readonly connectionService = inject(ConnectionService);

    constructor() {
        addIcons({ lockClosedOutline, globeOutline });
    }

    ngOnInit(): void {
        void this.biometricService.init();
    }

    retry(): void {
        void this.biometricService.retry();
    }
}
