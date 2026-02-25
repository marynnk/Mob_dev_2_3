import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable, switchMap, take, tap } from 'rxjs';
import { Task } from '../models/task.model';
import {
    collection,
    collectionData, deleteDoc,
    doc,
    Firestore,
    query,
    serverTimestamp,
    setDoc,
    where
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private readonly collection = 'tasks';
    private readonly firestore = inject(Firestore);
    private readonly authService = inject(AuthService);

    private items$ = new BehaviorSubject<Task[]>([]);

    constructor() {
        this.load();
    }

    private loadTaskByUser(user: User | null) {
        const tasksRef = collection(this.firestore, this.collection);
        const tasksQuery = query(tasksRef, where('userId', '==', user!.uid));
        return collectionData(tasksQuery).pipe(map(items => items as Task[]));
    }

    private upsertTaskForUser(task: Task, user: User) {
        const taskDoc = doc(this.firestore, this.collection, task.id.toString());

        return setDoc(taskDoc, {
            ...task,
            userId: user.uid,
            updatedAt: serverTimestamp(),
        });
    }

    private upsertTask(task: Task) {
        return this.authService.user$
            .pipe(
                switchMap(user => this.upsertTaskForUser(task, user!))
            );
    }

    private load() {
        this.authService.user$
            .pipe(
                switchMap(this.loadTaskByUser.bind(this))
            ).subscribe((items: Array<Task>) => this.items$.next(items));

    }

    getItems$(): Observable<Task[]> {
        return this.items$.asObservable();
    }

    getItem$(id: number): Observable<Task | null> {
        return this.items$.pipe(
            map(items => items.find(item => item.id === id) ?? null)
        );
    }

    addTask$(item: Partial<Task>): Observable<Array<Task>> {
        const task = { completed: false, ...item, id: Date.now() } as Task;
        return this.items$.pipe(
            take(1),
            map(items => [task, ...items]),
            switchMap(items =>
                from(this.upsertTask(task)).pipe(
                    tap(() => this.items$.next(items)),
                    map(() => items)
                )
            )
        );
    }

    updateTask$(task: Task, updateItem: Partial<Task>) {
        task = { ...task, ...updateItem };
        return this.items$.pipe(
            take(1),
            switchMap(items =>
                from(this.upsertTask(task)).pipe(
                    map(() => items.map(item => item.id === task.id ? task : item)),
                    tap(() => this.items$.next(items)),
                    map(() => items)
                )
            )
        );
    }

    removeItem$(task: Task): Observable<Array<Task>> {
        return this.items$.pipe(
            take(1),
            map(items => items.filter(item => item.id !== task.id)),
            tap(() => deleteDoc(doc(this.firestore, this.collection, task.id.toString()))),
            tap(items => this.items$.next(items))
        );
    }
}
