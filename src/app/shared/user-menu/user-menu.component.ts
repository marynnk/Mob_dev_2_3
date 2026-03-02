import { Component, inject, Input, ViewChild } from '@angular/core';
import { Profile } from '../../core/models/profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import {
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss'],
    imports: [IonButton, IonPopover, IonList, IonItem, IonIcon, IonLabel],
})
export class UserMenuComponent {
    @Input() account: Profile | null = null;
    @ViewChild(IonPopover) private popover!: IonPopover;

    private authService = inject(AuthService);

    constructor() {
        addIcons({ logOutOutline });
    }

    get initials(): string {
        return this.account?.displayName?.charAt(0).toUpperCase() ?? '?';
    }

    async logout() {
        await this.popover.dismiss();

        const result = await ActionSheet.showActions({
            title: 'Вийти з акаунту?',
            options: [
                { title: 'Скасувати' },
                { title: 'Вийти', style: ActionSheetButtonStyle.Destructive },
            ],
        });

        if (result.index === 1) {
            await this.authService.logout();
        }
    }
}
