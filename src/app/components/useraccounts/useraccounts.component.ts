import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { validatePasswordMatch } from '../../helpers/validatePasswordMatch';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { LogsService } from '../../services/logs.service';
import { StoreService } from '../../services/store.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-useraccounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './useraccounts.component.html',
  styleUrl: './useraccounts.component.css'
})
export class UseraccountsComponent implements OnInit, AfterViewInit {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ProfileModalForm') ProfileModal!: ElementRef;
  @ViewChild('ForgetPassModalForm') ForgetPassModal!: ElementRef;

  public roleNoFromToken: string = '*';

  isModalOpen = false;

  public userAccounts: any = [];
  totalItems: number = 0;
  public userProfiles: any = [];
  searchKey: string = '';

  userGroups: any[] = [];

  branches: any[] = [];
  departments: any[] = [];
  sections: any[] = [];
  positions: any[] = [];

  public userAccount: any;
  public userProfile: any;
  userAccountForm!: FormGroup;
  userProfileForm!: FormGroup;
  userPasswordForm!: FormGroup;
  isEditMode: boolean = false;
  isChangePass: boolean = false;
  currentEditId: number | null = null;

  isLoading: boolean = true;

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  constructor(private fb: FormBuilder, private auth: AuthService,
    private api: ApiService, private store: StoreService,
    private logger: LogsService) {


    this.ngOnInit();

  }


  ngOnInit(): void {
    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.checkPrivileges();

    this.userAccountForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      ug: ['', Validators.required]
    }, { validators: validatePasswordMatch('password', 'confirmPassword') });


    this.userPasswordForm = this.fb.group({
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
    this.getAllUserAccounts();
    this.loadUserGroups();
    this.loadBranches();
    this.loadPositions();
    this.setupModalClose();
  }

  setupModalClose() {
    this.closeModal(this.AddEditModal);
    this.closeModal(this.ProfileModal);
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('USER ACCOUNTS', 'create');
    this.canRetrieve = this.store.isAllowedAction('USER ACCOUNTS', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('USER ACCOUNTS', 'update');
    this.canDelete = this.store.isAllowedAction('USER ACCOUNTS', 'delete');
    this.canPost = this.store.isAllowedAction('USER ACCOUNTS', 'post');
    this.canUnpost = this.store.isAllowedAction('USER ACCOUNTS', 'unpost');
  }

  openAddEditModal() {
    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
    modal.show();
  }

  openAProfileModal() {
    this.logger.printLogs('i', 'Modal', 'Open Modal Profile >>> ');
    const modal = new bootstrap.Modal(this.ProfileModal.nativeElement);
    modal.show();
  }

  openChangePassModal() {
    this.logger.printLogs('i', 'Modal', 'Open Change Pass >>> ');
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

  onCloseProfile() {
    this.closeModal(this.ProfileModal)
    this.resetForm();
  }

  // Load UserGroup
  loadUserGroups(): void {
    this.api.getAllUserGroups(this.roleNoFromToken).subscribe(
      data => {
        this.logger.printLogs('i', 'USE ROLE : ', this.roleNoFromToken);
        this.logger.printLogs('i', 'USE GROUPS : ', data);
        this.userGroups = data;
        this.userGroups = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.userGroups
          : this.userGroups.filter(ug => ug.userGroupName != 'System Administrator' && ug.userGroupName != 'System Generated');
      },
      err => {
        this.logger.printLogs('w', 'Loading user groups Denied', err);
      }
    );
  }

  // Load Positions
  loadPositions(): void {
    this.api.getAllPositions().subscribe(
      data => {
        this.logger.printLogs('i', 'POSITION : ', data);
        this.positions = data;
        this.positions = this.roleNoFromToken === 'System Administrator' || this.roleNoFromToken === '*' ? this.positions
          : this.positions.filter(ug => ug.positionName != 'System Administrator' && ug.positionName != 'Test');
      },
      err => {
        this.logger.printLogs('w', 'Loading Positions Denied', err);
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
        this.logger.printLogs('w', 'Loading Companies Denied', err);
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
    this.logger.printLogs('i', 'Branch', "Selected Branch: " + branchID);
    if (branchID) {
      this.loadDepartments(branchID);
    } else {
      this.departments = [];
    }
  }


  // Load Departments
  loadDepartments(branchID: string): void {
    this.api.getDepartmentsByCompanyID(branchID!).subscribe(
      data => {
        this.departments = data;
        this.logger.printLogs('i', "Load Department", this.departments);
        if (this.userProfile.depID) {
          this.logger.printLogs('i', "Load User Prifle Department", this.departments);
          this.loadSections(this.userProfile.depID);
        }
      },
      err => {
        this.logger.printLogs('w', 'Loading Departments Denied', err);
      }
    );
  }
  // Handle Department change
  onDepartmentChange(event: Event): void {
    this.sections = [];
    this.userProfileForm.patchValue({
      secID: [''],
    });
    const target = event.target as HTMLSelectElement;
    const depID = target.value;
    this.logger.printLogs('i', 'Department', "Selected Department: " + depID);
    if (depID) {
      this.loadSections(depID);
    } else {
      this.sections = [];
    }
  }

  // Load Sections
  loadSections(depID: string): void {
    if (depID) {

      this.api.getSectionsByDepID(depID).subscribe(
        data => {
          this.sections = data;
          this.logger.printLogs('i', "Load Section", this.sections);


          if (!this.isModalOpen && this.userProfile) {
            this.userProfileForm.patchValue({
              lastname: this.userProfile.lastname,
              firstname: this.userProfile.firstname,
              middlename: this.userProfile.middlename,
              sex: this.userProfile.sex,
              branchID: this.userProfile.branchID ? this.userProfile.branchID : this.userProfileForm.value['branchID'],
              depID: this.userProfile.depID ? this.userProfile.depID : this.userProfileForm.value['depID'],
              secID: this.userProfile.secID ? this.userProfile.secID : this.userProfileForm.value['secID'],
              positionID: this.userProfile.positionID
            });

            this.logger.printLogs('i', "Submit Profile", this.userProfileForm.value);

            this.openAProfileModal();
            this.isModalOpen = true;
          }
        },
        err => {
          this.logger.printLogs('w', 'Loading Sections Denied', err);
        }
      );
    }
  }

  getAllUserAccounts() {
    this.isLoading = true; // Stop showing the loading spinner
    // Simulate an API call with a delay
    setTimeout(() => {
      //Populate all User Groups
      this.api.getAllUserAccounts()
        .subscribe({
          next: (res) => {
            this.totalItems = res.length;
            this.userAccounts = res;
            this.logger.printLogs('i', 'LIST OF USERT ACCOUTNS', this.userAccounts);
            this.userAccounts = res.slice(0, 20);
            this.isLoading = false; // Stop showing the loading spinner
          },
          error: (err: any) => {
            this.logger.printLogs('w', "Fetching User Group Denied", err);
          }
        });

    }, 3000); // Simulate a 2-second delay
  }

  getProfileByUserID(userAccount: any) {
    // Reset form and sections array before loading new data
    this.resetForm();
    this.userAccount = userAccount;
    this.api.getProfile(userAccount.userID)
      .subscribe({
        next: (res) => {
          if (res[0]) {
            this.isEditMode = true;
            this.userProfile = res[0];
            this.currentEditId = this.userProfile.profileID;
            this.logger.printLogs('i', "Show Profile", this.userProfile);
            if (this.userProfile.branchID!) { this.loadDepartments(this.userProfile.branchID); } else {
              if (!this.isModalOpen && this.userProfile) {
                this.userProfileForm.patchValue({
                  lastname: this.userProfile.lastname,
                  firstname: this.userProfile.firstname,
                  middlename: this.userProfile.middlename,
                  sex: this.userProfile.sex,
                  branchID: this.userProfile.branchID || '',
                  depID: this.userProfile.depID || '',
                  secID: this.userProfile.secID || '',
                  positionID: this.userProfile.positionID || ''
                });

                this.logger.printLogs('i', "Submit Profile  >>>>>>", this.userProfileForm.value);

                this.openAProfileModal();

                this.isModalOpen = true;
              }
            }

          } else {
            this.isEditMode = false;
            this.logger.printLogs('i', 'Profile', "No Profile found!");
            if (!this.isModalOpen) {
              this.openAProfileModal();
            }
          }
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Fetching Profile Denied', err);
        }
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    this.searchUserAccount();
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchUserAccount();
    } else {
      this.searchUserAccount();
    }
  }

  // Validate Match Password and Confirm Password
  get passwordMismatch(): boolean {
    const form = this.isChangePass ? this.userPasswordForm : this.userAccountForm;
    return form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched === true;
  }

  // Validate Minimum Lenght Password
  get passwordMinimumLength(): boolean {
    const form = this.userAccountForm;
    const passwordControl = form.get('password');
    return passwordControl ? passwordControl.hasError('minlength') && passwordControl.touched : false;
  }

  // Validate Password Strenght
  get passwordStrength(): boolean {
    const form = this.userAccountForm;
    const passwordControl = form.get('password');
    return passwordControl ? passwordControl.hasError('passwordStrength') && passwordControl.touched : false;
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

  searchUserAccount() {
    //Populate all User Groups
    if (!this.searchKey) {
      this.getAllUserAccounts();
    } else

      if (this.searchKey.trim()) {
        this.api.searchUserAccounts(this.searchKey)
          .subscribe({
            next: (res) => {
              this.userAccounts = res.slice(0, 20);
            },
            error: (err: any) => {
              this.logger.printLogs('w', "Fetching User Accounts Denied", err);
            }
          });
      }
  }

  onSubmit() {
    // const now = new Date();

    if (this.userAccountForm.valid) {

      this.logger.printLogs('i', 'User Account Form', this.userAccountForm.value);

      const userAccount = {
        "userName": this.userAccountForm.value['username'],
        "password": this.userAccountForm.value['password'],
        "ugid": this.userAccountForm.value['ug']
      }


      this.logger.printLogs('i', 'User Account', "currentEditId: " + this.currentEditId);

      if (this.isEditMode && this.currentEditId) {
        this.Update(userAccount)
      } else {
        this.Save(userAccount);
      }

    } else {
      this.logger.printLogs('i', 'User Account Form', "Invalidate Form");
      this.validateFormFields(this.userAccountForm);
    }


  }

  Save(userAccount: any) {
    this.auth.register(userAccount)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', "Saving Success", res.message);

          Swal.fire('Saved', res.message, 'success');
          this.api.showToast(res.message, 'Saved!', 'success');

          this.getAllUserAccounts();
          this.resetForm();
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Saving Denied', err);
          Swal.fire('Saving Denied', err, 'warning');
        }
      });
  }

  restoreData(userAccount: any) {
    this.isEditMode = true;
    this.currentEditId = userAccount.userID;
    // this.hidePassword(true);

    this.api.searchUserGroups(userAccount.userGroupName!)
      .subscribe({
        next: (res) => {

          this.userAccountForm.patchValue({
            username: userAccount.userName,
            password: 'password',
            confirmPassword: 'password',
            // password: userAccount.password,
            // confirmPassword: userAccount.password,
            ug: res[0].ugid
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', "Fetching User Group by ID Denied", err);
        }
      });

    this.openAddEditModal();

  }


  Update(userAccount: any) {

    Swal.fire({
      title: 'Update',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateUserAccount(this.currentEditId!, userAccount)
          .subscribe({
            next: (res) => {
              this.logger.printLogs('i', "Updating Success", res.message);
              Swal.fire('Updated!', res.message, 'success');
              this.api.showToast(res.message, 'Updated!', 'success');

              // this.closeModal()
              this.getAllUserAccounts();

            },
            error: (err: any) => {
              this.logger.printLogs('w', 'Updating Denied', err);
              Swal.fire('Updating Denied', err, 'warning');
            }
          });
      }
    });
  }


  onDelete(id: number, name: string) {
    //Confirm to Delete
    Swal.fire({
      title: 'Remove ' + name + "",
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        // Execute Delete
        this.api.deleteUserAccount(id)
          .subscribe({
            next: (res) => {

              Swal.fire('Deleted', res.message, 'success');
              this.api.showToast(res.message, 'Deleted!', 'success');

              this.getAllUserAccounts();
            },
            error: (err: any) => {
              this.logger.printLogs('w', 'Deleting Denied', err);
              Swal.fire('Deleting Denied', err, 'warning');
            }
          });
      }
    });
  }


  onSubmitProfile() {

    this.logger.printLogs('i', "User Profile Form", this.userProfileForm.value);

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
        userID: this.userAccount ? this.userAccount.userID : null
      }


      this.logger.printLogs('i', 'User Profile', "currentEditId: " + this.currentEditId);
      this.logger.printLogs('i', "EditMode: ", this.isEditMode);

      if (this.isEditMode && this.currentEditId) {
        this.logger.printLogs('i', "User Profile Form", this.userProfileForm.value);
        this.UpdateProfile(userProfile)
      } else {
        if (this.userAccount) {
          this.logger.printLogs('i', "User Account ID", this.userAccount.userID);
        }
        this.logger.printLogs('i', "User Profile Form ", this.userProfileForm.value);
        this.SaveProfile(userProfile);
      }

    }
    this.validateFormFields(this.userProfileForm);



  }

  SaveProfile(userProfile: any) {
    this.api.createProfile(userProfile)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', "Saving Success", res.message);

          this.resetForm();


          Swal.fire('Saved', res.message, 'success');
          this.api.showToast(res.message, 'Saved!', 'success');

          this.getAllUserAccounts();
          this.resetForm();
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Saving Denied', err);
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
        this.api.updateProfile(this.currentEditId!, userProfile)
          .subscribe({
            next: (res) => {
              this.logger.printLogs('i', "Updating Success", res.message);

              // Swal.fire('Success', res.message, 'success');
              Swal.fire('Updated!', res.message, 'success');
              this.api.showToast(res.message, 'Updated!', 'success');

              this.getAllUserAccounts();
              this.resetForm();
            },
            error: (err: any) => {
              this.logger.printLogs('w', 'Updating Denied', err);
              Swal.fire('Updating Denied', err, 'warning');
            }
          });
      }
    });
  }


  toggleVerification(event: Event, id: number, name: string) {

    const input = event.target as HTMLInputElement;
    const isVerified: boolean = input.checked;

    if (isVerified && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Verify Account.', 'warning');
      input.checked = !isVerified;
      return;
    }

    if (!isVerified && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to  Unverify Account.', 'warning');
      input.checked = !isVerified;
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !isVerified) || this.roleNoFromToken == 'System Administrator' || (!isVerified && this.canUnpost) || (isVerified && this.canPost)) {
      //Change verification status
      Swal.fire({
        title: (isVerified ? 'Verify' : 'Unverify') + " " + name,
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          // Execute Update Verification
          this.api.verifyUserAccount(id)
            .subscribe({
              next: (res) => {

                Swal.fire('Verified', res.message, 'success');
                this.api.showToast(res.message, 'Verified!', 'success');

                this.getAllUserAccounts();

              },
              error: (err: any) => {
                this.logger.printLogs('w', 'Verifying User Denied', err);
                Swal.fire('Verifying Denied', err, 'warning');
              }
            });
        } else {
          input.checked = !isVerified;
        }

        // this.getAllUserAccounts();
      });
    }
  }

  openForgotPassword(userAccount: any) {
    this.userAccount = userAccount;
    this.isChangePass = true;
    this.openChangePassModal()
  }

  onChangePass() {

    if (this.userPasswordForm.valid) {

      const ChangePassDto = {
        "OldPassword": this.userPasswordForm.value['oldpassword'],
        "NewPassword": this.userPasswordForm.value['newpassword'],
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
                this.logger.printLogs('i', "Updatin Password Success: ", res.message)

                Swal.fire('Password Changed', res.message, 'success');
                this.api.showToast(res.message, 'Password Changed!', 'success');

                this.getAllUserAccounts();
              },
              error: (err: any) => {
                this.logger.printLogs('w', 'Updating Password Denied', err);
                Swal.fire('Updating Denied', err, 'warning');
              }
            });
        }
      });


    } else {
      this.validateFormFields(this.userPasswordForm);
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.isChangePass = false;
    this.currentEditId = null;
    this.isModalOpen = false;
    this.userProfile = null;
    this.userAccountForm.reset(
      {
        username: '',
        password: '',
        confirmPassword: '',
        ug: ''
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
    // Clear related data
    this.departments = [];
    this.sections = [];

    // this.getAllUserAccounts();

    this.loadUserGroups();
    this.loadBranches();
    this.loadPositions();

    if (this.AddEditModal) {
      this.closeModal(this.AddEditModal);
    }
    if (this.ProfileModal) {
      this.closeModal(this.ProfileModal);
    }
    if (this.ForgetPassModal) {
      this.closeModal(this.ForgetPassModal);
    }

  }



}


