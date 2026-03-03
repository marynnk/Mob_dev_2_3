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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss'],
    imports: [IonButton, IonPopover, IonList, IonItem, IonIcon, IonLabel, TranslatePipe],
})
export class UserMenuComponent {
    @Input() account: Profile | null = null;
    @ViewChild(IonPopover) private popover!: IonPopover;

    private authService = inject(AuthService);
    private translate = inject(TranslateService);

    constructor() {
        addIcons({ logOutOutline });
    }

    get initials(): string {
        return this.account?.displayName?.charAt(0).toUpperCase() ?? '?';
    }

    async logout() {
        await this.popover.dismiss();

        const result = await ActionSheet.showActions({
            title: this.translate.instant('USER_MENU.LOGOUT_CONFIRM_TITLE'),
            options: [
                { title: this.translate.instant('USER_MENU.LOGOUT_CANCEL') },
                { title: this.translate.instant('USER_MENU.LOGOUT_CONFIRM'), style: ActionSheetButtonStyle.Destructive },
            ],
        });

        if (result.index === 1) {
            await this.authService.logout();
        }
    }
}
