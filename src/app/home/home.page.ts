import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonList, IonItemSliding, IonItem, IonLabel, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, radioButtonOff } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Task } from '../core/models/Task';
import { TaskService } from '../core/services/task.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonList, IonItemSliding,
        IonItem, IonLabel, IonItemOptions, IonItemOption],
})
export class HomePage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private tasksService = inject(TaskService);

    items: Array<Task> = [];

    constructor() {
        addIcons({
            add,
            checkmarkCircle,
            radioButtonOff,
        });

        this.tasksService.getItems$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(items => this.items = items);
    }

    addItem() {
        this.router.navigate(['/item']);
    }

    toggleTask(task: Task, slidingItem: IonItemSliding) {
        this.tasksService.update(task.id, { completed: !task.completed })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => slidingItem.close());
    }

    deleteTask(task: Task, slidingItem: IonItemSliding) {
        this.tasksService.removeItem$(t => t.id === task.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => slidingItem.close());
    }

    editTask(task: Task) {
        this.router.navigate(['/item', task.id]);
    }
}
