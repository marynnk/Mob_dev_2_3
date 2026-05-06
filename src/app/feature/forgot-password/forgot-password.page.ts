import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkCircleOutline, mailOutline, paperPlaneOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { catchError, of, tap } from 'rxjs';

@Component({
    selector: 'app-forgot-password',
    templateUrl: 'forgot-password.page.html',
    styleUrls: ['forgot-password.page.scss'],
    imports: [IonContent, IonButton, IonIcon, IonInput, IonSpinner, ReactiveFormsModule],
})
export class ForgotPasswordPage {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    loading = false;
    sent = false;
    error = '';

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
    });

    constructor() {
        addIcons({ mailOutline, paperPlaneOutline, arrowBackOutline, checkmarkCircleOutline });
    }

    get email() {
        return this.form.controls.email;
    }

    emailError(): string {
        if (this.email.hasError('required')) return 'Email є обовʼязковим';
        if (this.email.hasError('email')) return 'Введіть коректний email';
        return '';
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.error = '';
        this.authService.sendPasswordReset$(this.form.getRawValue().email).pipe(
            tap(() => {
                this.sent = true;
                this.loading = false;
            }),
            catchError(err => {
                this.error = this.mapError(err);
                this.loading = false;
                return of(null);
            })
        ).subscribe();
    }

    goBack(): void {
        void this.router.navigate(['/login']);
    }

    private mapError(err: unknown): string {
        const code = (err as { code?: string })?.code ?? '';
        if (code.includes('user-not-found')) return 'Акаунт з таким email не знайдено';
        if (code.includes('invalid-email')) return 'Невалідний формат email';
        if (code.includes('too-many-requests')) return 'Забагато спроб. Спробуйте пізніше';
        return 'Щось пішло не так. Спробуйте ще раз';
    }
}
