import { Component, DestroyRef, inject } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonTextarea, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { Task, TaskPhoto } from '../../core/models/task.model';
import { catchError, forkJoin, from, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PhotoGridComponent } from '../../shared/photo-grid/photo-grid.component';
import { PhotoViewComponent } from '../../shared/photo-view/photo-view.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-edit-item',
    templateUrl: 'item-edit.page.html',
    styleUrls: ['item-edit.page.scss'],
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
        ReactiveFormsModule, IonButton, IonIcon, IonInput, IonTextarea, IonSpinner, PhotoGridComponent,
        PhotoViewComponent, TranslatePipe],
})
export class ItemEditPage {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private translate = inject(TranslateService);
    private fb = inject(FormBuilder);
    private activatedRoute = inject(ActivatedRoute);
    private tasksService = inject(TaskService);
    private notificationService = inject(NotificationService);
    private task: Task | null = null;
    private leaveSubject = new Subject<void>();

    form = this.getForm();
    photos: TaskPhoto[] = [];
    pendingPhotos: { webPath: string; preview: string }[] = [];
    deletedPhotoPaths: string[] = [];
    isSaving = false;
    selectedPhotoUrl: string | null = null;
    private photosInitialized = false;

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
            dueDate: [task?.dueDate ?? '', [Validators.required, this.futureDateValidator()]],
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
        if (c.hasError('required')) return this.translate.instant('COMMON.REQUIRED');
        if (c.hasError('maxlength')) {
            return this.translate.instant('COMMON.MAX_LENGTH', { max: c.errors?.['maxlength']?.requiredLength as number });
        }
        return '';
    }

    ionViewWillEnter() {
        this.pendingPhotos = [];
        this.deletedPhotoPaths = [];
        this.selectedPhotoUrl = null;
        this.photosInitialized = false;

        if (!this.isEdit) {
            this.photos = [];
            this.form = this.getForm();
            return;
        }
        this.tasksService.getItem$(this.id!).pipe(
            takeUntil(this.leaveSubject),
            tap(task => {
                this.task = task;
                if (!this.photosInitialized) {
                    this.photos = task?.photos ?? [];
                    this.photosInitialized = true;
                }
            }),
            map(task => this.getForm(task))
        ).subscribe(form => this.form = form);
    }

    ionViewWillLeave() {
        this.leaveSubject.next();
    }

    openPhoto(url: string) {
        this.selectedPhotoUrl = url;
    }

    addPhoto(path: string) {
        this.pendingPhotos.push({ webPath: path, preview: path });
    }

    removePendingPhoto(index: number) {
        this.pendingPhotos.splice(index, 1);
    }

    removeExistingPhoto(photo: TaskPhoto) {
        this.photos = this.photos.filter(p => p.storagePath !== photo.storagePath);
        this.deletedPhotoPaths.push(photo.storagePath);
    }

    closePhoto() {
        this.selectedPhotoUrl = null;
    }

    save() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const taskId = this.isEdit ? this.task!.id : Date.now();

        const upload$ = this.pendingPhotos.length > 0
            ? forkJoin(this.pendingPhotos.map(p =>
                from(fetch(p.webPath)).pipe(
                    switchMap(r => from(r.blob())),
                    switchMap(blob => this.tasksService.uploadPhoto$(taskId, blob))
                )
            ))
            : of([] as TaskPhoto[]);

        const delete$ = this.deletedPhotoPaths.length > 0
            ? forkJoin(this.deletedPhotoPaths.map(path => this.tasksService.deletePhoto$(path)))
            : of([]);

        forkJoin([upload$, delete$]).pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(([newPhotos]) => {
                const allPhotos = [...this.photos, ...newPhotos];
                const taskData = {
                    ...this.form.getRawValue() as unknown as Task,
                    photos: allPhotos,
                    id: taskId,
                };
                const save$ = this.isEdit
                    ? this.tasksService.updateTask$(this.task!, taskData)
                    : this.tasksService.addTask$(taskData);
                return save$.pipe(
                    switchMap(tasks => {
                        const saved = tasks.find(t => t.id === taskId);
                        return saved
                            ? this.notificationService.syncTaskNotification$(saved)
                            : of(undefined);
                    })
                );
            }),
            catchError(err => {
                console.error('Save failed:', err);
                this.isSaving = false;
                return of(null);
            })
        ).subscribe(result => {
            if (result !== null) {
                this.router.navigate(['']);
            }
        });
    }

    get minDate(): string {
        return new Date().toISOString().slice(0, 16);
    }

    private futureDateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            const selected = new Date(control.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selected >= today ? null : { pastDate: true };
        };
    }
}
