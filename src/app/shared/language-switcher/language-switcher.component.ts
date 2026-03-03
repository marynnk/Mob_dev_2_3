import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { SettingsService } from '../../core/services/settings.servce';

@Component({
    selector: 'app-language-switcher',
    templateUrl: './language-switcher.component.html',
    imports: [
        IonButton,
        IonIcon
    ],
    styleUrls: ['./language-switcher.component.scss']
})

export class LanguageSwitcherComponent {
    private settings = inject(SettingsService);
    private translate = inject(TranslateService);

    get languages() {
        return this.translate.getLangs();
    }

    get currentLanguage() {
        return this.translate.getCurrentLang();
    }

    protected setLanguage(lang: string) {
        this.translate.use(lang);
        this.settings.setLanguage(lang);
    }
}
