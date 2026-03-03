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
    IonSpinner, IonInputPasswordToggle,
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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
    imports: [IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonSpinner, ReactiveFormsModule,
        IonInputPasswordToggle, TranslatePipe],
})
export class RegisterPage {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly accountService = inject(AccountService);
    private readonly translate = inject(TranslateService);

    loading = false;
    error = '';

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
        if (ctrl.hasError('required')) return this.translate.instant('COMMON.REQUIRED');
        if (ctrl.hasError('email')) return this.translate.instant('COMMON.EMAIL_INVALID');
        if (ctrl.hasError('minlength')) {
            const min = ctrl.errors?.['minlength']?.requiredLength as number;
            return this.translate.instant('COMMON.MIN_LENGTH', { min });
        }
        if (ctrl.hasError('maxlength')) {
            const max = ctrl.errors?.['maxlength']?.requiredLength as number;
            return this.translate.instant('COMMON.MAX_LENGTH', { max });
        }
        if (ctrl.hasError('pattern')) {
            if (field === 'password') return this.translate.instant('REGISTER.PASSWORD_PATTERN');
            if (field === 'phone') return this.translate.instant('REGISTER.PHONE_INVALID');
        }
        if (ctrl.hasError('passwordMismatch')) return this.translate.instant('COMMON.PASSWORDS_MISMATCH');
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
        if (code.includes('email-already-in-use')) return this.translate.instant('REGISTER.EMAIL_TAKEN');
        if (code.includes('weak-password')) return this.translate.instant('REGISTER.WEAK_PASSWORD');
        if (code.includes('invalid-email')) return this.translate.instant('REGISTER.INVALID_EMAIL');
        return this.translate.instant('COMMON.UNKNOWN_ERROR');
    }
}
