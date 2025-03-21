import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { validatePasswordMatch } from '../../helpers/validatePasswordMatch';
import { validatePasswordStrength } from '../../helpers/validatePasswordStrength';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AppComponent } from '../../app.component';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { LogsService } from '../../services/logs.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  errorMessage: string = '';
  userGroups: any[] = [];


  constructor(private fb: FormBuilder, private router: Router,
    private auth: AuthService, private api: ApiService,
    public ac: AppComponent, private toastr: ToastrService, private logger: LogsService) { }

  ngOnInit() {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      // ug: ['', Validators.required]
    }, { validators: validatePasswordMatch('password', 'confirmPassword') });


    if (this.auth.isAuthenticated()) {
      this.router.navigate(['dashboard']);
    }
    this.loadUserGroups();
  }

  // Load UserGroup
  loadUserGroups(): void {
    this.api.getAllUserGroups('guest').subscribe(
      data => {
        this.userGroups = data;
      },
      err => {
        this.errorMessage = err;
        this.logger.printLogs('e', 'Error: loading user groups => ', err);
      }
    );
  }

  // Validate Match Password and Confirm Password
  get passwordMismatch(): boolean {
    const form = this.registerForm;
    return form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched === true;
  }

  // Validate Minimum Lenght Password
  get passwordMinimumLength(): boolean {
    const form = this.registerForm;
    const passwordControl = form.get('password');
    return passwordControl ? passwordControl.hasError('minlength') && passwordControl.touched : false;
  }

  // Validate Password Strenght
  get passwordStrength(): boolean {
    const form = this.registerForm;
    const passwordControl = form.get('password');
    return passwordControl ? passwordControl.hasError('passwordStrength') && passwordControl.touched : false;
  }

  toast(title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const options = {
      enableHtml: true,
      progressBar: true,
      timeOut: 2000,
      closeButton: true,
    };
    this.toastr[type](msg, title, options);
  }


  onSubmit() {
    const now = new Date();

    if (this.registerForm.valid) {
      this.logger.printLogs('i', 'Register Form', this.registerForm.value);

      const userAccount = {
        "userName": this.registerForm.value['username'],
        "password": this.registerForm.value['password'],
        "ugid": 2 //Test User //this.registerForm.value['ug']
      }

      this.auth.register(userAccount)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Success: ', res.message);

            this.toast('Access Granted', res.message, 'success');
            Swal.fire({
              title: 'Access Granted!',
              text: res.message,
              icon: 'success',
              html: `${res.message} <br> Please contact System Administrator and wait for the verification.`,
              confirmButtonText: 'OK'
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['login']);
                this.onReset();


                this.toastr.success(
                  // <img src="${this.ac.logoPath}" style="width:20px; height:20px;"> 
                  res.message,
                  'REGISTERED',
                  {
                    enableHtml: true, // Required for rendering HTML content
                    progressBar: true,
                    timeOut: 3000, // Auto-close after 5 seconds
                    closeButton: true,
                  }
                );
              }
            });
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Registering User', err);
            Swal.fire('Registration Denied', err, 'warning');
          }
        })

    }

    this.validateFormFields(this.registerForm);

  }

  //Common Method - Advice to add in Helpers
  private validateFormFields(fg: FormGroup) {
    Object.keys(fg.controls).forEach(field => {
      const control = fg.get(field)
      if (control instanceof FormControl) {
        control.markAsDirty({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateFormFields(control);
      }
    })
  }

  private onReset() {
    this.registerForm.reset({
      bran: '', // Reset to a specific value
      dept: '', // Reset to a specific value
      sect: '', // Reset to a specific value
      ug: '', // Reset to a specific value
    });
  }


}
