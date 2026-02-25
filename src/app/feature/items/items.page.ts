import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonList, IonItemSliding, IonItem, IonLabel, IonItemOptions, IonItemOption,
    IonButton, IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, radioButtonOff, logOutOutline, trashOutline, createOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-home',
    templateUrl: 'items.page.html',
    styleUrls: ['items.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonList, IonItemSliding,
        IonItem, IonLabel, IonItemOptions, IonItemOption, IonButton, IonButtons],
})
export class ItemsPage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private tasksService = inject(TaskService);
    private authService = inject(AuthService);

    items: Array<Task> = [];

    constructor() {
        addIcons({ add, checkmarkCircle, radioButtonOff, logOutOutline, trashOutline, createOutline });

        this.tasksService.getItems$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(items => this.items = items);
    }

    addItem() {
        this.router.navigate(['/item/add']);
    }

    async logout() {
        await this.authService.logout();
        await this.router.navigate(['/login']);
    }

    toggleTask(task: Task, slidingItem: IonItemSliding) {
        this.tasksService.updateTask$(task, { completed: !task.completed })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => slidingItem.close());
    }

    deleteTask(task: Task, slidingItem: IonItemSliding) {
        this.tasksService.removeItem$(task)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => slidingItem.close());
    }

    editTask(task: Task) {
        this.router.navigate(['/item', task.id]);
    }
}
