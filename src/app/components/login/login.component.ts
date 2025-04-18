import { AfterViewInit, Component, ElementRef, inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { NgToastModule, NgToastService } from 'ng-angular-popup' // to be added
import { AppComponent } from '../../app.component';
import ValidateForm from '../../helpers/validateForm';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api.service';
import { LogsService } from '../../services/logs.service';

// import * as bootstrap from 'bootstrap';
import AOS from 'aos';
declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, HttpClientModule, NgToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent implements OnInit, AfterViewInit {



  @ViewChild('loadingModal') loadingModal!: ElementRef;
  @ViewChild('usernameInput') usernameInput!: ElementRef; // Reference to the username input field

  loginForm!: FormGroup;
  errorMessage: string = '';


  constructor(private fb: FormBuilder, private auth: AuthService,
    private router: Router, private api: ApiService,
    public ac: AppComponent, private vf: ValidateForm, private logger: LogsService) {

    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.errorMessage = '';

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['dashboard']);
    }
  }

  ngOnInit() {
    // this.ngZone.run(() => {
    //   this.toastr.success('Toastr is working inside Zone.js!', 'Success');
    // });
  }

  ngAfterViewInit(): void {
    AOS.init();
  }

  openModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    }
  }


  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }


  setupModalClose() {
    const modal = document.getElementById('loadingModal')!;
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        this.closeModal(this.loadingModal);
      });
    }
  }

  onSubmit() {

    if (this.loginForm.valid) {
      this.logger.printLogs('i', 'Fetching Login Form', this.loginForm.value);

      this.openModal(this.loadingModal);
      setTimeout(() => {

        this.auth.login(this.loginForm.value)
          .subscribe({
            next: (res) => {

              this.closeModal(this.loadingModal);

              Swal.fire({
                title: 'Access Granted!',
                text: res.message,
                //  <br> Please wait for the verification from Admin.
                icon: 'success',
                confirmButtonText: 'OK',
                allowOutsideClick: false
              }).then((result) => {
                if (result.isConfirmed) {
                  this.auth.storeLocal(res);
                  this.loginForm.reset();
                  this.router.navigate(['dashboard']);
                  
                  // this.toast.success(res.message, "ACCESS GRANTED", 5000);
                  // this.toastr.success('Hello world!', 'Toastr fun!');

                  this.logger.printLogs('i', 'ACCESS GRANTED', res.message);
                  this.api.showToast(res.message, 'ACCESS GRANTED', 'success');

                  // this.toastr.success(res.message, "ACCESS GRANTED",);
                }
              });

            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error response', err);
              Swal.fire('Access Denied!', err, 'warning');
              this.closeModal(this.loadingModal);
              this.loginForm.reset();
              this.usernameInput.nativeElement.focus();
              this.loginForm.reset();
            }
          });

      }, 3000); // Simulate a 2-second delay

    }
    this.vf.validateFormFields(this.loginForm);



  }
}
