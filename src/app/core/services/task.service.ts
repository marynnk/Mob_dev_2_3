import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, from, map, Observable, shareReplay, switchMap, take, tap } from 'rxjs';
import {Task} from '../models/task.model';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private readonly tasksKey = 'tasks';
    private storage = inject(Storage);

    private items$ = new BehaviorSubject<Task[]>([]);
    private storageReady$ = from(this.storage.create())
        .pipe(shareReplay(1));

    constructor() {
        this.load();
    }

    private load() {
        this.storageReady$
            .pipe(
                switchMap(() => from(this.storage.get(this.tasksKey))),
                map(items => items ?? [])
            )
            .subscribe(items => this.items$.next(items));
    }

    private save(items: Array<Task>): Observable<Array<Task>> {
        this.items$.next(items);
        return from(this.storage.set(this.tasksKey, items));
    }

    getItems$(): Observable<Task[]> {
        return this.items$.asObservable();
    }

    getItemById$(id: number): Observable<Task | null> {
        return this.items$.pipe(
            map(items => items.find(item => item.id === id) ?? null)
        );
    }

    addItem$(item: Partial<Task>): Observable<Array<Task>> {
        const task = { completed: false, ...item, id: Date.now() } as Task;
        return this.items$.pipe(
            take(1),
            map(items => [task, ...items]),
            switchMap(items =>
                from(this.storage.set(this.tasksKey, items)).pipe(
                    tap(() => this.items$.next(items))
                )
            )
        );
    }

    update(id: number, taskItem: Partial<Task>) {
        return this.items$.pipe(
            take(1),
            map(items =>
                items.map(item =>
                    item.id === id
                        ? { ...item, ...taskItem }
                        : item
                )
            ),
            switchMap(this.save.bind(this))
        );
    }

    removeItem$(predicate: (item: Task) => boolean): Observable<Array<Task>> {
        return this.items$.pipe(
            map(items => items.filter(i => !predicate(i))),
            tap(items => this.save(items))
        );
    }
}
