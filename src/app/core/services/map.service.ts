import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapMarkerType, MapPoint, LocationPoint } from '../models/map.model';
import { MapModalComponent } from '../../shared/map-modal/map-modal.component';

@Injectable({ providedIn: 'root' })
export class MapService {
    private readonly modalCtrl = inject(ModalController);

    async showPoints(points: MapPoint[]): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: MapModalComponent,
            componentProps: { mode: 'view', points },
        });
        await modal.present();
        await modal.onWillDismiss();
    }

    async pickLocation(markerType?: MapMarkerType, initialLocation?: LocationPoint): Promise<LocationPoint | null> {
        const modal = await this.modalCtrl.create({
            component: MapModalComponent,
            componentProps: { mode: 'pick', markerType, initialLocation },
        });
        await modal.present();
        const { data, role } = await modal.onWillDismiss<LocationPoint>();
        return role === 'confirm' ? (data ?? null) : null;
    }
}
