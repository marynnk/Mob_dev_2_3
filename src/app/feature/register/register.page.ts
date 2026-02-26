import { Component, inject } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline,
    personOutline, callOutline, calendarOutline, chatbubbleOutline, personAddOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { filter, firstValueFrom } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { Profile } from '../../core/models/profile.model';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;

    const password = parent.get('password')?.value ?? '';
    const confirm = control.value ?? '';

    if (!password || !confirm) return null;

    return password !== confirm ? { passwordMismatch: true } : null;
};

@Component({
    selector: 'app-register',
    templateUrl: 'register.page.html',
    styleUrls: ['register.page.scss'],
    imports: [IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonSpinner, ReactiveFormsModule],
})
export class RegisterPage {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly accountService = inject(AccountService);

    loading = false;
    error = '';
    showPassword = false;
    showConfirm = false;

    readonly form = this.fb.nonNullable.group({
            displayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
            ]],
            confirmPassword: ['', [Validators.required, passwordMatchValidator]],
            phone: ['', Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)],
            dateOfBirth: [''],
            bio: ['', Validators.maxLength(200)],
        },
    );

    constructor() {
        addIcons({
            eyeOutline,
            eyeOffOutline,
            mailOutline,
            lockClosedOutline,
            personOutline,
            callOutline,
            calendarOutline,
            chatbubbleOutline,
            personAddOutline
        });
        this.controls.password.valueChanges.subscribe(() => {
            this.controls.confirmPassword.updateValueAndValidity({ onlySelf: true });
        });
    }

    get controls() {
        return this.form.controls;
    }

    fieldError(field: keyof typeof this.form.controls): string {
        const ctrl = this.form.controls[field];
        if (ctrl.hasError('required')) return 'Поле є обовʼязковим';
        if (ctrl.hasError('email')) return 'Введіть коректний email';
        if (ctrl.hasError('minlength')) {
            const min = ctrl.errors?.['minlength']?.requiredLength as number;
            return `Мінімум ${min} символів`;
        }
        if (ctrl.hasError('maxlength')) {
            const max = ctrl.errors?.['maxlength']?.requiredLength as number;
            return `Максимум ${max} символів`;
        }
        if (ctrl.hasError('pattern')) {
            if (field === 'password') return 'Потрібна велика літера та цифра';
            if (field === 'phone') return 'Невірний формат номера';
        }
        if (ctrl.hasError('passwordMismatch')) return 'Паролі не збігаються';
        return '';
    }

    async onRegister(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.error = '';
        try {
            const { email, password, displayName, phone, dateOfBirth, bio } = this.form.getRawValue();
            const registerData: Profile = {
                email,
                createdAt: null,
                displayName,
                phone: phone || '',
                dateOfBirth: dateOfBirth || '',
                bio: bio || '',
            };
            const user = await this.authService.register(email, password, registerData);
            await firstValueFrom(this.accountService.addProfile$(registerData, user));
            await firstValueFrom(this.authService.user$.pipe(filter(u => !!u)));
            await this.router.navigate(['/item']);
        } catch (err: unknown) {
            debugger;
            this.error = this.mapError(err);
        } finally {
            this.loading = false;
        }
    }

    goToLogin(): void {
        void this.router.navigate(['/login']);
    }

    private mapError(err: unknown): string {
        const code = (err as { code?: string })?.code ?? '';
        if (code.includes('email-already-in-use')) return 'Цей email вже використовується';
        if (code.includes('weak-password')) return 'Пароль надто слабкий';
        if (code.includes('invalid-email')) return 'Невірний формат email';
        return 'Щось пішло не так. Спробуйте ще раз';
    }
}
