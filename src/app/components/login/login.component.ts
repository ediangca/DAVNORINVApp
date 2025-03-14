import { Component, ElementRef, inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { NgToastModule, NgToastService } from 'ng-angular-popup' // to be added
import { AppComponent } from '../../app.component';
import ValidateForm from '../../helpers/validateForm';
import { ToastrService } from 'ngx-toastr';

// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, HttpClientModule, NgToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent implements OnInit {



  @ViewChild('loadingModal') loadingModal!: ElementRef;
  @ViewChild('usernameInput') usernameInput!: ElementRef; // Reference to the username input field

  loginForm!: FormGroup;
  errorMessage: string = '';


  constructor(private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: NgToastService,
    private toastr: ToastrService,
    public ac: AppComponent,
    private vf: ValidateForm) {

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
      // console.log(this.loginForm.value);
      // Add your login logic here
      // console.log("https://localhost:7289/api/Auth?username=" + this.loginForm.value['username'] + "&&password=" + this.loginForm.value['password']);

      this.openModal(this.loadingModal);
      setTimeout(() => {

        this.auth.login(this.loginForm.value)
          .subscribe({
            next: (res) => {

              this.closeModal(this.loadingModal);

              Swal.fire({
                title: 'Access Granted!',
                text: res.message,
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

                  this.toastr.success(
                    // <img src="${this.ac.logoPath}" style="width:20px; height:20px;"> 
                    res.message,
                    'ACCESS GRANTED',
                    {
                      enableHtml: true, // Required for rendering HTML content
                      progressBar: true,
                      timeOut: 3000, // Auto-close after 5 seconds
                      closeButton: true,
                    }
                  );

                  // this.toastr.success(res.message, "ACCESS GRANTED",);
                }
              });

            },
            error: (err: any) => {
              console.log('Error response:', err);
              this.closeModal(this.loadingModal);
              this.loginForm.reset();
              this.usernameInput.nativeElement.focus();
              Swal.fire({
                title: 'Access Denied!',
                text: err,
                icon: 'warning'
              });
              this.loginForm.reset();
            }
          });

      }, 3000); // Simulate a 2-second delay

    }
    this.vf.validateFormFields(this.loginForm);



  }
}
