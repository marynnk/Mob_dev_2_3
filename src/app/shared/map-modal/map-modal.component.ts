import { Component, ElementRef, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { GoogleMap } from '@capacitor/google-maps';
import type { Marker } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { LatLng, MapMarkerType, MapPoint, LocationPoint } from '../../core/models/map.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

const DEFAULT_LOCATION: LatLng = { lat: 50.4501, lng: 30.5234 };
const DEFAULT_ZOOM = 15;

@Component({
    selector: 'app-map-modal',
    templateUrl: './map-modal.component.html',
    styleUrls: ['./map-modal.component.scss'],
    imports: [
        IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
        IonIcon, IonContent, IonFooter, IonSpinner, TranslatePipe,
    ],
})
export class MapModalComponent implements OnDestroy {
    @Input() mode: 'view' | 'pick' = 'view';
    @Input() points: MapPoint[] = [];
    @Input() markerType?: MapMarkerType;
    @Input() initialLocation?: LatLng;
    @ViewChild('mapRef') private mapRef!: ElementRef<HTMLDivElement>;

    private readonly modalCtrl = inject(ModalController);
    private readonly translate = inject(TranslateService);
    private map: GoogleMap | null = null;

    protected centerLocation: LatLng = DEFAULT_LOCATION;
    protected loading = true;
    protected confirming = false;
    protected error = '';

    constructor() {
        addIcons({ closeOutline, checkmarkOutline });
    }

    async ionViewDidEnter(): Promise<void> {
        await this.initMap();
    }

    private async initMap(): Promise<void> {
        const el = this.mapRef?.nativeElement;
        const language = this.translate.getCurrentLang();
        if (!el) return;

        try {
            let center: LatLng = DEFAULT_LOCATION;

            if (this.mode === 'pick') {
                center = this.initialLocation ?? await this.getCurrentLocation();
            } else if (this.points.length > 0) {
                center = this.calcCenter(this.points.map(p => p.location));
            }

            this.centerLocation = center;

            this.map = await GoogleMap.create({
                id: 'app-map-' + Date.now(),
                element: el,
                apiKey: environment.googleMapsApiKey,
                config: {
                    center: { lat: center.lat, lng: center.lng },
                    zoom: DEFAULT_ZOOM,
                },
                language,
            });

            if (this.mode === 'view' && this.points.length > 0) {
                await this.renderViewPoints();
            }

            if (this.mode === 'pick') {
                await this.map.setOnCameraIdleListener(({ latitude, longitude }) => {
                    this.centerLocation = { lat: latitude, lng: longitude };
                });
            }

            this.loading = false;
        } catch (error) {
            console.error('[MapModal]', error);
            this.error = this.translate.instant('MAP.LOAD_ERROR');
            this.loading = false;
        }
    }

    private async getCurrentLocation(): Promise<LatLng> {
        try {
            const pos = await Geolocation.getCurrentPosition({ timeout: 10000 });
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
            return DEFAULT_LOCATION;
        }
    }

    private calcCenter(locations: LatLng[]): LatLng {
        return {
            lat: locations.reduce((s, l) => s + l.lat, 0) / locations.length,
            lng: locations.reduce((s, l) => s + l.lng, 0) / locations.length,
        };
    }

    private async renderViewPoints(): Promise<void> {
        if (!this.map) return;

        const markers: Marker[] = this.points.map(p => ({
            coordinate: { lat: p.location.lat, lng: p.location.lng },
            title: p.title,
            snippet: p.description,
            iconUrl: this.resolvePointer(p.type),
            iconSize: { width: 30, height: 40 },
        }));

        await this.map.addMarkers(markers);

        const { center, zoom } = this.getFitCamera(this.points.map(p => p.location));
        await this.map.setCamera({ coordinate: center, zoom, animate: true });
    }

    private getFitCamera(locations: LatLng[]): { center: LatLng; zoom: number } {
        if (locations.length === 1) {
            return { center: locations[0], zoom: DEFAULT_ZOOM };
        }

        const lats = locations.map(l => l.lat);
        const lngs = locations.map(l => l.lng);

        const center: LatLng = {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        };

        const latSpan = (Math.max(...lats) - Math.min(...lats)) * 1.6 || 0.01;
        const lngSpan = (Math.max(...lngs) - Math.min(...lngs)) * 1.6 || 0.01;
        const zoom = Math.max(
            Math.min(Math.floor(Math.log2(180 / Math.max(latSpan, lngSpan / 2))), 18),
            1,
        );

        return { center, zoom };
    }

    protected resolvePointer(type?: MapMarkerType): string {
        type = type || 'other';
        return `/assets/icon/map/${type}.png`;
    }

    protected async confirm(): Promise<void> {
        this.confirming = true;
        const address = await this.reverseGeocode(this.centerLocation);
        const result: LocationPoint = { ...this.centerLocation, address };
        await this.modalCtrl.dismiss(result, 'confirm');
    }

    private async reverseGeocode(location: LatLng): Promise<string | undefined> {
        const language = this.translate.getCurrentLang();
        const params = new URLSearchParams({
            latlng: `${location.lat},${location.lng}`,
            key: environment.googleMapsApiKey,
            ...(language ? { language: language } : {}),
        });
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
                { signal: controller.signal },
            );
            clearTimeout(timeout);
            const data = await response.json() as { status: string; results: Array<{ formatted_address: string }> };
            if (data.status === 'OK' && data.results.length > 0) {
                return data.results[0].formatted_address;
            }
        } catch (error) {
            console.error('[MapModal.geoCoding]', error);
        }
        return undefined;
    }

    protected async close(): Promise<void> {
        await this.modalCtrl.dismiss(null, 'cancel');
    }

    ngOnDestroy(): void {
        void this.map?.destroy();
    }
}
