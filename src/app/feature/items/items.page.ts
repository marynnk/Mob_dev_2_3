import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, createOutline, logOutOutline, radioButtonOff, trashOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { Profile } from '../../core/models/profile.model';
import { AccountService } from '../../core/services/account.service';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import index from 'eslint-plugin-jsdoc';

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
        this.tasksService.updateTask$(task, { completed: !task.completed }).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => Haptics.notification({ type: NotificationType.Success }))
        ).subscribe(() => slidingItem.close());
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

    deleteTask(task: Task, slidingItem: IonItemSliding) {
        slidingItem.close();
        this.confirmTaskDeletion(task).pipe(
            takeUntilDestroyed(this.destroyRef),
            filter(Boolean),
            switchMap(() => this.tasksService.removeItem$(task)),
            switchMap(() => from(Haptics.notification({ type: NotificationType.Success })))
        ).subscribe();
    }

    editTask(task: Task) {
        this.router.navigate(['/item', task.id]);
    }
}
