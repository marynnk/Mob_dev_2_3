import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, from, map, switchMap } from 'rxjs';
import { Profile } from '../../core/models/profile.model';
import { AccountService } from '../../core/services/account.service';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { TaskItemComponent } from '../../shared/task-item/task-item.component';
import { NotificationService } from '../../core/services/notification.service';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';

@Component({
    selector: 'app-home',
    templateUrl: 'items.page.html',
    styleUrls: ['items.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonList, IonButtons, TaskItemComponent, UserMenuComponent],
})
export class ItemsPage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private tasksService = inject(TaskService);
    private accountService = inject(AccountService);
    private notificationService = inject(NotificationService);

    items: Array<Task> = [];
    account: Profile | null = null;

    constructor() {
        addIcons({ add });

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

    toggleTask(task: Task) {
        const updated = { ...task, completed: !task.completed };
        this.tasksService.updateTask$(task, { completed: updated.completed }).pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.notificationService.syncTaskNotification$(updated)),
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
            switchMap(() => this.notificationService.cancelTaskNotification$(task.id)),
        ).subscribe(() => Haptics.notification({ type: NotificationType.Success }));
    }

    editTask(task: Task) {
        this.router.navigate(['/item', task.id]);
    }
}
