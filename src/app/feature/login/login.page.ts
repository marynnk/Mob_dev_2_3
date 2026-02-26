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
import { eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, enterOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    styleUrls: ['login.page.scss'],
    imports: [IonContent, IonButton, IonIcon, IonInput, IonSpinner, ReactiveFormsModule],
})
export class LoginPage {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    loading = false;
    error = '';
    showPassword = false;

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });

    constructor() {
        addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, enterOutline });
    }

    get email() {
        return this.form.controls.email;
    }

    get password() {
        return this.form.controls.password;
    }

    emailError(): string {
        if (this.email.hasError('required')) return 'Email є обовʼязковим';
        if (this.email.hasError('email')) return 'Введіть коректний email';
        return '';
    }

    passwordError(): string {
        if (this.password.hasError('required')) return 'Пароль є обовʼязковим';
        if (this.password.hasError('minlength')) return 'Мінімум 8 символів';
        return '';
    }

    async onLogin(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.error = '';
        try {
            const { email, password } = this.form.getRawValue();
            await this.authService.login(email, password);
            await firstValueFrom(this.authService.user$.pipe(filter(u => !!u)));
            await this.router.navigate(['/item']);
        } catch (err: unknown) {
            this.error = this.mapError(err);
        } finally {
            this.loading = false;
        }
    }

    goToRegister(): void {
        void this.router.navigate(['/register']);
    }

    private mapError(err: unknown): string {
        const code = (err as { code?: string })?.code ?? '';
        if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
            return 'Невірний email або пароль';
        }
        if (code.includes('too-many-requests')) {
            return 'Забагато спроб. Спробуйте пізніше';
        }
        return 'Щось пішло не так. Спробуйте ще раз';
    }
}
