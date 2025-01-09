import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';

import Swal from 'sweetalert2';
import ValidateForm from '../../helpers/validateForm';
import { catchError, defaultIfEmpty, firstValueFrom, of } from 'rxjs';
import { StoreService } from '../../services/store.service';
import { LogsService } from '../../services/logs.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css'
})
export class ItemsComponent implements OnInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;

  public items: any = [];
  totalItems: number = 0;
  public item: any;
  itemForm!: FormGroup;

  public itemstype: string[] = [];
  itemGroups: any[] = [];

  searchKey: string = '';
  typeKey: string | null | undefined;

  iid: string | null | undefined;

  itemGroup: any | null | undefined;

  isEditMode: boolean = false;
  generatedId: string | null | undefined;
  currentEditId: string | null | undefined;

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  constructor(private fb: FormBuilder, private api: ApiService, 
    public vf: ValidateForm, private store: StoreService, private logger: LogsService) {

    this.ngOnInit();
  }


  ngOnInit(): void {
    this.resetForm();
    this.checkPrivileges();
    this.itemForm = this.fb.group({
      description: ['', Validators.required],
      type: ['', Validators.required]
    });


    this.itemForm.get('type')?.valueChanges.subscribe(selectedItem => {
      if (selectedItem) {
        this.api.retrieveItemGroup(selectedItem)
          .subscribe({
            next: (res) => {
              console.log("Selected itemGroupName : ", res);
              this.itemGroup = res;
              this.generateID(this.itemGroup.itemGroupName);
            },
            error: (err: any) => {
              console.log("Error Fetching Items: ", err);
            }
          });
      }
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('ITEMS', 'create');
    this.canRetrieve = this.store.isAllowedAction('ITEMS', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('ITEMS', 'update');
    this.canDelete = this.store.isAllowedAction('ITEMS', 'delete');
    this.canPost = this.store.isAllowedAction('ITEMS', 'post');
    this.canUnpost = this.store.isAllowedAction('ITEMS', 'unpost');
  }

  openAddEditModal() {
    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
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

  getItems() {
    //Populate all Items Groups
    this.api.getAllItems()
      .subscribe({
        next: (res) => {
          this.totalItems = res.length;
          this.items = res.slice(0,10);
        },
        error: (err: any) => {
          console.log("Error Fetching Items: ", err);
        }
      });
  }

  onKeyUp(event: KeyboardEvent): void {
    this.searchItems();
  }

  // Load UserGroup
  loadItemGroups(): void {
    this.api.getAllItemGroups().subscribe(
      data => {
        this.itemGroups = data;

        const otherGroups = this.itemGroups.filter((group: any) => group.itemGroupName !== 'Others');
        const othersGroup = this.itemGroups.filter((group: any) => group.itemGroupName === 'Others');

        // Combine other groups first, then add "Others" at the end
        this.itemGroups = [...otherGroups, ...othersGroup];
      },
      err => {
        console.error('Error: loading items groups => ', err);
      }
    );
  }

  searchItems() {
    //Populate all Item Groups
    if (!this.searchKey) {
      this.getItems();
    } else

      if (this.searchKey.trim()) {
        this.api.searchItem(this.searchKey)
          .subscribe({
            next: (res) => {
              console.log("Fetching Items: ", res);
              this.items = res;
            },
            error: (err: any) => {
              console.log("Error Fetching Items: ", err);
            }
          });
      }
  }

  restoreData(item: any) {
    this.isEditMode = true;
    this.item = item;
    this.currentEditId = item.iid;

    this.itemForm.patchValue({
      description: item.description,
      type: item.igid
    });

    this.openAddEditModal();
  }

  onDelete(id: string, name: string) {
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
        this.api.deleteItem(id)
          .subscribe({
            next: (res) => {
              console.info("Success: ", res.message);

              this.getItems();

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

  generateID(itemGroupName: string) {
    console.log("Selected itemGroupName : ", itemGroupName);

    this.api.getGenID(itemGroupName)
      .subscribe({
        next: (res) => {
          console.log("Generated ID : ", res);
          this.generatedId = res.id;
        },
        error: (err: any) => {
          console.log("Error Fetching Generating ID: ", err);
        }
      });
  }


  onSubmit() {
    if (this.itemForm.valid) {

      const item = {
        iid: this.isEditMode ? this.currentEditId : this.generatedId,
        igid: this.itemForm.value['type'],
        description: this.itemForm.value['description'],
      };

      if (this.isEditMode) {
        this.Update(item); // Wait for the update to complete
      } else {
        this.Save(item); // Wait for the save to complete
      }
    }

    this.vf.validateFormFields(this.itemForm);
  }


  Save(item: any) {
    this.api.createItem(item)
      .subscribe({
        next: (res) => {
          console.info("Success: ", res.message);

          this.getItems();
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

  Update(item: any) {

    Swal.fire({
      title: 'Edit?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateItem(this.currentEditId!, item)
          .subscribe({
            next: (res) => {
              // console.info("Success: ", res.message);

              // this.closeModal()
              this.getItems();
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

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.itemstype = [];
    this.itemForm.reset(
      {
        type: ''
      });


    this.closeModal(this.AddEditModal);
    this.getItems();
    this.loadItemGroups();
  }

  
  isAllowedAction(moduleName: string, action: string): boolean {
    return this.store.isAllowedAction(moduleName, action);
  }





}
