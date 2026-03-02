import { Component, inject, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSpinner,
    IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, eyeOffOutline, eyeOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { catchError, of, tap } from 'rxjs';

function passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const pass = group.get('password')?.value;
        const confirm = group.get('confirm')?.value;
        return pass === confirm ? null : { passwordMismatch: true };
    };
}

@Component({
    selector: 'app-reset-password',
    templateUrl: 'reset-password.page.html',
    styleUrls: ['reset-password.page.scss'],
    imports: [IonContent, IonButton, IonIcon, IonInput, IonSpinner, ReactiveFormsModule, IonInputPasswordToggle],
})
export class ResetPasswordPage implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    verifying = true;
    loading = false;
    success = false;
    error = '';
    email = '';
    private oobCode = '';

    readonly form = this.fb.nonNullable.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', Validators.required],
    }, { validators: passwordMatchValidator() });

    constructor() {
        addIcons({ lockClosedOutline, eyeOutline, eyeOffOutline, checkmarkCircleOutline });
    }

    get password() {
        return this.form.controls.password;
    }

    get confirm() {
        return this.form.controls.confirm;
    }

    ngOnInit(): void {
        this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') ?? '';

        if (!this.oobCode) {
            this.error = 'Посилання для скидання пароля недійсне або застаріле';
            this.verifying = false;
            return;
        }

        this.authService.verifyResetCode$(this.oobCode).pipe(
            tap(email => {
                this.email = email;
                this.verifying = false;
            }),
            catchError(err => {
                this.error = this.mapError(err);
                this.verifying = false;
                return of(null);
            })
        ).subscribe();
    }

    passwordError(): string {
        if (this.password.hasError('required')) return 'Пароль є обовʼязковим';
        if (this.password.hasError('minlength')) return 'Мінімум 8 символів';
        return '';
    }

    confirmError(): string {
        if (this.confirm.touched && this.form.hasError('passwordMismatch')) {
            return 'Паролі не збігаються';
        }
        return '';
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.error = '';
        this.authService.confirmPasswordReset$(this.oobCode, this.form.getRawValue().password).pipe(
            tap(() => {
                this.success = true;
                this.loading = false;
            }),
            catchError(err => {
                this.error = this.mapError(err);
                this.loading = false;
                return of(null);
            })
        ).subscribe();
    }

    onSuccess(): void {
        void this.router.navigate(['/login']);
    }

    private mapError(err: unknown): string {
        const code = (err as { code?: string })?.code ?? '';
        if (code.includes('expired-action-code')) return 'Посилання застаріло. Запросіть нове';
        if (code.includes('invalid-action-code')) return 'Посилання недійсне або вже використане';
        if (code.includes('weak-password')) return 'Пароль занадто слабкий';
        if (code.includes('too-many-requests')) return 'Забагато спроб. Спробуйте пізніше';
        return 'Щось пішло не так. Спробуйте ще раз';
    }
}
