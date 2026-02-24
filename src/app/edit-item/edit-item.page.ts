import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons, IonBackButton, IonList, IonItem, IonInput, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../core/services/task.service';
import { Task } from '../core/models/Task';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-edit-item',
    templateUrl: 'edit-item.page.html',
    styleUrls: ['edit-item.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonInput,
        ReactiveFormsModule, IonButton],
})
export class EditItemPage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private activatedRoute = inject(ActivatedRoute);
    private tasksService = inject(TaskService);
    private task: Task = {} as Task;

    form = this.getForm();

    constructor() {
        addIcons({
            add,
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
            description: [task?.description ?? '', [Validators.maxLength(100)]]
        })
    }

    fieldInvalid(name: string) {
        const c = this.form.get(name);
        return !!c && c.invalid && c.dirty && c.touched;
    }

    ionViewWillEnter() {
        if (!this.isEdit) {
            this.form = this.getForm();
        } else {
            this.tasksService.getItemById$(this.id!)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .pipe(map(task => this.getForm(task)))
                .subscribe(form => this.form = form);
        }
    }

    saveAction() {
        const { value: task } = this.form;
        const save$ = this.isEdit ?
            this.tasksService.update(this.id!, task as Task) :
            this.tasksService.addItem$(task as Task);
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
