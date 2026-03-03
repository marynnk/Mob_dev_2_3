import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from './environments/environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAuth } from '@angular/fire/auth';
import { getApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';

void bootstrapApplication(AppComponent, {
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        ModalController,
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => initializeAuth(getApp(), {
            persistence: indexedDBLocalPersistence,
        })),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideHttpClient(),
        provideTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: '/assets/locales/',
                suffix: '.json'
            }),
            fallbackLang: 'en',
            lang: 'uk'
        }),
    ],
});
