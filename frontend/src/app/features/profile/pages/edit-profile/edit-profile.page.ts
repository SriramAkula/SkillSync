import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto } from '../../../../shared/models';
import { ToastService } from '../../../../shared/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { switchMap, first, delay, map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-profile.page.html'
})
export class EditProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly toast       = inject(ToastService);
  readonly skillStore           = inject(SkillStore);
  private readonly authStore    = inject(AuthStore);

  readonly loading        = signal(true);
  readonly saving         = signal(false);
  readonly saveError      = signal<string | null>(null);
  readonly selectedSkills = signal<string[]>([]);

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName:    ['', [Validators.minLength(2), Validators.maxLength(100)]],
    username:    ['', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
      asyncValidators: [this.usernameValidator()],
      updateOn: 'blur' // Validate on blur to reduce API calls
    }],
    email:       [{ value: '', disabled: true }],
    phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    bio:         ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }

    this.userService.getMyProfile().subscribe({
      next:  res => { this.prefill(res.data); this.loading.set(false); },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load profile:', err);
        this.toast.error('Failed to load profile. Please refresh the page.');
        this.loading.set(false);
      }
    });
  }

  private prefill(p: UserProfileDto): void {
    const parts  = (p.name || '').trim().split(' ').filter(Boolean);
    const skills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    this.form.patchValue({
      firstName:   parts[0] || '',
      lastName:    parts.slice(1).join(' ') || '',
      username:    p.username || this.authStore.username() || '',
      email:       p.email || this.authStore.email() || '',
      phoneNumber: p.phoneNumber || '',
      bio:         p.bio || ''
    });

    this.selectedSkills.set(skills);
  }

  usernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const val = control.value?.trim();
      const currentUsername = this.authStore.username();

      if (!val || val.length < 2 || val.toLowerCase() === currentUsername?.toLowerCase()) {
        return of(null);
      }

      return of(val).pipe(
        delay(300), // Minor debounce
        switchMap(u => this.userService.checkUsernameAvailability(u)),
        map(res => (res.data ? { usernameTaken: true } : null)),
        first(),
        catchError(() => of(null))
      );
    };
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c?.dirty || c?.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || (!control.dirty && !control.touched)) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.formatFieldName(field)} is required`;
    if (errors['minlength']) return `${this.formatFieldName(field)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.formatFieldName(field)} can be maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return this.getPatternErrorMessage(field);
    if (errors['usernameTaken']) return 'This username is already taken';
    return 'Invalid input';
  }

  private getPatternErrorMessage(field: string): string {
    if (field === 'phoneNumber') return 'Phone number must be exactly 10 digits and contain only numbers';
    return 'Invalid format';
  }

  private formatFieldName(field: string): string {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  addSkill(event: Event): void {
    const sel   = event.target as HTMLSelectElement;
    const skill = sel.value;
    if (skill && !this.selectedSkills().includes(skill)) {
      this.selectedSkills.update(list => [...list, skill]);
    }
    sel.value = '';
  }

  removeSkill(skill: string): void {
    this.selectedSkills.update(list => list.filter(s => s !== skill));
  }

  save(): void {
    console.log('🔵 [EditProfile] save() called');
    
    // Clear previous errors
    this.saveError.set(null);
    
    console.log('📋 [EditProfile] Form state:', { 
      valid: this.form.valid, 
      invalid: this.form.invalid,
      dirty: this.form.dirty,
      touched: this.form.touched
    });
    
    if (this.form.invalid) {
      const errors = Object.entries(this.form.controls).reduce((acc, [key, ctrl]) => {
        if (ctrl.invalid) acc[key] = ctrl.errors;
        return acc;
      }, {} as Record<string, ValidationErrors | null>);
      
      console.error('❌ [EditProfile] Form validation failed:', errors);
      this.saveError.set('Please fill all required fields correctly');
      this.toast.error('Form has validation errors');
      return;
    }
    
    const val  = this.form.getRawValue();
    console.log('✅ [EditProfile] Form values (raw):', val);
    
    const name = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();
    
    if (!name || !name.includes(' ') || name.split(' ').some(p => !p)) {
      console.error('❌ [EditProfile] Invalid name:', name);
      this.saveError.set('First and last name are required');
      this.toast.error('First and last name are required');
      return;
    }

    // Validate phone number: must be exactly 10 digits if provided
    const phoneRaw = val.phoneNumber?.trim();
    if (phoneRaw && !/^\d{10}$/.test(phoneRaw)) {
      console.error('❌ [EditProfile] Invalid phone number:', phoneRaw);
      this.saveError.set('Phone number must be exactly 10 digits');
      this.toast.error('Phone number must be exactly 10 digits');
      return;
    }

    const updateRequest = {
      username:    val.username?.trim(),
      name,
      bio:         val.bio?.trim() || undefined,
      phoneNumber: phoneRaw || undefined,
      skills:      this.selectedSkills().join(',') || undefined
    };
    
    console.log('📤 [EditProfile] Sending update request:', updateRequest);
    this.saving.set(true);
    
    this.userService.updateProfile(updateRequest).subscribe({
      next: (res) => {
        console.log('✅ [EditProfile] Profile updated successfully:', res);
        this.saving.set(false);
        this.userService.updateUser(res.data);
        this.authStore.updateUser(res.data.name, res.data.username);
        this.toast.success('Profile updated successfully!');
        setTimeout(() => this.router.navigate(['/profile']), 1000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        console.error('❌ [EditProfile] Profile update failed:', {
          status: err.status,
          statusText: err.statusText,
          headers: err.headers,
          error: err.error,
          message: err.message
        });
        
        // Extract error message from backend response
        let errorMsg = 'Failed to update profile';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.statusText) {
          errorMsg = `${err.status} - ${err.statusText}`;
        }
        
        this.saveError.set(errorMsg);
        this.toast.error(errorMsg);
      }
    });
  }

  goBack(): void { this.router.navigate(['/profile']); }
}
