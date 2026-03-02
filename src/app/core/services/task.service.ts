import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Task, TaskPhoto } from '../models/task.model';
import {
    collection,
    collectionData,
    deleteDoc,
    doc,
    Firestore,
    query,
    serverTimestamp,
    setDoc,
    where,
} from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private readonly collection = 'tasks';
    private readonly firestore = inject(Firestore);
    private readonly storage = inject(Storage);
    private readonly authService = inject(AuthService);

    private items$ = new BehaviorSubject<Task[]>([]);

    constructor() {
        this.load();
    }

    private loadTaskByUser(user: User | null) {
        if (!user) {
            return of([]);
        }

        const tasksRef = collection(this.firestore, this.collection);
        const tasksQuery = query(tasksRef, where('userId', '==', user.uid));
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
        return this.authService.user$.pipe(
            take(1),
            switchMap(user => this.upsertTaskForUser(task, user!))
        );
    }

    private load() {
        this.authService.user$
            .pipe(
                switchMap(user => this.loadTaskByUser(user).pipe(
                    catchError(() => of([]))
                ))
            ).subscribe(items => this.items$.next(items));
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
        const task = { id: Date.now(), completed: false, ...item, createdAt: serverTimestamp() } as Task;
        return this.items$.pipe(
            take(1),
            switchMap(items => {
                const updated = [task, ...items.filter(i => i.id !== task.id)];
                return this.upsertTask(task).pipe(
                    tap(() => this.items$.next(updated)),
                    map(() => updated)
                );
            })
        );
    }

    updateTask$(task: Task, updateItem: Partial<Task>) {
        task = { ...task, ...updateItem };
        return this.items$.pipe(
            take(1),
            switchMap(items => {
                const updated = items.map(item => item.id === task.id ? task : item);
                return this.upsertTask(task).pipe(
                    tap(() => this.items$.next(updated)),
                    map(() => updated)
                );
            })
        );
    }

    removeItem$(task: Task): Observable<Array<Task>> {
        return this.items$.pipe(
            take(1),
            switchMap(items => {
                const updated = items.filter(item => item.id !== task.id);
                return from(deleteDoc(doc(this.firestore, this.collection, task.id.toString()))).pipe(
                    tap(() => this.items$.next(updated)),
                    map(() => updated),
                    catchError(err => {
                        console.error('removeItem$ failed:', err);
                        return throwError(() => err);
                    })
                );
            })
        );
    }

    uploadPhoto$(taskId: number, blob: Blob): Observable<TaskPhoto> {
        return this.authService.user$.pipe(
            take(1),
            switchMap(user => {
                const storagePath = `tasks/${taskId}/${user!.uid}/${Date.now()}.jpg`;
                const storageRef = ref(this.storage, storagePath);
                return from(uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' })).pipe(
                    switchMap(() => from(getDownloadURL(storageRef))),
                    map(url => ({
                        url,
                        uploadedAt: new Date().toISOString(),
                        storagePath,
                    } as TaskPhoto))
                );
            })
        );
    }

    deletePhoto$(storagePath: string): Observable<void> {
        const storageRef = ref(this.storage, storagePath);
        return from(deleteObject(storageRef)).pipe(
            catchError(() => of(undefined))
        );
    }
}
