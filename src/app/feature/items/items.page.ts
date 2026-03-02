import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, logOutOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, from, map, switchMap } from 'rxjs';
import { Profile } from '../../core/models/profile.model';
import { AccountService } from '../../core/services/account.service';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { TaskItemComponent } from '../../shared/task-item/task-item.component';

@Component({
    selector: 'app-home',
    templateUrl: 'items.page.html',
    styleUrls: ['items.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonList, IonLabel, IonButton, IonButtons, TaskItemComponent],
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
        addIcons({ add, logOutOutline });

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
    }

    toggleTask(task: Task) {
        this.tasksService.updateTask$(task, { completed: !task.completed }).pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => Haptics.notification({ type: NotificationType.Success }));
    }

    confirmTaskDeletion(task: Task) {
        return from(Haptics.notification({ type: NotificationType.Error })).pipe(
            switchMap(() => ActionSheet.showActions({
                title: 'Дійсно видалити задачу?',
                message: task.title,
                options: [
                    { title: 'Ні', },
                    {
                        title: 'Так',
                        style: ActionSheetButtonStyle.Destructive,
                    },
                ],
            })),
            map(({ index }) => index === 1)
        )
    }

    deleteTask(task: Task) {
        this.confirmTaskDeletion(task).pipe(
            takeUntilDestroyed(this.destroyRef),
            filter(Boolean),
            switchMap(() => this.tasksService.removeItem$(task)),
        ).subscribe(() => Haptics.notification({ type: NotificationType.Success }));
    }

    editTask(task: Task) {
        this.router.navigate(['/item', task.id]);
    }
}
