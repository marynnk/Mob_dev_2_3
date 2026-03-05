import { inject, Injectable } from '@angular/core';
import { from, Observable, of, switchMap } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { Task } from '../models/task.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private translate = inject(TranslateService);

    private notificationId(taskId: number): number {
        return Math.abs(taskId % 2147483647);
    }

    private notifyLabel(minutes: number): string {
        if (minutes < 60) return `${minutes} min`;
        if (minutes < 1440) return `${minutes / 60} h`;
        return `${minutes / 1440} d`;
    }

    requestPermissions$(): Observable<void> {
        return from(LocalNotifications.requestPermissions()).pipe(
            switchMap(() => from(Badge.requestPermissions())),
            switchMap(() => of(undefined))
        );
    }

    syncTaskNotification$(task: Task): Observable<void> {
        const id = this.notificationId(task.id);
        return from(LocalNotifications.cancel({ notifications: [{ id }] })).pipe(
            switchMap(() => {
                if (task.completed || !task.dueDate || !task.notifyBefore) {
                    return of(undefined);
                }
                const notifyMs = task.notifyBefore * 60_000;
                const at = new Date(new Date(task.dueDate).getTime() - notifyMs);
                if (at <= new Date()) {
                    return of(undefined);
                }
                const label = this.notifyLabel(task.notifyBefore);
                return from(LocalNotifications.schedule({
                    notifications: [{
                        id,
                        title: this.translate.instant('NOTIFICATIONS.TASK_DUE_TITLE', { title: task.title, hours: label }),
                        body: task.description ?? this.translate.instant('NOTIFICATIONS.TASK_DUE_BODY'),
                        schedule: { at },
                    }],
                })).pipe(switchMap(() => of(undefined)));
            })
        );
    }

    cancelTaskNotification$(taskId: number): Observable<void> {
        const id = this.notificationId(taskId);
        return from(LocalNotifications.cancel({ notifications: [{ id }] })).pipe(
            switchMap(() => of(undefined))
        );
    }

    setBadge$(count: number): Observable<void> {
        return from(Badge.set({ count })).pipe(
            switchMap(() => of(undefined))
        );
    }
}
