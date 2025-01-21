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
  isEditMode: boolean = false;
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
    private api: ApiService, private store: StoreService, private logger: LogsService) {


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
    const modal = new bootstrap.Modal(this.ProfileModal.nativeElement);
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
    this.api.getDepartmentsByCompanyID(branchID!).subscribe(
      data => {
        this.departments = data;
        console.log("Load Department", this.departments);
        if (this.userProfile) {
          this.loadSections(this.userProfile.depID);
        }
      },
      err => {
        console.error('Error: loading Departments => ', err);
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
    console.log("Selected Department: " + depID);
    if (depID) {
      this.loadSections(depID);
    } else {
      this.sections = [];
    }
  }

  // Load Sections
  loadSections(depID: string): void {
    this.api.getSectionsByDepID(depID!).subscribe(
      data => {
        this.sections = data;
        console.log("Load Section", this.sections);


        if (!this.isModalOpen && this.userProfile) {
          this.userProfileForm.patchValue({
            lastname: this.userProfile.lastname,
            firstname: this.userProfile.firstname,
            middlename: this.userProfile.middlename,
            sex: this.userProfile.sex,
            branchID: this.userProfile.branchID,
            depID: this.userProfile.depID,
            secID: this.userProfile.secID,
            positionID: this.userProfile.positionID
          });

          console.log("Submit Profile", this.userProfileForm.value);

          this.openAProfileModal();
        }
      },
      err => {
        console.error('Error: loading Sections => ', err);
      }
    );
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
            this.userAccounts = res.slice(0, 10);
            this.isLoading = false; // Stop showing the loading spinner
          },
          error: (err: any) => {
            console.log("Error Fetching User Groups:", err);
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
            console.log("Show Profile", this.userProfile);
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

                console.log("Submit Profile", this.userProfileForm.value);

                this.openAProfileModal();
              }
            }

          } else {
            this.isEditMode = false;
            console.log("No Profile found!");
            if (!this.isModalOpen) {
              this.openAProfileModal();
            }
          }
        },
        error: (err: any) => {
          console.log('Error Fetching Profile:', err);
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
    const form = this.userAccountForm;
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
              // console.log("Fetching User Groups:", res);
              this.userAccounts = res.slice(0, 10);
            },
            error: (err: any) => {
              console.log("Error Fetching User Accounts:", err);
            }
          });
      }
  }

  onSubmit() {
    // const now = new Date();

    if (this.userAccountForm.valid) {

      console.log(this.userAccountForm.value);

      const userAccount = {
        "userName": this.userAccountForm.value['username'],
        "password": this.userAccountForm.value['password'],
        "ugid": this.userAccountForm.value['ug']
      }


      console.log("currentEditId: " + this.currentEditId);
      console.log("EditMode: " + this.isEditMode);

      if (this.isEditMode && this.currentEditId) {
        this.Update(userAccount)
      } else {
        this.Save(userAccount);
      }

    } else {
      this.validateFormFields(this.userAccountForm);
    }


  }

  Save(userAccount: any) {
    this.auth.register(userAccount)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);


          Swal.fire('Saved!', res.message, 'success');
          this.getAllUserAccounts();
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

  restoreData(userAccount: any) {
    this.isEditMode = true;
    this.currentEditId = userAccount.userID;
    // this.hidePassword(true);

    // console.log("Retreive User Account: ", userAccount);

    this.api.searchUserGroups(userAccount.userGroupName!)
      .subscribe({
        next: (res) => {

          // console.log("Fetching User Group:", res);
          // console.log("Fetching User Group:", res[0].ugid);

          this.userAccountForm.patchValue({
            username: userAccount.userName,
            password: userAccount.password,
            confirmPassword: userAccount.password,
            ug: res[0].ugid
          });
        },
        error: (err: any) => {
          console.log("Error Fetching User Group by ID:", err);
        }
      });

    this.openAddEditModal();

  }


  Update(userAccount: any) {

    Swal.fire({
      title: 'Edit?',
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
              console.info("Success: ", res.message);


              Swal.fire('Saved!', res.message, 'success');

              // this.closeModal()
              this.getAllUserAccounts();

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
              // console.info("Success: ", res.message);


              Swal.fire('Success!', res.message, 'success');
              this.getAllUserAccounts();
            },
            error: (err: any) => {
              console.log('Error response:', err);
              Swal.fire({
                title: 'Deleting Denied!',
                text: err,
                icon: 'warning'
              });
            }
          });
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
        userID: this.userAccount ? this.userAccount.userID : null
      }


      console.log("currentEditId: " + this.currentEditId);
      console.log("EditMode: " + this.isEditMode);

      if (this.isEditMode && this.currentEditId) {
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

  SaveProfile(userProfile: any) {
    this.api.createProfile(userProfile)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          this.resetForm();

          Swal.fire('Saved!', res.message, 'success');

          this.getAllUserAccounts();
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
        this.api.updateProfile(this.currentEditId!, userProfile)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              Swal.fire('Success', res.message, 'success');
              this.getAllUserAccounts();
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

                Swal.fire('Success', res.message, 'success');
                this.getAllUserAccounts();

              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Verifying User', err);
                Swal.fire('Denied', err, 'warning');
              }
            });
        } else {
          input.checked = !isVerified;
        }

        // this.getAllUserAccounts();
      });
    }
  }

  setupModalClose() {
    this.closeModal(this.AddEditModal);
    this.closeModal(this.ProfileModal);
  }

  resetForm() {
    this.isEditMode = false;
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

    this.closeModal(this.AddEditModal);
    this.closeModal(this.ProfileModal);
  }



}


