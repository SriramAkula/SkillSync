import { Injectable } from '@angular/core';
import { UserProfileDto } from '../../shared/models';

export interface MissingField {
  key: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionService {
  private readonly CORE_FIELDS: MissingField[] = [
    { key: 'username', label: 'Add a username' },
    { key: 'firstName', label: 'Add first name' },
    { key: 'lastName', label: 'Add last name' },
    { key: 'bio', label: 'Complete your bio' },
    { key: 'phoneNumber', label: 'Add phone number' },
    { key: 'skills', label: 'Select your skills' }
  ];

  calculateCompletion(user: UserProfileDto | null): number {
    if (!user) return 0;

    let filledCount = 0;
    
    if (this.isFilled(user.username)) filledCount++;
    if (this.isFilled(user.firstName)) filledCount++;
    if (this.isFilled(user.lastName)) filledCount++;
    if (this.isFilled(user.bio)) filledCount++;
    if (this.isFilled(user.phoneNumber)) filledCount++;
    if (this.isFilled(user.skills)) filledCount++;

    const basePercentage = (filledCount / this.CORE_FIELDS.length) * 90;
    const bonus = user.avatarUrl ? 10 : 0;

    return Math.min(100, Math.round(basePercentage + bonus));
  }

  getMissingFields(user: UserProfileDto | null): MissingField[] {
    if (!user) return [];

    return this.CORE_FIELDS.filter(field => !this.isFilled((user as UserProfileDto & Record<string, unknown>)[field.key]));
  }

  private isFilled(value: unknown): boolean {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
  }
}
