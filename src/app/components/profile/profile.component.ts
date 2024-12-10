import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { StoreService } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { validatePasswordMatch } from '../../helpers/validatePasswordMatch';

import * as bootstrap from 'bootstrap';
import ValidateForm from '../../helpers/validateForm';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { LogsService } from '../../services/logs.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit {

  @ViewChild('ForgetPassModalForm') ForgetPassModal!: ElementRef;
  @ViewChild('ProfileModalForm') ProfileModal!: ElementRef;

  public userAccount: any | null;
  public userProfile: any | null;
  public profile: any | null;

  logger: LogsService;

  isLoading = true;

  public roleNoFromToken: string = '*';

  userAccountForm!: FormGroup;

  currentEditId: number | null = null;

  profileID: number | null = null;
  userProfileForm!: FormGroup;
  isEditMode: boolean = false;

  userGroups: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  sections: any[] = [];
  positions: any[] = [];

  showProfileForm = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder,
    private vf: ValidateForm,
    private auth: AuthService,
    private api: ApiService,
    private store: StoreService,
    private route: ActivatedRoute) {

    this.logger = new LogsService();

    this.roleNoFromToken = this.auth.getRoleFromToken();

    this.userAccountForm = this.fb.group({
      oldpassword: ['', [Validators.required, Validators.minLength(6)]],
      newpassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: validatePasswordMatch('newpassword', 'confirmPassword') });

    this.userProfileForm = this.fb.group({
      lastname: ['', Validators.required],
      firstname: ['', Validators.required],
      middlename: ['', Validators.required],
      sex: ['', Validators.required],
      branchID: [''],
      depID: [''],
      secID: [''],
      positionID: ['']
    });

  }

  ngOnInit(): void {

    this.loadUserGroups();
    this.loadBranches();
    this.loadPositions();

    this.addModalHiddenListener('ForgetPassModalForm');
    this.addModalHiddenListener('ProfileModalForm');


    // Subscribe to get the user account
    this.store.getUserAccount().subscribe(account => {
      this.userAccount = account;
      console.log('Get User Account from Observable: ', this.userAccount);
    });



    this.store.getUserProfile().subscribe(profile => {

      console.log('Get User Profile from Observable: ', profile);
      if (profile) {
        this.userProfile = profile;
        this.profileID = this.userProfile.profileID;
      } else {
        console.log('Show Profile Form');

        this.route.queryParams.subscribe(params => {
          if (params['showProfileForm'] === 'true') { // Query params are strings, so compare as strings
            console.log('Show Extra');
            this.checkProfile();
          }
        });
      }

    });
  }

  ngAfterViewInit() {
    // Subscribe to get the user profile
  }

  addModalHiddenListener(modalId: string) {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('hidden.bs.modal', () => this.resetForm());
  }

  // setupModalClose() {
  //   const modal = document.getElementById('ForgetPassModalForm')!;
  //   if (modal) {
  //     modal.addEventListener('hidden.bs.modal', () => {
  //       this.resetForm();
  //     });
  //   }
  // }

  // Load UserGroup
  loadUserGroups(): void {
    this.api.getAllUserGroups(this.roleNoFromToken).subscribe(
      data => {
        console.log('USE ROLE : ', this.roleNoFromToken);
        console.log('USE GROUPS : ', data);
        this.userGroups = data;
        this.userGroups = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.userGroups
          : this.userGroups.filter(ug => ug.userGroupName != 'System Administrator' && ug.userGroupName != 'System Generated');
      },
      err => {
        console.error('Error: loading user groups => ', err);
      }
    );
  }

  // Load Positions
  loadPositions(): void {
    this.api.getAllPositions().subscribe(
      data => {
        console.log('POSITION : ', data);
        this.positions = data;
        this.positions = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.positions
          : this.positions.filter(ug => ug.positionName != 'System Administrator' && ug.positionName != 'Test');
      },
      err => {
        console.error('Error: loading Positions => ', err);
      }
    );
  }

  // Load Branches
  loadBranches(): void {
    this.api.getCompanies().subscribe(
      data => {
        this.branches = data;
      },
      err => {
        console.error('Error: loading Companies => ', err);
      }
    );
  }

  // Handle branch change
  onBranchChange(event: Event): void {
    this.departments = [];
    this.sections = [];
    this.userProfileForm.patchValue({
      depID: [''],
      secID: [''],
    });
    const target = event.target as HTMLSelectElement;
    const branchID = target.value;
    console.log("Selected Branch: " + branchID);
    if (branchID) {
      this.loadDepartments(branchID);
    } else {
      this.departments = [];
    }
  }


  // Load Departments
  loadDepartments(branchID: string): void {
    this.api.getDepartmentsByCompanyID(branchID).subscribe(
      data => {
        this.departments = data;
        console.log("Load Department", this.departments);
        if (this.profile) {
          this.loadSections(this.profile.depID);
        }
      },
      err => {
        console.error('Error: loading Departments => ', err);
      }
    );
  }
  // Handle Department change
  onDepartmentChange(event: Event): void {
    // this.sections = [];
    // this.userProfileForm.patchValue({
    //   secID: [''],
    // });
    const target = event.target as HTMLSelectElement;
    const depID = target.value;
    console.log("Selected Department: " + depID);
    if (depID) {
      this.loadSections(depID);
    } else {
      this.sections = [];
    }

  }

  // Load Sections
  loadSections(depID: string): void {
    this.api.getSectionsByDepID(depID).subscribe(
      data => {
        this.sections = data;
        console.log("Load Section", this.sections);

        if (!this.isModalOpen && this.profile) {
          this.userProfileForm.patchValue({
            lastname: this.profile.lastname,
            firstname: this.profile.firstname,
            middlename: this.profile.middlename,
            sex: this.profile.sex,
            branchID: this.profile.branchID ?? null,
            depID: this.profile.depID ?? null,
            secID: this.profile.secID ?? null,
            positionID: this.profile.positionID ?? null,
          });

          console.log("Submit Profile", this.userProfileForm.value);
          this.isModalOpen = true;

          this.openModal(this.ProfileModal);
        }
      },
      err => {
        console.error('Error: loading Sections => ', err);
      }
    );
  }

  openModal(modalElement: ElementRef) {
    if (modalElement && modalElement.nativeElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    } else {
      console.error('Modal element is not available');
    }
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


    } else {
      this.vf.validateFormFields(this.userAccountForm);
    }
  }

  openForgotPassword() {
    this.openModal(this.ForgetPassModal);
  }

  checkProfile() {
    this.api.getProfile(this.userAccount.userID!)
      .subscribe({
        next: (res) => {
          if (res[0]) {
            this.profile = res[0];
            console.log("Show Profile", this.profile);
            this.isEditMode = true;
            this.profileID = this.profile.profileID;
            if (this.profile.branchID!) {

              console.log("With Branch", this.profile);
              this.loadDepartments(this.profile.branchID);

            } else {
              if (!this.isModalOpen && this.profile) {
                this.userProfileForm.patchValue({
                  lastname: this.profile.lastname,
                  firstname: this.profile.firstname,
                  middlename: this.profile.middlename,
                  sex: this.profile.sex,
                  branchID: this.profile.branchID || '',
                  depID: this.profile.depID || '',
                  secID: this.profile.secID || '',
                  positionID: this.profile.positionID || ''
                });

                console.log("Submit Profile", this.profile.value);

                this.isModalOpen = true;
                this.openModal(this.ProfileModal);
              }
            }

          } else {
            this.isEditMode = false;
            console.log("No Profile found!");
            this.openModal(this.ProfileModal);
          }
        },
        error: (err: any) => {
          console.log('Error Fetching Profile:', err);
        }
      });
  }


  onSubmitProfile() {

    console.log("Submit Profile", this.userProfileForm.value);

    if (this.userProfileForm.valid) {

      const userProfile = {
        lastname: this.userProfileForm.value['lastname'],
        firstname: this.userProfileForm.value['firstname'],
        middlename: this.userProfileForm.value['middlename'],
        sex: this.userProfileForm.value['sex'],
        branchID: this.userProfileForm.value['branchID'] ? this.userProfileForm.value['branchID'] : null,
        depID: this.userProfileForm.value['depID'] ? this.userProfileForm.value['depID'] : null,
        secID: this.userProfileForm.value['secID'] ? this.userProfileForm.value['secID'] : null,
        positionID: this.userProfileForm.value['positionID'] ? this.userProfileForm.value['positionID'] : null,
        userID: this.userAccount ? this.userAccount.userID : '0'
      }


      console.log("profile ID: " + this.profileID);

      if (this.profileID) {
        console.log("Update Profile", this.userProfileForm.value);
        this.UpdateProfile(userProfile)
      } else {
        if (this.userAccount) {
          console.log("Create Profile for UserID ", this.userAccount.userID);
        }
        console.log("Save Profile ", this.userProfileForm.value);
        this.SaveProfile(userProfile);
      }

    }
    this.validateFormFields(this.userProfileForm);



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

  SaveProfile(userProfile: any) {
    this.api.createProfile(userProfile)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          Swal.fire('Saved!', res.message, 'success');

          this.getProfile(userProfile.userID);
          this.resetForm();
        },
        error: (err: any) => {
          console.log('Error response:', err);
          Swal.fire({
            title: 'Saving Denied!',
            text: err,
            icon: 'warning'
          });
        }
      });
  }

  UpdateProfile(userProfile: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateProfile(this.profileID!, userProfile)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              Swal.fire('Success', res.message, 'success');
              this.getProfile(userProfile.userID);
              this.resetForm();
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
  }

  getProfile(userID: string) {
    this.api.getProfileByUserID(userID!)
      .subscribe({
        next: (res) => {

          this.userProfile = res[0];
          this.logger.printLogs('i', 'Profile', this.userProfile);

          this.store.setUserProfile(this.userProfile);

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Profile', err);
        }
      });
  }

  resetForm() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.userAccountForm.reset(
      {
        oldpassword: '',
        newpassword: '',
        confirmPassword: '',
      }
    );
    this.userProfileForm.reset({
      lastname: '',
      firstname: '',
      middlename: '',
      sex: '',
      branchID: '',
      depID: '',
      secID: '',
      positionID: ''
    });
    this.closeModal(this.ProfileModal);
    this.closeModal(this.ForgetPassModal);
  }

}
