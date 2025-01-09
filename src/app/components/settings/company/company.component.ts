import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { ApiService } from '../../../services/api.service';
import { window } from 'rxjs';
import { StoreService } from '../../../services/store.service';
import { LogsService } from '../../../services/logs.service';

const $: any = window('$');

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css'
})
export class CompanyComponent implements OnInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('DeptAddEditModalForm') DeptAddEditModal!: ElementRef;
  @ViewChild('SectAddEditModalForm') SectAddEditModal!: ElementRef;

  public companies: any = [];
  totalItems: number = 0;
  public departments: any = [];
  public sections: any = [];


  searchKey: string = '';
  typeKey: string | null | undefined;

  public companiestype: string[] = [];

  public company: any;
  public deparment: any;
  public section: any;
  companyForm!: FormGroup;
  departmentForm!: FormGroup;
  sectionForm!: FormGroup;
  isEditMode: boolean = false;
  currentEditId: number | null = null;


  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;


  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private logger: LogsService) {

    this.ngOnInit();
  }

  openAddEditModal() {
    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
    modal.show();
  }
  openDeptAddEditModal() {
    const modal = new bootstrap.Modal(this.DeptAddEditModal.nativeElement);
    modal.show();
  }
  openSectAddEditModal() {
    const modal = new bootstrap.Modal(this.SectAddEditModal.nativeElement);
    modal.show();
  }

  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }

  ngOnInit(): void {

    this.checkPrivileges();

    this.companyForm = this.fb.group({
      branchName: ['', Validators.required],
      type: ['', Validators.required]
    });

    this.departmentForm = this.fb.group({
      departmentName: ['', Validators.required],
    });

    this.sectionForm = this.fb.group({
      sectionName: ['', Validators.required],
    });

    this.getCompanies();
    this.setupModalClose();
  }

  ngAfterViewInit(): void {

    this.checkPrivileges();
    const accordionElement = document.getElementById('accordionPanelsStayOpenExample');
    if (accordionElement) {
      const accordion = new bootstrap.Collapse(accordionElement, {
        toggle: false
      });
    }
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('COMPANY', 'create');
    this.canRetrieve = this.store.isAllowedAction('COMPANY', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('COMPANY', 'update');
    this.canDelete = this.store.isAllowedAction('COMPANY', 'delete');
    this.canPost = this.store.isAllowedAction('COMPANY', 'post');
    this.canUnpost = this.store.isAllowedAction('COMPANY', 'unpost');
  }

  setupModalClose() {
    const modal = document.getElementById('AddEditModalForm')!;
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        // console.log('Branch Modal is closed');
        this.resetForm();
      });
    }
    const Deptmodal = document.getElementById('DeptAddEditModalForm')!;
    if (Deptmodal) {
      Deptmodal.addEventListener('hidden.bs.modal', () => {
        // console.log('Department Modal is closed>>>>>');
        // removeAllModalBackdrops();
        this.resetForm();
      });
    }

    const Sectmodal = document.getElementById('SectAddEditModalForm')!;
    if (Sectmodal) {

      Sectmodal.addEventListener('hidden.bs.modal', () => {
        console.log('Section Modal is closed......');
        this.resetForm();
      });
    }

  }


  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchCompanies();
    }
  }


  onKeyUp(event: KeyboardEvent): void {
    this.searchCompanies();
  }


  onAutoSuggest(): void {
    this.searchCompanyTypes();
  }

  searchCompanyTypes() {
    //Populate all Item Groups
    if (!this.typeKey) {
      this.getCompanies();
    } else

      if (this.typeKey.trim()) {
        this.api.searchCompanyTypes(this.typeKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching Company Type: ", res);
              if (res)
                this.companiestype = res;
            },
            error: (err: any) => {
              console.log("Error Fetching Company: ", err);
            }
          });
      }
  }

  selectItem(t: string): void {
    this.typeKey = t ? t : null;  // Display the selected item's description in the input field

    this.companyForm.patchValue({
      type: this.typeKey  // Patch the selected IID to the form
    });

    this.companiestype = [];  // Clear the suggestion list after selection

  }

  searchCompanies() {
    //Populate all Item Groups
    if (!this.searchKey) {
      this.getCompanies();
    } else

      if (this.searchKey.trim()) {
        this.api.searchCompanies(this.searchKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching Company: ", res);
              this.companies = res;
            },
            error: (err: any) => {
              console.log("Error Fetching Company: ", err);
            }
          });
      }
  }


  getCompanies() {
    //Populate all Company Groups
    this.api.getCompanies()
      .subscribe({
        next: (res) => {
          this.totalItems = res.length;
          this.companies = res;
          this.logger.printLogs('i', 'LIST OF COMPANY', this.companies);
        },
        error: (err: any) => {
          console.log("Error Fetching Company: ", err);
        }
      });
  }

  getDepartmentsByCompanyID(id: string) {
    //Populate all Department base to selected Company
    this.api.getDepartmentsByCompanyID(id)
      .subscribe({
        next: (res) => {
          this.departments = res;
        },
        error: (err: any) => {
          console.log("Error Fetching Departments: ", err);
        }
      });
    this.openDeptAddEditModal();
  }

  getSectionsByDepID(id: string) {
    //Populate all Department base to selected Company
    this.api.getSectionsByDepID(id)
      .subscribe({
        next: (res) => {
          this.sections = res;
        },
        error: (err: any) => {
          console.log("Error Fetching Sections: ", err);
        }
      });
    this.closeModal(this.DeptAddEditModal);
    this.openSectAddEditModal();
  }

  onSubmit() {
    // const now = new Date();

    if (this.companyForm.valid) {
      console.log(this.companyForm.value);

      const itemGroup = {
        "branchName": this.companyForm.value['branchName'],
        "type": this.companyForm.value['type'],
      }
      if (this.isEditMode && this.currentEditId) {
        this.Update(itemGroup)
      } else {
        this.Save(itemGroup);
      }

    }
    this.validateFormFields(this.companyForm);

  }

  Save(company: any) {
    this.api.createCompany(company)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          // this.closeModal()
          this.getCompanies();
          this.resetForm()

          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
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

  Update(company: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateCompany(this.currentEditId!, company)
          .subscribe({
            next: (res) => {
              // console.info("Success: ", res.message);

              // this.closeModal()
              this.getCompanies();
              this.resetForm();

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

  restoreData(company: any) {
    this.isEditMode = true;
    this.company = company;
    this.currentEditId = company.branchID;

    // console.log("Retreive BranchID: ", this.currentEditId);
    // console.log("Retreive Item Group: ", company);
    this.companyForm.patchValue({
      branchName: company.branchName,
      type: company.type
    });

    this.openAddEditModal();
  }



  onSubmitDept() {
    // const now = new Date();

    if (this.departmentForm.valid) {
      console.log(this.departmentForm.value);

      const department = {
        "departmentName": this.departmentForm.value['departmentName'],
        "branchID": this.company.branchID,
      }
      if (this.isEditMode && this.currentEditId) {
        this.UpdateDept(department)
      } else {
        this.SaveDept(department);
      }

    }
    this.validateFormFields(this.departmentForm);

  }


  SaveDept(deparment: any) {
    this.api.createDepartment(deparment)
      .subscribe({
        next: (res) => {
          console.info("Dept Save Success: ", res.message);
          this.getDepartmentsByCompanyID(this.company.branchID);
          this.departmentForm.reset();
          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
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

  UpdateDept(deparment: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateDepartment(this.currentEditId!, deparment)
          .subscribe({
            next: (res) => {

              console.info("Dept Update Success: ", res.message);
              this.getDepartmentsByCompanyID(this.company.branchID);
              this.departmentForm.reset();

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

  openDepartment(company: any) {
    this.company = company;
    this.getDepartmentsByCompanyID(this.company.branchID);
  }



  onSubmitSect() {
    // const now = new Date();

    if (this.sectionForm.valid) {
      console.log(this.sectionForm.value);

      const section = {
        "sectionName": this.sectionForm.value['sectionName'],
        "depID": this.deparment.depID,
      }
      if (this.isEditMode && this.currentEditId) {
        this.UpdateSect(section)
      } else {
        this.SaveSect(section);
      }

    }
    this.validateFormFields(this.sectionForm);

  }


  SaveSect(section: any) {
    this.api.createSection(section)
      .subscribe({
        next: (res) => {
          console.info("Sect Save Success: ", res.message);
          this.getSectionsByDepID(this.deparment.depID);
          this.sectionForm.reset();
          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
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

  UpdateSect(section: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateSection(this.currentEditId!, section)
          .subscribe({
            next: (res) => {

              console.info("Sect Update Success: ", res.message);
              this.getSectionsByDepID(this.deparment.depID);
              this.sectionForm.reset();

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

  openSection(deparment: any) {
    this.deparment = deparment;
    this.getSectionsByDepID(this.deparment.depID);
  }

  restoreDeptData(deparment: any) {
    this.isEditMode = true;
    this.deparment = deparment;
    this.currentEditId = deparment.depID;

    this.departmentForm.patchValue({
      departmentName: deparment.departmentName,
    });

    this.showCancelDeptEdit(true);
  }

  restoreSectData(section: any) {
    this.isEditMode = true;
    this.section = section;
    this.currentEditId = section.secID;

    this.sectionForm.patchValue({
      sectionName: section.sectionName,
    });

    this.showCancelSectEdit(true);
  }

  cancelEdit() {
    this.isEditMode = false;
    this.currentEditId = null;
    this.departmentForm.reset();
    this.sectionForm.reset();

    this.showCancelDeptEdit(false);
    this.showCancelSectEdit(false);
  }

  showCancelDeptEdit(display: boolean) {
    const cancelDeptEdit = document.getElementById('cancelDeptEdit')!;
    display ? cancelDeptEdit.classList.remove("d-none") : cancelDeptEdit.classList.add("d-none");
  }
  showCancelSectEdit(display: boolean) {
    const cancelSectEdit = document.getElementById('cancelSectEdit')!;
    display ? cancelSectEdit.classList.remove("d-none") : cancelSectEdit.classList.add("d-none");
  }


  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.companiestype = [];
    this.companyForm.reset();
    this.departmentForm.reset();
    this.sectionForm.reset();

    this.showCancelDeptEdit(false);
    this.showCancelSectEdit(false);

    this.closeModal(this.AddEditModal);
    this.closeModal(this.DeptAddEditModal);
    this.closeModal(this.SectAddEditModal);

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
        this.api.deleteCompany(id)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getCompanies();

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

  onDeleteDept(id: number, name: string) {
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
        this.api.deleteDepartment(id)
          .subscribe({
            next: (res) => {

              console.info("Dept Delete Success: ", res.message);
              this.getDepartmentsByCompanyID(this.company.branchID);


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

  onDeleteSect(id: number, name: string) {
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
        this.api.deleteSection(id)
          .subscribe({
            next: (res) => {

              console.info("Sect Delete Success: ", res.message);
              this.getDepartmentsByCompanyID(this.deparment.depID);


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


