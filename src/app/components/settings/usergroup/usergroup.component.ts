import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';


import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LogsService } from '../../../services/logs.service';
import { Privilege } from '../../../models/Privilege';

@Component({
  selector: 'app-usergroup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usergroup.component.html',
  styleUrl: './usergroup.component.css'
})
export class UsergroupComponent implements OnInit {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('PrivilegeModalForm') PrivilegeModal!: ElementRef;

  public roleNoFromToken: string = '*';

  public userGroups: any = [];
  searchKey: string = '';

  public userGroup: any;
  userGroupForm!: FormGroup;
  isEditMode: boolean = false;
  currentEditId: number | null = null;


  privilege: Privilege | null = null;
  modules: any[] = [];
  privileges: any[] = [];
  UGID: number | null = null;


  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private logger: LogsService) {

    this.userGroupForm = this.fb.group({
      userGroupName: ['', Validators.required],
      notes: ['', Validators.required]
    });


    this.roleNoFromToken = this.auth.getRoleFromToken();
  }

  ngOnInit(): void {
    // this.global.setTitle("USER GROUP");
    this.getAllUserGroups();
    this.setupModalClose();
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
          this.userGroups = res.slice(0, 10);
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
  onPrivilege(UGID: any) {
    this.logger.printLogs('i', 'Selected UGID', UGID);
    this.UGID = UGID;
    this.api.retrievePrivilegByUG(this.UGID)
      .subscribe({
        next: (res) => {
          // this.logger.printLogs('i', 'Retreiving Privilege', res);
          this.privileges = res;

          if (this.privileges.length < 1) {
            this.loadDefaultModules();
          }
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving Privilege', err);
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
            this.privileges.push(new Privilege(null, this.UGID, element.mid, element.moduleName, true, false, false, false, false, false, false));
          });

          this.logger.printLogs('i', 'Default Privileges', this.privileges);

          this.openModal(this.PrivilegeModal)
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


  }
  toggleSelection(access: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

  }

  onSubmitPrivilege() {
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

