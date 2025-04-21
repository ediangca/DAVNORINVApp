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
import { ToastrService } from 'ngx-toastr';

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
  @ViewChild('LeaveModalForm') LeaveModal!: ElementRef;


  public userAccount: any | null;
  public userProfile: any | null;
  public profile: any | null;

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

  userProfiles: any = [];
  careOfUserID: string | null = null;
  careOfUser: string | null = null;
  leaveForm!: FormGroup
  leave: any = null;

  constructor(private fb: FormBuilder, private vf: ValidateForm,
    private auth: AuthService, private api: ApiService,
    private store: StoreService, private route: ActivatedRoute,
    private logger: LogsService) {

    this.ngOnInit();
  }

  ngOnInit(): void {

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

    this.leaveForm = this.fb.group({
      remarks: ['', Validators.required],
      careOfUser: ['', Validators.required],
    });


    this.loadUserGroups();
    this.loadBranches();
    this.loadPositions();

    this.addModalHiddenListener('ForgetPassModalForm');
    this.addModalHiddenListener('ProfileModalForm');
    this.addModalHiddenListener('LeaveModalForm');


    this.getUserAccount()
    this.getUserProfile()
  }

  ngAfterViewInit() {
    // Subscribe to get the user profile
  }

  addModalHiddenListener(modalId: string) {
    const modal = document.getElementById(modalId);

    modal?.addEventListener('hidden.bs.modal', () => {

      this.resetForm()
      if (modalId == "LeaveModalForm") {
        const checkbox = document.getElementById('leave') as HTMLInputElement;

        if (checkbox) {
          checkbox.checked = !this.userAccount.isLeave;
        }
      }
    });
  }

  getUserAccount() {
    this.store.getUserAccount().subscribe(account => {
      this.userAccount = account;
      this.logger.printLogs("i", 'Load Account', this.userAccount);
      this.getCareOfByProfile()
    });

  }


  getCareOfByProfile() {
    if (this.userAccount.isLeave) {
      this.api.retrieveLeave(this.userAccount.userID)
        .subscribe({
          next: (res: any) => {
            this.logger.printLogs('i', 'Retrieve Leave', res);
            this.leave = res;
          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Fetching Leave Denied', err);
          }
        });
    }
  }

  refreshUserAccount() {

    this.api.getAccIDByUsername(this.userAccount.userName)
      .subscribe({
        next: (res: any) => {
          this.logger.printLogs('w', 'Refresh Account', res[0]);
          this.userAccount = res[0];
          this.store.setUserAccount(this.userAccount);
          this.getUserAccount();
          this.getUserProfile();
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Fetching Account ID Denied', err);
        }
      });
  }

  getUserProfile() {
    this.store.getUserProfile().subscribe(profile => {

      this.logger.printLogs("i", 'Load Profile', profile);
      if (profile) {
        this.userProfile = profile;
        this.profileID = this.userProfile.profileID;
      } else {

        this.route.queryParams.subscribe(params => {
          if (params['showProfileForm'] === 'true') { // Query params are strings, so compare as strings
            this.checkProfile();
          }
        });
      }

    });
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
        this.userGroups = data;
        this.logger.printLogs("i", 'Load positions', this.userGroups);
        this.userGroups = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.userGroups
          : this.userGroups.filter(ug => ug.userGroupName != 'System Administrator' && ug.userGroupName != 'System Generated');
      },
      err => {
        this.logger.printLogs("e", 'Error loading user groups', err);
      }
    );
  }

  // Load Positions
  loadPositions(): void {
    this.api.getAllPositions().subscribe(
      data => {
        this.positions = data;
        this.logger.printLogs("i", 'Load positions', this.positions);
        this.positions = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.positions
          : this.positions.filter(ug => ug.positionName != 'System Administrator' && ug.positionName != 'Test');
      },
      err => {
        this.logger.printLogs("e", 'Error loading Positions', err);
      }
    );
  }

  // Load Branches
  loadBranches(): void {
    this.api.getCompanies().subscribe(
      data => {
        this.branches = data;
        this.logger.printLogs("i", 'Load Department', this.branches);
      },
      err => {
        this.logger.printLogs("e", 'Error loading Branch', err);
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
    this.logger.printLogs("i", 'Selected Branch', branchID);
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
        this.logger.printLogs("i", 'Load Department', this.departments);
        if (this.profile) {
          this.loadSections(this.profile.depID);
        }
      },
      err => {
        this.logger.printLogs("e", 'Error loading Departments', err);
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
    this.logger.printLogs("i", 'Selected Department', depID);
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
        this.logger.printLogs("i", 'Load Section', this.sections);

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

          this.isModalOpen = true;

          this.openModal(this.ProfileModal);
        }
      },
      err => {
        this.logger.printLogs("e", 'Error loading Sections', err);
      }
    );
  }

  openModal(modalElement: ElementRef) {
    if (modalElement && modalElement.nativeElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    } else {
      this.logger.printLogs("w", 'Modal', 'Not Available');
    }
  }

  closeModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
      if (modal) {
        modal.hide();

        const checkbox = document.getElementById('leave') as HTMLInputElement;

        if (checkbox) {
          checkbox.checked = !this.userAccount;
        }
      }
    }
  }

  // Validate Match Password and Confirm Password
  get passwordMismatch(): boolean {
    const form = this.userAccountForm;
    return form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched === true;
  }



  toggleLeave(event: Event, id: string) {

    const input = event.target as HTMLInputElement;
    const isLeave: boolean = input.checked;


    Swal.fire({
      title: 'Confirmation',
      text: `Do you really want to ${!this.userAccount.isLeave ? 'Inactive' : 'Active'} your status?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        if (!this.userAccount.isLeave) {
          this.openModal(this.LeaveModal);
        } else {

          this.api.onActiveStatus(this.userAccount.userID)
            .subscribe({
              next: (res) => {
                this.logger.printLogs("i", "Success: ", res.message);

                Swal.fire('Saved', res.message, 'success');
                this.api.showToast(res.message, 'Saved!', 'success');
                this.resetForm();
              },
              error: (err: any) => {
                this.logger.printLogs("e", 'Error response:', err,);
                input.checked = !isLeave;
                Swal.fire('Saving Denied', err, 'warning');
              }
            });
        }

        // // Execute Update Verification
        // Swal.fire('IGAT JUD', '', 'info');
        // this.api.leaveStatusUserAccount(id)
        //   .subscribe({
        //     next: (res) => {

        //       Swal.fire(res.message, '', 'success');
        //       this.api.showToast(res.message, 'Status', 'success');

        //       this.getUserAccount()

        //     },
        //     error: (err: any) => {
        //       this.logger.printLogs('w', 'Update Leave status Denied', err);
        //       Swal.fire('Update Leave status Denied', err, 'warning');
        //     }
        //   });

      } else {
        input.checked = !isLeave;
      }
    });

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
                this.logger.printLogs("i", 'Success:', res.message);
                Swal.fire('Updated', res.message, 'success');
                this.api.showToast(res.message, 'Updated!', 'success');
              },
              error: (err: any) => {
                this.logger.printLogs("e", 'Error response:', err);
                Swal.fire('Updating Denied', err, 'warning');

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
            this.logger.printLogs("i", 'Show Profile', this.profile.value);
            this.isEditMode = true;
            this.profileID = this.profile.profileID;
            if (this.profile.branchID!) {

              this.logger.printLogs("i", 'Profile', this.profile);
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

                this.logger.printLogs("i", 'Profile', this.profile.value);

                this.isModalOpen = true;
                this.openModal(this.ProfileModal);
              }
            }

          } else {
            this.isEditMode = false;
            this.logger.printLogs("i", 'Profile', "Not Found");
            this.openModal(this.ProfileModal);
          }
        },
        error: (err: any) => {
          this.logger.printLogs("e", 'Error Fetching Profile :', err);
        }
      });
  }

  onSubmitProfile() {

    this.logger.printLogs("i", 'Profile Form', this.profile.value);

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


      this.logger.printLogs("i", 'Profile ID : ', this.profileID);

      if (this.profileID) {
        this.logger.printLogs("i", 'Update Profile : ', this.userProfileForm.value);
        this.UpdateProfile(userProfile)
      } else {
        if (this.userAccount) {
          this.logger.printLogs("i", 'User ID : ', this.userAccount.userID);
        }
        this.logger.printLogs("i", 'Save Profile : ', this.userProfileForm.value);
        this.SaveProfile(userProfile);
      }

    }
    this.validateFormFields(this.userProfileForm);



  }

  onAutoSuggestReceived() {
    this.careOfUserID = null;
    if (!this.careOfUser) {
      // this.getAllUserProfile();//Populate all userProfiles
      this.userProfiles = [];
    } else {
      if (this.careOfUser.trim()) {
        this.api.searchProfile(this.careOfUser)
          .subscribe({
            next: (res) => {
              this.logger.printLogs('i', `Fetch Specific Received By ${this.careOfUser}`, res);
              this.userProfiles = res.filter((profile: any) => profile.isLeave === false && profile.userID !== this.userAccount.userID);

              if (this.userProfiles.length == 1 && this.userProfiles.fullName == this.careOfUser ) {
                this.selectCareOf(res[0]);
                this.logger.printLogs('i', 'Fetch Specific Received By', res[0]);
              } else {
                this.userProfiles = this.userProfiles.slice(0, 5)
                this.logger.printLogs('i', 'Fetching Received By from userProfiles', res);
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Received By', err);
            }
          });
      }
    }
  }
  selectCareOf(userProfile: any): void {

    this.careOfUserID = userProfile.userID;
    this.logger.printLogs('i', 'Selected to Received', userProfile);


    if (this.leaveForm!) {
      this.leaveForm.patchValue({
        careOfUser: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  onSubmitLeave() {

    this.logger.printLogs("i", 'Submit Leave : ', this.leaveForm.value);

    if (this.leaveForm.valid && this.careOfUserID != null) {

      const leave = {
        userID: this.userAccount ? this.userAccount.userID : '0',
        remarks: this.leaveForm.value['remarks'],
        CareOfUserID: this.careOfUserID,
      }


      Swal.fire({
        title: 'Inactive Status',
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.onLeave(this.userAccount.userID, leave)
            .subscribe({
              next: (res) => {
                this.logger.printLogs("i", 'Success Filling Leave : ', res.message);

                Swal.fire('Saved', res.message, 'success');
                this.api.showToast(res.message, 'Saved!', 'success');

                this.resetForm();
              },
              error: (err: any) => {
                this.logger.printLogs("e", 'Error Filling Leave : ', err);
                Swal.fire('Saving Denied', err, 'warning');
              }
            });
        }
      });

    }

    this.validateFormFields(this.leaveForm);

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

          this.logger.printLogs("i", 'Success Saving Profile : ', res.message);
          Swal.fire('Saved', res.message, 'success');
          this.api.showToast(res.message, 'Saved!', 'success');

          this.getProfile(userProfile.userID);
          this.resetForm();
        },
        error: (err: any) => {
          this.logger.printLogs("e", 'Error Saving Profile : ', err);
          Swal.fire('Saving Denied', err, 'warning');
        }
      });
  }

  UpdateProfile(userProfile: any) {

    Swal.fire({
      title: 'Update',
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

              this.logger.printLogs("i", 'Success Updating Profile : ', res.message);
              Swal.fire('Updated!', res.message, 'success');
              this.api.showToast(res.message, 'Updated!', 'success');

              this.getProfile(userProfile.userID);
              this.resetForm();
            },
            error: (err: any) => {
              this.logger.printLogs("e", 'Error Updating Profile : ', err);
              Swal.fire('Updating Denied', err, 'warning');
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

    this.leaveForm.reset({
      remarks: '',
      careOfID: ''
    });
    this.closeModal(this.ProfileModal);
    this.closeModal(this.ForgetPassModal);
    this.closeModal(this.LeaveModal);
    this.refreshUserAccount();
  }

}

