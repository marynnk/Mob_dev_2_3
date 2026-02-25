import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';
import { map, Subject, takeUntil, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-edit-item',
    templateUrl: 'item-edit.page.html',
    styleUrls: ['item-edit.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
        ReactiveFormsModule, IonButton, IonIcon, IonInput, IonTextarea],
})
export class ItemEditPage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private activatedRoute = inject(ActivatedRoute);
    private tasksService = inject(TaskService);
    private task: Task | null = null;
    private leaveSubject = new Subject<void>();

    form = this.getForm();

    constructor() {
        addIcons({ saveOutline });
        this.destroyRef.onDestroy(() => {
            this.leaveSubject.next();
            this.leaveSubject.complete();
        });
    }

    get id() {
        return Number(this.activatedRoute.snapshot.paramMap.get('id')) || null;
    }

    get isEdit() {
        return this.id !== null;
    }

    getForm(task?: Task | null) {
        return this.fb.group({
            title: [task?.title ?? '', [Validators.required, Validators.maxLength(100)]],
            description: [task?.description ?? '', [Validators.maxLength(100)]],
        });
    }

    fieldInvalid(name: string) {
        const c = this.form.get(name);
        return !!c && c.invalid && c.dirty && c.touched;
    }

    fieldError(name: string): string {
        const c = this.form.get(name);
        if (!c) return '';
        if (c.hasError('required')) return 'Поле є обовʼязковим';
        if (c.hasError('maxlength')) {
            return `Максимум ${c.errors?.['maxlength']?.requiredLength as number} символів`;
        }
        return '';
    }

    ionViewWillEnter() {
        if (!this.isEdit) {
            this.form = this.getForm();
            return;
        }
        this.tasksService.getItem$(this.id!).pipe(
            takeUntil(this.leaveSubject),
            tap(task => this.task = task),
            map(task => this.getForm(task))
        ).subscribe(form => this.form = form);
    }

    ionViewWillLeave() {
        this.leaveSubject.next();
    }

    saveAction() {
        const taskData = this.form.getRawValue() as Task;
        const save$ = this.isEdit ?
            this.tasksService.updateTask$(this.task!, taskData) :
            this.tasksService.addTask$(taskData);
        return save$.pipe(takeUntilDestroyed(this.destroyRef));
    }

    save() {
        if (this.form.valid) {
            this.saveAction()
                .subscribe(() => this.router.navigate(['']));
        } else {
            this.form.markAllAsTouched();
        }
    }
}
