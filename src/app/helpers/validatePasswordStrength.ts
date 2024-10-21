import { AbstractControl, ValidationErrors } from '@angular/forms';

export function validatePasswordStrength(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null; // No value, so no validation error
  }

  const hasUpperCase = /[A-Z]+/.test(value);
  const hasLowerCase = /[a-z]+/.test(value);
  const hasNumeric = /[0-9]+/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]+/.test(value);

  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

  return !passwordValid ? { passwordStrength: true } : null;
}
