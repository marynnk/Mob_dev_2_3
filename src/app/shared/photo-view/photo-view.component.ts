import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
    selector: 'app-photo-view',
    templateUrl: './photo-view.component.html',
    imports: [
        IonModal,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent
    ],
    styleUrls: ['./photo-view.component.scss']
})

export class PhotoViewComponent {
    @Input() photoUrl: string = '';

    @Output() closeViewer = new EventEmitter<void>();

    constructor() {
        addIcons({ close });
    }

    get isOpen() {
        return !!this.photoUrl;
    }

    closePhoto() {
        this.closeViewer.emit();
    }
}
