import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { TaskPhoto } from '../../core/models/task.model';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, closeCircle } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-photo-grid',
    templateUrl: './photo-grid.component.html',
    imports: [
        IonIcon,
        TranslatePipe,
    ],
    styleUrls: ['./photo-grid.component.scss']
})
export class PhotoGridComponent {
    @Input() photos: TaskPhoto[] = [];
    @Input() pendingPhotos: { webPath: string; preview: string }[] = [];

    @Output() openPhoto = new EventEmitter<string>();
    @Output() addPhoto = new EventEmitter<string>();
    @Output() removeNewPhoto = new EventEmitter<number>();
    @Output() removeExistingPhoto = new EventEmitter<TaskPhoto>();

    private translate = inject(TranslateService);

    constructor() {
        addIcons({ cameraOutline, closeCircle });
    }

    async pickPhoto() {
        const result = await ActionSheet.showActions({
            title: this.translate.instant('PHOTO.PICK_TITLE'),
            options: [
                { title: this.translate.instant('PHOTO.CAMERA') },
                { title: this.translate.instant('PHOTO.GALLERY') },
                { title: this.translate.instant('PHOTO.CANCEL'), style: ActionSheetButtonStyle.Cancel },
            ],
        });

        if (result.index === 2) return;

        const source = result.index === 0 ? CameraSource.Camera : CameraSource.Photos;

        try {
            const image = await Camera.getPhoto({
                quality: 30,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source,
            });

            if (image.webPath) {
                this.addPhoto.emit(image.webPath);
            }
        } catch {

        }
    }

    handleOpenPhoto(path: string) {
        this.openPhoto.emit(path);
    }

    handleRemoveExisting(photo: TaskPhoto) {
        this.removeExistingPhoto.emit(photo);
    }

    handleRemoveAdded(index: number) {
        this.removeNewPhoto.emit(index);
    }
}
