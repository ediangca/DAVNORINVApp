import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from "@angular/forms";

@Injectable({
  providedIn: 'root' // This makes the service available throughout the app
})
export default class ValidateForm {

  validateFormFields(fg: FormGroup) {
    Object.keys(fg.controls).forEach(field => {
      const control = fg.get(field)
      if (control instanceof FormControl) {
        control.markAsDirty({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateFormFields(control);
      }
    })
  }

}
