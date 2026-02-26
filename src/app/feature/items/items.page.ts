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
import { filter, firstValueFrom } from 'rxjs';
import { Profile } from '../../core/models/profile.model';
import { AccountService } from '../../core/services/account.service';

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
    private authService = inject(AuthService);
    private tasksService = inject(TaskService);
    private accountService = inject(AccountService);

    items: Array<Task> = [];
    account: Profile | null = null;

    constructor() {
        addIcons({ add, checkmarkCircle, radioButtonOff, logOutOutline, trashOutline, createOutline });

        this.tasksService.getItems$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(items => this.items = items);

        this.accountService.getAccount$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(account => this.account = account);
    }

    addItem() {
        this.router.navigate(['/item/add']);
    }

    async logout() {
        await this.authService.logout();
        await firstValueFrom(this.authService.user$.pipe(filter(u => !u)));
        this.router.navigate(['/login']);
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
