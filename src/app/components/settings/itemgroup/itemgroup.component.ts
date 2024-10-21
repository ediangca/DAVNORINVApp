import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import * as bootstrap from 'bootstrap';
import { ApiService } from '../../../services/api.service';
import { GlobalComponent } from '../global/global.component';

@Component({
  selector: 'app-itemgroup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './itemgroup.component.html',
  styleUrl: './itemgroup.component.css'
})
export class ItemgroupComponent implements OnInit {
  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;

  public itemGroups: any = [];
  searchKey: string = '';


  public itemGroup: any;
  itemGroupForm!: FormGroup;
  isEditMode: boolean = false;
  currentEditId: number | null = null;



  constructor(private global: GlobalComponent, private fb: FormBuilder, private api: ApiService) {
    this.itemGroupForm = this.fb.group({
      itemGroupName: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }


  ngOnInit(): void {
    this.getAllItemGroups();
    this.setupModalClose();
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
      this.searchItemGroups();
    }
  }


  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchItemGroups();
    } else {
      this.searchItemGroups();
    }
  }

  searchItemGroups() {
    //Populate all Item Groups
    if (!this.searchKey) {
      this.getAllItemGroups();
    } else

      if (this.searchKey.trim()) {
        this.api.searchItemGroups(this.searchKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching Item Groups:", res);
              this.itemGroups = res;
            },
            error: (err: any) => {
              console.log("Error Fetching Item Groups:", err);
            }
          });
      }
  }


  getAllItemGroups() {
    //Populate all Item Groups
    this.api.getAllItemGroups()
      .subscribe({
        next: (res) => {
          this.itemGroups = res;

          const otherGroups = this.itemGroups.filter((group:any) => group.itemGroupName !== 'Others');
          const othersGroup = this.itemGroups.filter((group:any) => group.itemGroupName === 'Others');

          // Combine other groups first, then add "Others" at the end
          this.itemGroups = [...otherGroups, ...othersGroup];
        },
        error: (err: any) => {
          console.log("Error Fetching Item Groups:", err);
        }
      });
  }

  onSubmit() {
    // const now = new Date();

    if (this.itemGroupForm.valid) {
      console.log(this.itemGroupForm.value);

      const itemGroup = {
        "ItemGroupName": this.itemGroupForm.value['itemGroupName'],
        "Notes": this.itemGroupForm.value['notes'],
      }
      if (this.isEditMode && this.currentEditId) {
        this.Update(itemGroup)
      } else {
        this.Save(itemGroup);
      }

    }
    this.validateFormFields(this.itemGroupForm);



  }
  Update(itemGroup: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateItemGroup(this.currentEditId!, itemGroup)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              // this.closeModal()
              this.getAllItemGroups();

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

  Save(itemGroup: any) {
    this.api.createItemGroup(itemGroup)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          // this.closeModal()
          this.getAllItemGroups();

          Swal.fire({
            title: 'Saved!',
            text: res.message,
            icon: 'success'
          });
          this.itemGroupForm.reset();
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

  restoreData(itemGroup: any) {
    this.isEditMode = true;
    this.currentEditId = itemGroup.igid;

    console.log("Retreive Item Group: ", itemGroup);
    this.itemGroupForm.patchValue({
      itemGroupName: itemGroup.itemGroupName,
      notes: itemGroup.notes
    });

    this.openAddEditModal();

  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.itemGroupForm.reset();
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
        this.api.deleteItemGroup(id)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getAllItemGroups();

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
  // closeModal() {
  //   const modal = document.getElementById('AddModalForm')!;
  //   const modalInstance = bootstrap.Modal.getInstance(modal);
  //   if (modalInstance) {
  //     modalInstance.hide();
  //   } else {
  //     const newModalInstance = new bootstrap.Modal(modal);
  //     newModalInstance.hide();
  //   }

  //   const modal_backdrop = document.querySelector('.modal-backdrop')!;
  //   if (modal_backdrop) {
  //     modal_backdrop.classList.remove('show');
  //   }


  //   const backdrop = document.querySelectorAll('.modal-backdrop');
  //   backdrop.forEach(item => {
  //     const htmlElement = item as HTMLElement;
  //     htmlElement.classList.remove('show');
  //     htmlElement.classList.add('hide');
  //   });
  //   backdrop.forEach(item => {
  //     const htmlElement = item as HTMLElement;
  //     htmlElement.classList.remove('show');
  //     htmlElement.classList.add('hide');
  //   });
  //   backdrop.forEach(item => {
  //     const htmlElement = item as HTMLElement;
  //     htmlElement.classList.remove('show');
  //     htmlElement.classList.add('hide');
  //   });
  // }

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
