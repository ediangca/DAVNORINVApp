import { AbstractControl, ValidatorFn } from '@angular/forms';

export function validatePasswordMatch(password: string, confirmPassword: string): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const passwordControl = control.get(password);
    const confirmPasswordControl = control.get(confirmPassword);

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    const mismatch = passwordControl.value !== confirmPasswordControl.value;
    return mismatch ? { passwordMismatch: true } : null;
  };
}
