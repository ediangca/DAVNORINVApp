import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';


import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { ApiService } from '../../../services/api.service';
import { GlobalComponent } from '../global/global.component';
import { StoreService } from '../../../services/store.service';
import { LogsService } from '../../../services/logs.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.css'
})
export class PositionsComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;

  public positions: any = [];
  totalItems: number = 0;
  searchKey: string = '';

  public position: any;
  positionForm!: FormGroup;
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

  ngOnInit(): void {
    this.checkPrivileges();
    this.positionForm = this.fb.group({
      positionName: ['', Validators.required],
    });
    this.getAllPositions();
    this.setupModalClose();
  }

  ngAfterViewInit(): void {

    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('POSITION', 'create');
    this.canRetrieve = this.store.isAllowedAction('POSITION', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('POSITION', 'update');
    this.canDelete = this.store.isAllowedAction('POSITION', 'delete');
    this.canPost = this.store.isAllowedAction('POSITION', 'post');
    this.canUnpost = this.store.isAllowedAction('POSITION', 'unpost');
  }

  openAddEditModal() {
    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
    modal.show();
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


  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchPositions();
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchPositions();
    } else {
      this.searchPositions();
    }
  }

  searchPositions() {
    //Populate all User Groups
    if (!this.searchKey) {
      this.getAllPositions();
    } else

      if (this.searchKey.trim()) {
        this.api.searchPositions(this.searchKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching Positions:", res);
              this.positions = res;
            },
            error: (err: any) => {
              console.log("Error Fetching Positions:", err);
            }
          });
      }
  }

  getAllPositions() {
    //Populate all Positions
    this.api.getAllPositions()
      .subscribe({
        next: (res) => {
          this.totalItems = res.length;
          this.positions = res;
          this.logger.printLogs('i', 'LIST OF POSITIONS', this.positions);
        },
        error: (err: any) => {
          console.log("Error Fetching Positions:", err);
        }
      });
  }

  onSubmit() {
    // const now = new Date();

    if (this.positionForm.valid) {
      console.log(this.positionForm.value);




      const position = {
        "positionName": this.positionForm.value['positionName'],
      }

      if (this.isEditMode && this.currentEditId) {
        this.Update(position)
      } else {
        this.Save(position);
      }

    }
    this.validateFormFields(this.positionForm);



  }
  Update(position: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updatePosition(this.currentEditId!, position)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              // this.closeModal()
              this.getAllPositions();

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

  Save(position: any) {
    this.api.createPosition(position)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          // this.closeModal()
          this.getAllPositions();

          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
          this.positionForm.reset();
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

  restoreData(position: any) {
    this.isEditMode = true;
    this.currentEditId = position.positionID;

    console.log("Retreive Position: ", position);
    this.positionForm.patchValue({
      positionName: position.positionName
    });

    this.openAddEditModal();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.positionForm.reset();
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
        this.api.deletePosition(id)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getAllPositions();

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

  // Close the modal
  closeModal() {
    const modal = document.getElementById('AddModalForm')!;
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      const newModalInstance = new bootstrap.Modal(modal);
      newModalInstance.hide();
    }

    const modal_backdrop = document.querySelector('.modal-backdrop')!;
    if (modal_backdrop) {
      modal_backdrop.classList.remove('show');
    }


    const backdrop = document.querySelectorAll('.modal-backdrop');
    backdrop.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.classList.remove('show');
      htmlElement.classList.add('hide');
    });
    backdrop.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.classList.remove('show');
      htmlElement.classList.add('hide');
    });
    backdrop.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.classList.remove('show');
      htmlElement.classList.add('hide');
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
