import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';


import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LogsService } from '../../../services/logs.service';
import { Privilege } from '../../../models/Privilege';
import { when } from 'jquery';
import { StoreService } from '../../../services/store.service';

@Component({
  selector: 'app-usergroup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usergroup.component.html',
  styleUrl: './usergroup.component.css'
})
export class UsergroupComponent implements OnInit, AfterViewInit {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('PrivilegeModalForm') PrivilegeModal!: ElementRef;

  public roleNoFromToken: string = '*';

  public userGroups: any = [];
  totalItems: number = 0;
  searchKey: string = '';

  public userGroup: any;
  userGroupForm!: FormGroup;
  isEditMode: boolean = false;
  currentEditId: number | null = null;


  privilege: Privilege | null = null;
  modules: any[] = [];
  privileges: any[] = [];
  selectedPrivileges: any[] = []; // Array to track selected module
  public ug: any | undefined | null = null;
  isLoading: boolean = false;

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  constructor(private fb: FormBuilder, private api: ApiService, 
    private auth: AuthService, private store: StoreService,
    private logger: LogsService) {

    this.ngOnInit();
  }
  ngAfterViewInit(): void {
    this.checkPrivileges();
  }

  ngOnInit(): void {
    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.checkPrivileges();

    this.userGroupForm = this.fb.group({
      userGroupName: ['', Validators.required],
      notes: ['', Validators.required]
    });

    this.getAllUserGroups();
    this.setupModalClose();
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('USER GROUPS', 'create');
    this.canRetrieve = this.store.isAllowedAction('USER GROUPS', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('USER GROUPS', 'update');
    this.canDelete = this.store.isAllowedAction('USER GROUPS', 'delete');
    this.canPost = this.store.isAllowedAction('USER GROUPS', 'post');
    this.canUnpost = this.store.isAllowedAction('USER GROUPS', 'unpost');
  }

  setupModalClose() {
    const modal = document.getElementById('AddEditModalForm')!;
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        // console.log('Modal is closed');
        this.resetForm();
      });
    }
  }

  openModal(modalElement: ElementRef) {
    const modal = new bootstrap.Modal(modalElement.nativeElement);
    modal.show();
  }

  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }


  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchUserGroups();
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchUserGroups();
    } else {
      this.searchUserGroups();
    }
  }

  searchUserGroups() {
    //Populate all User Groups
    if (!this.searchKey) {
      this.getAllUserGroups();
    } else

      if (this.searchKey.trim()) {
        this.api.searchUserGroups(this.searchKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching User Groups:", res);
              this.userGroups = res.slice(0, 10);
            },
            error: (err: any) => {
              console.log("Error Fetching User Groups:", err);
            }
          });
      }
  }

  getAllUserGroups() {
    //Populate all User Groups
    this.api.getAllUserGroups('*')
      .subscribe({
        next: (res) => {
          
          this.totalItems = res.length;
          this.userGroups = res.slice(0, 10);
          this.logger.printLogs('i', 'LIST OF USER GROUPS', this.userGroups);
        },
        error: (err: any) => {
          console.log("Error Fetching User Groups:", err);
        }
      });
  }
  
  onSubmit() {
    // const now = new Date();

    if (this.userGroupForm.valid) {
      console.log(this.userGroupForm.value);

      const userGroup = {
        "UserGroupName": this.userGroupForm.value['userGroupName'],
        "Notes": this.userGroupForm.value['notes'],
      }
      if (this.isEditMode && this.currentEditId) {
        this.Update(userGroup)
      } else {
        this.Save(userGroup);
      }

    }
    this.validateFormFields(this.userGroupForm);



  }
  Update(userGroup: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateUserGroup(this.currentEditId!, userGroup)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getAllUserGroups();

              Swal.fire({
                title: 'Saved!',
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
  }

  Save(userGroup: any) {
    this.api.createUserGroup(userGroup)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          // this.closeModal()
          this.getAllUserGroups();

          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
          this.userGroupForm.reset();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving User', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  restoreData(userGroup: any) {
    this.isEditMode = true;
    this.currentEditId = userGroup.ugid;

    console.log("Retreive User Group: ", userGroup);
    this.userGroupForm.patchValue({
      userGroupName: userGroup.userGroupName,
      notes: userGroup.notes
    });

    this.openModal(this.AddEditModal);
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.userGroupForm.reset();
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
        this.api.deleteUserGroup(id)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getAllUserGroups();

              Swal.fire({
                title: 'Success!',
                text: res.message,
                icon: 'success'
              });
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

  onPrivilege(userGroup: any) {
    this.logger.printLogs('i', 'Selected UGID', userGroup);
    this.ug = userGroup;
    this.isLoading = true; // Show loading indicator

    this.api.retrievePrivilegByUG(this.ug.ugid).subscribe({
      next: (res) => {
        this.privileges = res;
        this.logger.printLogs('i', 'Retrieved Privilegessssss', res);


        this.isEditMode = !(this.privileges && this.privileges.length < 1);

        if (!this.isEditMode) {
          this.loadDefaultModules();
        } else {
          this.restoreLoadModule();
        }
        this.openModal(this.PrivilegeModal)
      },
      error: (err: any) => {
        this.isLoading = false; // Hide loading indicator
        this.logger.printLogs('w', 'Error Retrieving Privileges', err);
        Swal.fire('Denied', err.message || 'Error retrieving privileges.', 'warning');
      },
    });
  }


  restoreLoadModule() {
    const updatedPrivileges: any[] = [];

    this.api.retrieveModules()
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retreiving Modules', res);
          this.modules = res;


          this.modules.forEach(module => {
            // Find matching privilege for the current module
            const matchedPrivilege = this.privileges.find(privilege => module.mid === privilege.mid);

            if (matchedPrivilege) {
              // Push updated privilege if a match is found
              updatedPrivileges!.push(new Privilege(
                null,
                this.ug.ugid,
                module.mid,
                module.moduleName,
                matchedPrivilege.isActive,
                matchedPrivilege.c,
                matchedPrivilege.r,
                matchedPrivilege.u,
                matchedPrivilege.d,
                matchedPrivilege.post,
                matchedPrivilege.unpost
              ));
            } else {
              // Push new privilege as inactive if no match is found
              updatedPrivileges!.push(new Privilege(
                null,
                this.ug.ugid,
                module.mid,
                module.moduleName,
                false, // Default inactive
                false,
                false,
                false,
                false,
                false,
                false
              ));
            }
          });


          this.privileges = updatedPrivileges!;

          this.logger.printLogs('i', 'Retreiving Privileges', this.privileges);

          // Delay modal opening slightly to ensure UI stability
          setTimeout(() => {
            this.isLoading = false; // Hide loading indicator
          }, 3);
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving Modules', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  loadDefaultModules() {

    this.api.retrieveModules()
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retreiving Modules', res);
          this.modules = res;

          this.modules.forEach(element => {
            this.privileges.push(new Privilege(null, this.ug.ugid, element.mid, element.moduleName, false, false, false, false, false, false, false));
          });


          this.selectedPrivileges = this.privileges

          this.logger.printLogs('i', 'Default Privileges', this.privileges);

          this.isLoading = false;
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving Modules', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  toggleAllModule(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;
    // Loop through all items
    this.privileges.forEach(item => {
      item.isActive = isChecked; // Update isActive based on checkbox state
    });

    this.displaySelectedItems(); // Update the UI or other components

    this.logger.printLogs('i', 'Toggle all selection', this.privileges!);
  }

  // Optional function to get the currently selected items
  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected Module', this.selectedPrivileges!);
  }

  // toggleSelectionModule(privilege: any, event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const isChecked: boolean = input.checked;


  //   this.privileges.forEach(item => {
  //     // Update Action on Module
  //     if (item.moduleName == privilege.moduleName) {
  //       item.isActive = isChecked;
  //       if (!(item.moduleName == 'GLOBAL' || item.moduleName == 'REPORTS')) {
  //         item.c = isChecked;
  //         item.r = isChecked;
  //         item.u = isChecked;
  //         item.d = isChecked;
  //       }
  //       if (item.moduleName == 'PAR' || item.moduleName == 'ICS' ||
  //         item.moduleName == 'PTR' || item.moduleName == 'ITR' ||
  //         item.moduleName == 'PRS' || item.moduleName == 'RRSEP'
  //       ) {
  //         item.post = isChecked;
  //         item.unpost = isChecked;
  //       }
  //     }

  //     if (privilege.moduleName == 'ITEM CATEGORY' || privilege.moduleName == 'COMPANY' ||
  //       privilege.moduleName == 'POSITION' || privilege.moduleName == 'USER GROUPS') {
  //       if (item.moduleName == 'GLOBAL' && isChecked == true) {
  //         item.isActive = true;
  //       }
  //     }

  //   });



  //   this.logger.printLogs('i', 'Toggle selection Module', this.privileges!);


  //   this.selectedPrivileges = this.privileges
  //   this.displaySelectedItems(); // Update the UI or other components

  // }

  toggleSelectionModule(privilege: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    this.privileges.forEach(item => {
      // Update Action on Module
      if (item.moduleName == privilege.moduleName) {
        item.isActive = isChecked;
        if (!(item.moduleName == 'GLOBAL' || item.moduleName == 'REPORTS')) {
          item.c = isChecked;
          item.r = isChecked;
          item.u = isChecked;
          item.d = isChecked;
        }
        if (
          ['PAR', 'ICS', 'PTR', 'ITR', 'PRS', 'RRSEP', 'USER ACCOUNTS'].includes(item.moduleName)
        ) {
          item.post = isChecked;
          item.unpost = isChecked;
        }
      }
    });

    // Check specific modules for "GLOBAL" module logic
    const importantModules = ['ITEM CATEGORY', 'COMPANY', 'POSITION', 'USER GROUPS'];
    const isAnyActive = this.privileges
      .filter(item => importantModules.includes(item.moduleName))
      .some(item => item.isActive); // At least one is active

    this.privileges.forEach(item => {
      if (item.moduleName === 'GLOBAL') {
        item.isActive = isAnyActive; // Activate if at least one is active
      }
    });

    this.logger.printLogs('i', 'Toggle selection Module', this.privileges!);

    this.selectedPrivileges = this.privileges;
    this.displaySelectedItems(); // Update the UI or other components
  }


  toggleSelection(action: string, privilege: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    this.privileges.forEach(item => {

      // Update Action on Module
      if (item.moduleName == privilege.moduleName) {
        switch (action) {
          case "add":
            item.c = isChecked;
            break;
          case "retrieve":
            item.r = isChecked;
            break;
          case "update":
            item.u = isChecked;
            break;
          case "delete":
            item.d = isChecked;
            break;
          case "post":
            item.post = isChecked;
            break;
          case "unpost":
            item.unpost = isChecked;
            break;
        }
      }

      this.logger.printLogs('i', 'Toggle selection', this.privileges!);

    });

    this.selectedPrivileges = this.privileges
    this.displaySelectedItems();
  }

  onSubmitPrivilege() {
    if (!this.privileges || this.privileges.length === 0) {
      Swal.fire('Warning', 'No privileges to submit.', 'warning');
      return;
    }

    if (!this.isEditMode) {
      // Saving new privileges
      this.logger.printLogs('i', 'Saving Privilege', this.privileges);
      this.api.createPrivilege(this.privileges).subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Successfully', res);
          Swal.fire('Saved', res.message || 'Privileges saved successfully!', 'success');
        },
        error: (err) => {
          this.logger.printLogs('e', 'Error Saving Privileges', err);
          Swal.fire('Error', err || 'An error occurred while saving privileges.', 'error');
        },
      });
    } else {
      // Updating privileges
      this.logger.printLogs('i', 'Updating Privilege', this.privileges);
      this.api.updatePrivilege(this.ug.ugid, this.privileges).subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Successfully', res);
          Swal.fire('Updated', res.message || 'Privileges updated successfully!', 'success');
        },
        error: (err) => {
          this.logger.printLogs('e', 'Error Updating Privileges', err);
          Swal.fire('Error', err || 'An error occurred while saving privileges.', 'error');
        },
      });

    }
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





}

