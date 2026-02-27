import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BiometricService } from './core/services/biometric.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline } from 'ionicons/icons';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [IonApp, IonRouterOutlet, IonButton, IonIcon],
})
export class AppComponent implements OnInit {
    readonly biometricService = inject(BiometricService);

    constructor() {
        addIcons({ lockClosedOutline });
    }

    ngOnInit(): void {
        void this.biometricService.init();
    }

    retry(): void {
        void this.biometricService.retry();
    }
}
