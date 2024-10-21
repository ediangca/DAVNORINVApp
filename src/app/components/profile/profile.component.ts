import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { StoreService } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { validatePasswordMatch } from '../../helpers/validatePasswordMatch';

import * as bootstrap from 'bootstrap';
import ValidateForm from '../../helpers/validateForm';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  @ViewChild('ForgetPassModalForm') ForgetPassModal!: ElementRef;

  public userAccount: any | null;
  public userProfile: any | null;

  userAccountForm!: FormGroup;

  isLoading = true;

  constructor(private fb: FormBuilder, private vf: ValidateForm, private auth: AuthService, private api: ApiService, private store: StoreService) {

    this.userAccountForm = this.fb.group({
      oldpassword: ['', [Validators.required, Validators.minLength(6)]],
      newpassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: validatePasswordMatch('newpassword', 'confirmPassword') });

  }

  ngOnInit(): void {
    // Subscribe to get the user account

    this.store.getUserAccount().subscribe(account => {
      this.userAccount = account;
      console.log('Get User Account from Observable: ', this.userAccount);
    });

    // Subscribe to get the user profile
    this.store.getUserProfile().subscribe(profile => {
      this.userProfile = profile;
      // console.log('Get User Profile from Observable: ', this.userProfile);
    });

    this.setupModalClose();
  }

  setupModalClose() {
    const modal = document.getElementById('ForgetPassModalForm')!;
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
      });
    }
  }

  openForgetPassModal() {
    const modal = new bootstrap.Modal(this.ForgetPassModal.nativeElement);
    modal.show();
  }

  closeModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Validate Match Password and Confirm Password
  get passwordMismatch(): boolean {
    const form = this.userAccountForm;
    return form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched === true;
  }


  logout() {
    this.store.clearStore();
    this.auth.logout();
  }

  resetForm() {
    this.userAccountForm.reset(
      {
        oldpassword: '',
        newpassword: '',
        confirmPassword: '',
      }
    );
    this.closeModal(this.ForgetPassModal);
  }


  onSubmit() {

    if (this.userAccountForm.valid) {

      const ChangePassDto = {
        "OldPassword": this.userAccountForm.value['oldpassword'],
        "NewPassword": this.userAccountForm.value['newpassword'],
      }

      Swal.fire({
        title: 'Change Password?',
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.UpdatePassword(this.userAccount.userID!, ChangePassDto)
            .subscribe({
              next: (res) => {
                console.info("Success: ", res.message);

                Swal.fire({
                  title: 'Updated!',
                  text: res.message,
                  icon: 'success'
                });
              },
              error: (err: any) => {
                console.log('Error response:', err);
                Swal.fire({
                  title: 'Updating Denied!',
                  text: err,
                  icon: 'warning'
                });
              }
            });
        }
      });


    }else{
      this.vf.validateFormFields(this.userAccountForm);
    }
  }


}
