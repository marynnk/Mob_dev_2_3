import { Injectable } from '@angular/core';
import { from, Observable, of, switchMap } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private notificationId(taskId: number): number {
        return Math.abs(taskId % 2147483647);
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
                if (task.completed || !task.dueDate) {
                    return of(undefined);
                }
                const at = new Date(task.dueDate);
                if (at <= new Date()) {
                    return of(undefined);
                }
                return from(LocalNotifications.schedule({
                    notifications: [{
                        id,
                        title: task.title,
                        body: task.description ?? 'Завдання очікує на виконання',
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
