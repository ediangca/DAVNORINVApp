import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxScannerQrcodeModule, LOAD_WASM, ScannerQRCodeConfig, ScannerQRCodeResult, NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';

import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { LogsService } from '../../services/logs.service';
import { StoreService } from '../../services/store.service';
import { Item } from '../../models/Item';
import ValidateForm from '../../helpers/validateForm';
import { AuthService } from '../../services/auth.service';

import { PrintService } from '../../services/print.service';
import { delay, finalize, forkJoin, map, Observable } from 'rxjs';
import { ICSItem } from '../../models/ICSItem';
import { ToastrService } from 'ngx-toastr';


// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-itr',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './itr.component.html',
  styleUrl: './itr.component.css'
})
export class ItrComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('ListItemModalForm') ListItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;
  @ViewChild('TransferModalForm') TransferModalForm!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  itrs: any = [];
  totalItems: number = 0;
  itr!: any;
  itrItems: ICSItem[] = [];
  selectedITRItems: ICSItem[] = []; // Array to track selected items from ITR

  icsItems: ICSItem[] = [];
  userProfiles: any = [];
  items: any = [];
  searchKey: string = '';
  parItemKey: string = '';

  activeInput: 'received' | 'issued' | 'approved' | null = null;
  receivedByID: string | null = null;
  issuedByID: string | null = null;
  approvedByID: string | null = null;

  receivedID: string | null = null;
  issuedID: string | null = null;
  approvedID: string | null = null;
  receivedBy: string = '';
  issuedBy: string = '';
  approvedBy: string = '';

  errorMessage: string = '';

  brands: any[] = [];
  models: any[] = [];
  descriptions: any[] = [];

  item: ICSItem | null | undefined;
  itemName: string | null | undefined
  userAccount: any;
  userProfile: any;
  icsForm!: FormGroup;
  itemForm!: FormGroup;
  isEditMode: boolean = false;
  isEditItemMode: boolean = false;
  currentEditId: string | null = null;

  generatedITRNo: string | null | undefined;
  noOfParItems: number = 0;

  icsItemNo: number | null = null;

  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isITR: boolean = false;
  itrForm!: FormGroup;
  searchITRItems: ICSItem[] = [];

  isNewItem: boolean = false;
  accID: string = "unknown";
  IIDKey: string | null = null;
  iid: string | null = null;
  brand: string = '';
  model: string = '';

  isLoading: boolean = true;
  onItemFound: boolean = false;

  isOpen = false;

  today: string | undefined;

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  fn: string = 'start';

  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth
      },
    },
  };
  qrCode = ''

  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private vf: ValidateForm,
    private auth: AuthService, private cdr: ChangeDetectorRef,
    private printService: PrintService, private logger: LogsService,
    private toastr: ToastrService
  ) {
    this.ngOnInit();
  }

  ngOnInit(): void {

    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.getUserAccount();
    this.checkPrivileges();
    this.today = new Date().toISOString().split('T')[0];

    this.icsForm = this.fb.group({
      lgu: ['', Validators.required],
      fund: ['', Validators.required],
      icsNo: ['', Validators.required],
      type: ['', Validators.required],
      others: ['', Validators.required],
      reason: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
    });

    this.itrForm = this.fb.group({
      searchPARItemKey: [''],
      type: ['', Validators.required],
      others: ['', Validators.required],
      reason: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
    });

    this.itemForm = this.fb.group({
      iid: ['', Validators.required],
      qrCode: ['', Validators.required],
      description: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      serialNo: ['', Validators.required],
      propertyNo: ['', Validators.required],
      unit: ['', Validators.required],
      amount: ['', Validators.required],
      date_Acquired: [this.today, Validators.required],
    });

    this.getAllUserProfile();
    this.setupModalClose();
    // Check if action is defined and has the isReady property
    if (this.scannerAction && this.scannerAction.isReady) {
      this.scannerAction.isReady.subscribe((res: any) => {
        // Perform your actions when isReady emits a value
        // this.handle(this.action, 'start');
        console.log('Scanner is ready:', res);
      });
    } else {
      console.info('Action or isReady is not defined when ngOnInit is called.');
    }
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('ITR', 'create');
    this.canRetrieve = this.store.isAllowedAction('ITR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('ITR', 'update');
    this.canDelete = this.store.isAllowedAction('ITR', 'delete');
    this.canPost = this.store.isAllowedAction('ITR', 'post');
    this.canUnpost = this.store.isAllowedAction('ITR', 'unpost');
  }

  setupModalClose() {

    this.addModalHiddenListener(true, 'AddEditModalForm');
    this.addModalHiddenListener(true, 'ViewModalForm');
    this.addModalHiddenListener(false, 'ItemModalForm');
    this.addModalHiddenListener(false, 'ViewItemModalForm');

    const QRScannerModal = document.getElementById('QRScannerForm')!;
    if (QRScannerModal) {

      QRScannerModal.addEventListener('hidden.bs.modal', () => {
        this.resetQRScanForm(this.scannerAction, this.fn);

      });
    }
  }
  addModalHiddenListener(parModal: boolean, modalId: string) {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('hidden.bs.modal', () =>
      parModal && !this.isEditMode ? this.resetForm() : this.resetItemForm());
  }

  openModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    }
  }

  // openPARModal(modalElement: ElementRef) {
  //   if (modalElement) {
  //     const modal = new bootstrap.Modal(modalElement.nativeElement);
  //     modal.show();
  //   }
  // }

  // openItemModal(modalElement: ElementRef) {
  //   if (modalElement) {
  //     const modal = new bootstrap.Modal(modalElement.nativeElement);
  //     modal.show();
  //   }
  // }

  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }

  toggleAccordion() {
    this.isOpen = !this.isOpen; // Toggle the accordion state
    // setTimeout(() => {
    //   this.isOpen = !this.isOpen; // Toggle the accordion state
    // }, 3000); // Simulate a 2-second delay
  }

  getUserAccount() {
    this.store.getUserAccount()
      .subscribe({
        next: (res) => {
          this.userAccount = res;
          this.getAllITR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllITR() {
    this.isLoading = true; // Start spinner
    this.api.getAllITR()
      .pipe(
        delay(3000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show ITRs only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated ITRs', res);
          this.totalItems = res.length;
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 20); // For administrators, show all records, limited to 10
          }
          const filteredITRs = res.filter((itr: any) =>
            itr.createdBy === this.userAccount.userID ||
            itr.issuedBy === this.userAccount.userID ||
            itr.receivedBy === this.userAccount.userID ||
            itr.approvedBy === this.userAccount.userID
          );
          this.totalItems = filteredITRs.length;
          return filteredITRs.slice(0, 20); // Limit to the first 10 items
        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filteredITRs) => {
          this.itrs = filteredITRs;
          this.logger.printLogs('i', 'List of ITRs', this.itrs);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching ITRs', err);
        }
      });
  }

  onSearchITR() {
    if (!this.searchKey) {
      this.getAllITR(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchITR(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter or process the response if needed
              this.logger.printLogs('i', 'Show ITRs only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated ITRs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 20); // For administrators, show all records, limited to 10
              }
              const filteredITRs = res.filter((itr: any) =>
                itr.createdBy === this.userAccount.userID ||
                itr.issuedBy === this.userAccount.userID ||
                itr.receivedBy === this.userAccount.userID ||
                itr.approvedBy === this.userAccount.userID
              );
              return filteredITRs.slice(0, 20); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filteredITRs) => {
              this.itrs = filteredITRs; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH ITRs', this.itrs);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching ITRs on Search', err);
            }
          });
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearchITR();
    } else {
      this.onSearchITR();
    }
  }

  getAllUserProfile() {
    this.api.getAllProfile()
      .subscribe({
        next: (res) => {
          this.userProfiles = res;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Profiles', err);
        }
      });
  }

  getAllItems() {
    //Populate all User Profile
    this.api.getAllItems()
      .subscribe({
        next: (res) => {
          this.items = res;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Items', err);
        }
      });
  }

  onAutoSuggest(): void {
    this.iid = null;
    this.searchItem();
  }

  searchPARItem() {
    this.parItemKey = this.itrForm.value['searchPARItemKey'];
    console.log(this.parItemKey);

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.itrItems = [...this.searchITRItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.itrItems = this.searchITRItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
        item.icsNo!.toLowerCase().includes(searchKey) ||
        item.itrNo!.toLowerCase().includes(searchKey)
      );
    }
  }



  searchItem() {
    //Populate all Item
    if (!this.IIDKey) {
      this.getAllItems();
    } else {
      if (this.IIDKey.trim()) {
        this.api.searchItem(this.IIDKey)
          .subscribe({
            next: (res) => {
              if (res.length == 1 && res[0].description == this.IIDKey) {
                this.selectItem(res[0]);
                this.logger.printLogs('i', 'Fetch Specific Item', res[0]);
              } else {
                this.items = res;
                this.items = this.items.slice(0, 3)
                this.logger.printLogs('i', 'Fetching Items', res);
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Items', err);
            }
          });
      }
    }
    this.updateDescription();
  }

  selectItem(item: Item): void {
    this.IIDKey = item.description ? item.description : null;  // Display the selected item's description in the input field
    this.iid = item.iid ? item.iid : null;

    this.itemForm.patchValue({
      iid: item.description  // Patch the selected IID to the form
    });

    this.items = [];  // Clear the suggestion list after selection
    this.updateDescription();

  }

  updateDescription() {

    // this.IIDKey = this.itemForm.value['iid'];

    this.logger.printLogs('i', 'PAR ITEMS DESCRIPTION', [(!(this.IIDKey == '') ? this.IIDKey : '') + " " + (!(this.brand == '') ? this.brand : '') + " " + (!(this.model == '') ? this.model : '')]);

    this.itemForm.patchValue({
      description: (!(this.IIDKey == '') ? this.IIDKey : '') + " " + (!(this.brand == '') ? this.brand : '') + " " + (!(this.model == '') ? this.model : '')
    });
  }


  onAutoSuggestProfileBy(event: KeyboardEvent) {
    const key = (event.target as HTMLInputElement).value;
    this.api.searchProfile(key)
      .subscribe({
        next: (res) => {
          this.userProfiles = res;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Profiles:', err);
        }
      });
  }


  onAutoSuggestReceived() {
    this.receivedID = null;
    if (!this.receivedByID) {
      // this.getAllUserProfile();//Populate all userProfiles
      this.userProfiles = [];
    } else {
      this.activeInput = 'received';
      if (this.receivedByID.trim()) {
        this.api.searchProfile(this.receivedByID)
          .subscribe({
            next: (res) => {
              if (res.length == 1 && res[0].fullName == this.receivedByID) {
                this.selectReceived(res[0]);
                this.logger.printLogs('i', 'Fetch Specific Received By', res[0]);
              } else {
                this.userProfiles = res;
                this.userProfiles = this.userProfiles.slice(0, 5)
                this.logger.printLogs('i', 'Fetching Received By', res);
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Received By', err);
            }
          });
      }
    }
  }

  selectReceived(userProfile: any): void {

    this.receivedID = userProfile.userID;
    this.logger.printLogs('i', 'Selected to Received', userProfile);

    if (this.icsForm!) {
      this.icsForm.patchValue({
        userID1: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    if (this.itrForm!) {
      this.itrForm.patchValue({
        userID1: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  onAutoSuggestApproved() {
    if (!this.approvedByID) {
      // this.getAllUserProfile();//Populate all userProfiles
      this.userProfiles = [];
    } else {
      this.activeInput = 'approved';
      if (this.approvedByID.trim()) {
        this.api.searchProfile(this.approvedByID)
          .subscribe({
            next: (res) => {
              if (res.length == 1 && res[0].fullName == this.approvedByID) {
                this.selectReceived(res[0]);
                this.logger.printLogs('i', 'Fetch Specific Approved By', res[0]);
              } else {
                this.userProfiles = res;
                this.userProfiles = this.userProfiles.slice(0, 5)
                this.logger.printLogs('i', 'Fetching Approved By', res);
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Approved By', err);
            }
          });
      }
    }
  }

  selectApproved(userProfile: any): void {

    this.approvedID = userProfile.userID;
    this.logger.printLogs('i', 'Selected to Approved', userProfile);

    this.itrForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }


  onAddITRItem() {

    this.api.getAllICSItems()
      .subscribe({
        next: (res) => {
          this.icsItems = res;

          this.icsItems = this.icsItems.filter(
            item => !this.itrItems.some(itrItem => itrItem.icsItemNo === item.icsItemNo) &&
              item.itrFlag === false
          );
          this.logger.printLogs('i', 'LIST OF ICS ITEM', this.icsItems);

          this.icsItems.length < 1 ? Swal.fire('Information', 'No Items can be transfer.', 'info') : this.openModal(this.ListItemModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Groups', err);
        }
      });

  }

  // ADD ICS ITEM
  onAddItem(item: ICSItem) {
    this.logger.printLogs('i', 'ADD ICS ITEMS', this.itrItems);

    Swal.fire({
      title: 'Confirm',
      text: 'Do you want to ITR the selected Item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then(result => {
      if (result.isConfirmed) {
        item.itrFlag = true;
        item.itrNo = this.itr.itrNo;
        this.itrItems.push(item);

        this.logger.printLogs('i', 'TO UPDATE ITR ITEMS', this.itrItems);

        this.logger.printLogs('i', 'UPDATED ICS ITEMS', this.icsItems);


        this.icsItems = this.icsItems.filter(item => item.itrFlag === false);

        this.icsItems.length < 1 ? this.closeModal(this.ListItemModal) : '';
      }
    });

  }

  onSubmit() {

    if (!this.icsForm.valid) {
      this.vf.validateFormFields(this.icsForm);
      return;
    }

    if (this.itrItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.itr.itrNo;

    if (this.icsForm.valid && this.itrItems.length > 0) {

      this.logger.printLogs('i', 'ITR Form', this.icsForm.value);

      this.itr = {
        itrNo: this.currentEditId,
        icsNo: this.icsForm.value['icsNo'],
        ttype: this.icsForm.value['type'],
        otype: this.icsForm.value['others'],
        reason: this.icsForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedID,
        approvedBy: this.approvedID,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }


      if (this.isEditMode) {
        this.Update(this.itr)
      } else {
        this.Save(this.itr);
      }

    }

  }



  onSubmitITR() {

    if (!this.itrForm.valid) {
      this.vf.validateFormFields(this.itrForm);
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      return;
    }

    if (this.icsItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.itr.itrNo;

    const reitr = {
      itrNo: this.currentEditId,
      icsNo: this.itr.icsNo,
      ttype: this.itrForm.value['type'],
      otype: this.itrForm.value['others'],
      reason: this.itrForm.value['reason'],
      receivedBy: this.receivedID,
      issuedBy: this.issuedID,
      approvedBy: this.approvedID,
      createdBy: this.userAccount.userID,
    }


    if (this.icsItems.length > 0) {

      this.logger.printLogs('i', 'ITR Form', this.itrForm);

      this.logger.printLogs('i', 'Saving RE-ITR', reitr);
      this.api.createREITR(reitr, this.icsItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'RE-ITR Saved Success', res.details);
            Swal.fire('Saved!!', res.message, 'success');


            this.closeModal(this.TransferModalForm);
            this.getAllITR();
            this.resetForm();

          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving ITR', err);
            Swal.fire('Denied', err, 'warning');
          }
        });

    }


  }

  toast(title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const options = {
      enableHtml: true,
      progressBar: true,
      timeOut: 2000,
      closeButton: true,
    };
    this.toastr[type](msg, title, options);
  }

  Save(itr: any) {
    if (!this.isITR) {
      this.logger.printLogs('i', 'Saving ITR', itr);
      this.api.createITR(itr, this.itrItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', itr);
            Swal.fire('Saved', res.message, 'success');
            this.toast('Saved!', res.message, 'success');
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving itr', err);
            Swal.fire('Saving Denied', err, 'warning');
            this.toast('Saving Denied!', err, 'warning');
          }
        });
    } else {


      this.itr = {
        itrNo: itr.itrNo,
        icsNo: itr.icsNo,
        receivedBy: this.itrForm.value['userID1'],
        issuedBy: itr.receivedBy,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      Swal.fire({
        title: 'Confirmation',
        text: 'Do you want to ITR Selected Item(s)?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          this.logger.printLogs('i', 'Saving ITR', this.itr);

          this.api.createITR(this.itr, this.selectedITRItems)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Saved Success', res);
                this.logger.printLogs('i', 'Saved Success', res.details);
                Swal.fire('Saved', res.message, 'success');
                this.toast('Saved!', res.message, 'success');

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving ITR', err);
                Swal.fire('Denied', err, 'warning');
                this.toast('Denied!', err, 'warning');
              }
            });
        }
      });

    }
  }

  Update(itr: any) {
    this.logger.printLogs('i', 'Updating ITR', itr);

    this.api.updateITR(this.itr, this.itrItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', res);
          Swal.fire('Updated!', res.message, 'success');
          this.toast('Updated!', res.message, 'success');
          this.logger.printLogs('i', 'Update Success', res.details);
          this.getAllITR();
          this.closeModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating ITR', err);
          Swal.fire('Updating Denied', err, 'warning');
          this.toast('Updating Denied!', err, 'warning');
        }
      });

  }

  onPostITR(itr: any) {

    if (!itr.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (itr.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !itr.postFlag) || this.roleNoFromToken == 'System Administrator' || (itr.postFlag && this.canUnpost) || (!itr.postFlag && this.canPost)) {
      let itrNo = itr.itrNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (itr.postFlag ? 'Unpost' : 'Post') + ` ITR #${itrNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postITR(itrNo, !itr.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllITR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.toast('Success!', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving ITR Item!']);
                Swal.fire('Denied!', err, 'warning');
                this.toast('Denied!', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditITR(itr: any) {

    let isViewNotVisible: boolean = false;

    const modalElement = this.ViewModal.nativeElement;
    const modalInstance = bootstrap.Modal.getInstance(modalElement);

    if (itr.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted ITR.', 'warning');
      return;
    }
    if (this.ViewModal) {
      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
        isViewNotVisible = true;
      } else {
        isViewNotVisible = true;
      }
    } else {
      isViewNotVisible = true;
    }

    setTimeout(() => {

      if (isViewNotVisible) {
        this.isEditMode = true;
        this.itr = itr;
        this.currentEditId = itr.itrNo;
        this.isCustomType = itr.ttype == 'Others';

        this.issuedID = itr.issuedBy
        this.approvedID = itr.approvedBy
        this.receivedID = itr.receivedBy


        this.logger.printLogs('i', 'Restoring ITR', itr);

        this.icsForm.patchValue({
          lgu: itr.entityName,
          fund: itr.fund,
          icsNo: itr.icsNo,
          type: itr.ttype,
          others: itr.otype,
          reason: itr.reason,
          userID1: itr.received,
          userID2: itr.issued,
          userID3: itr.approved,
        });


        // Now handle the disabled state separately
        // if (this.isEditMode) {
        //   this.icsForm.get('userID2')?.disable(); // Disable the control if needed
        // }

        this.api.retrieveICSItemByITRNo(this.currentEditId!)
          .subscribe({
            next: (res) => {
              this.logger.printLogs('i', 'Retrieving ITR Item', res);
              this.itrItems = res;
              this.openModal(this.AddEditModal);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Retreiving ITR Item', err);
              Swal.fire('Warning', err, 'error');
            }
          });

      }
    }, 1000);

  }


  onViewITR(itr: any) {
    this.itr = itr;
    this.currentEditId = itr.itrNo;
    this.isCustomType = itr.ttype == 'Others';

    this.logger.printLogs('i', 'Viewing ITR', itr);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.api.retrieveITR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ITR Item', res);
          this.itr = res.details;
          this.itrItems = res.itrItems;
          this.searchITRItems = this.itrItems;

          this.openModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ITR Item', err);
          Swal.fire('Error', 'Failure to Retrieve ITR Item.', 'error');
        }
      });


  }

  onTransfer(itr: any) {
    if (!itr.postFlag) {
      Swal.fire('Information!', 'Cannot Re-Transfer unposted ITR.', 'warning');
      return;
    }
    this.isEditMode = false;
    this.isITR = true;
    this.itr = itr;
    this.currentEditId = itr.itrNo;
    this.logger.printLogs('i', 'Restoring ITR', itr);

    this.issuedID = itr.receivedBy;
    this.approvedID = itr.approvedBy;


    this.itrForm.patchValue({
      userID2: itr.received, //Issued By
      userID1: '', //Received BY
      userID3: itr.approved, //Approved BY
      type: '',
      searchPARItemKey: [''],
    });

    this.api.retrieveICSItemByITRNo(this.itr.itrNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS Item', res);
          this.icsItems = res;
          this.searchITRItems = this.icsItems;

          this.noOfParItems = this.icsItems.filter((group: any) => group.itrFlag === false).length;
          this.logger.printLogs('i', 'Number of ICS Item Retrieved', this.noOfParItems);

          this.openModal(this.TransferModalForm); // Open the modal after patching
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
          Swal.fire('Error', 'Failure to Retrieve ICS Item.', 'error');
        }
      });


  }


  onDelete(par: any) {

    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted ITR.', 'warning');
      return;
    }

    let itrNo = par.itrNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove ITR #' + itrNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteITR(itrNo)
          .subscribe({
            next: (res) => {
              this.getAllITR();
              Swal.fire('Success', res.message, 'success');
              this.toast('Success!', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting ITR', err);
              Swal.fire('Denied', err, 'warning');
              this.toast('Denied!', err, 'warning');
            }
          });
      }
    });

  }

  isExist(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.api.scanUniquePARItem(key!)
        .subscribe({
          next: (res) => {
            res.length > 0 ? resolve(true) : resolve(false);
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error', err);
            Swal.fire('Denied', err, 'warning');
            resolve(true); // Consider an item as existing in case of error.
          }
        });
    });
  }

  isExistOnUpdate(parINo: number | null, key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.api.scanExistingUniquePARItem(parINo!, key!)
        .subscribe({
          next: (res) => {
            res.length > 0 ? resolve(true) : resolve(false);
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error', err);
            Swal.fire('Denied', err, 'warning');
            resolve(true); // Consider an item as existing in case of error.
          }
        });
    });
  }


  isItemFound(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.api.retrieveItem(this.iid!)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Item Found', res);
            resolve(true);
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Retreiving Item', err);
            Swal.fire('Denied', err, 'warning');
            resolve(false); // Consider an item as existing in case of error.
          }
        });
    });
  }


  onViewItem(item: ICSItem) {
    this.item = item;
    this.icsItemNo = item.icsItemNo;

    this.logger.printLogs('i', 'View Item', [item]);

    this.api.retrieveItem(item.iid!)
      .subscribe({
        next: (res) => {

          this.logger.printLogs('i', 'Retreived Item', res);
          this.iid = item.iid!;

          this.itemName = res.description;

          if (item.itrFlag) {
            this.api.retrieveITR(item.itrNo!)
              .subscribe({
                next: (res) => {
                  this.itr = res.details;
                  this.logger.printLogs('i', 'Retreived ITR No: ' + item.itrNo!, res.details);
                  this.openModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving ITR', err);
                  Swal.fire('Denied', err, 'warning');
                }
              });
          } else {
            this.openModal(this.ViewItemModal)
          }

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving Item', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  // Helper function to format the date
  public formatDate(date: Date | string | null): string | null {
    if (!date) return null;

    // If the date is a string, convert it to a Date object
    if (typeof date === 'string') {
      date = new Date(date);
    }

    // Ensure it's a valid Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      // Handle invalid date
      this.logger.printLogs('w', 'Invalid Date Format', [date]);
      return null;
    }
  }

  onDeleteItem(item: ICSItem) {
    this.item = item;

    let description = item.description;

    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove Property #' + description,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        // Execute delete Item where propertyNo matches to list
        if (description) {
          this.itrItems = this.itrItems.filter(items => items.propertyNo !== item.propertyNo);
          Swal.fire('Deleted!', 'Item has been removed.', 'success');
        } else {
          Swal.fire('Information!', 'Invalid Item.', 'warning');
        }
      }
    });

  }

  toggleSelection(item: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    const index = this.selectedITRItems.indexOf(item);

    if (isChecked && index === -1) {
      // If checked and item is not in the list, add it
      this.selectedITRItems.push(item);
    } else if (!isChecked && index > -1) {
      // If unchecked and item is in the list, remove it
      this.selectedITRItems.splice(index, 1);
    }
    this.displaySelectedItems();
  }

  // Optional function to get the currently selected items
  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected PAR Items', this.selectedITRItems!);
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

  resetForm() {
    this.isEditMode = false;
    this.currentEditId = null;
    this.isModalOpen = false;
    this.isITR = false;
    this.item = null;
    this.isOpen = false;
    this.isCustomType = false;
    this.icsForm.reset({
      userID1: '',
      userID2: '',
      userID3: ''
    });
    this.itrForm.reset({
      userID1: '',
      userID2: ''
    });
    this.itrItems = [];
    this.selectedITRItems = [];
    this.parItemKey = '';
    this.searchKey = '';
  }

  resetItemForm() {
    this.isEditItemMode = false;
    this.isModalOpen = false;
    this.itemForm.reset({
      iid: '',
      qrCode: '',
      description: '',
      brand: '',
      model: '',
      serialNo: '',
      propertyNo: '',
      unit: '',
      amount: '',
      date_Acquired: this.today,
    });
    // Clear related data
    this.IIDKey = null;
    this.iid = null;
    // this.item = null;
    this.items = [];
    this.brands = [];
    this.models = [];
    this.descriptions = [];
  }

  onTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue == 'Others';
    if (!this.isCustomType) {
      this.itrForm.get('type')?.setValue(selectedValue);
      this.itrForm?.get('others')?.setValue('N/A');
      this.icsForm?.get('others')?.setValue('N/A');
    } else {
      this.itrForm?.get('others')?.setValue(null);
      this.icsForm?.get('others')?.setValue(null);
      // Wait for Angular to render the input field before focusing
      this.itrForm.get('type')?.markAsUntouched();
      this.itrForm.get('others')?.markAsTouched();
    }
  }

  onCloseQRScanning(scannerAction: any) {
    // Close the modal
    this.closeModal(this.QRScannerModal!);
    this.fn = 'stop';
    scannerAction.stop();
    scannerAction.isStart = false;
    scannerAction.isLoading = false;

  }
  resumeScanning(scannerAction: any): void {
    // Add any conditions or user prompts if needed before resuming

    scannerAction.play().subscribe(
      (r: any) => console.log('Resuming Scan:', r),
      (error: any) => console.error('Error while resuming scan:', error)
    );
  }

  // Function to display the QR Scanner modal
  onScanQR() {
    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();
  }

  onResumeScanning(scannerAction: any): void {
    // Add any conditions or user prompts if needed before resuming

    scannerAction.play().subscribe(
      (r: any) => console.log('Resuming Scan:', r),
      (error: any) => console.error('Error while resuming scan:', error)
    );
  }

  // Reset and stop/start QR scanning
  resetQRScanForm(action: any, fn: string) {
    this.onCloseQRScanning(this.scannerAction)
  }

  // Handle start/stop of QR scanning
  public handle(scannerAction: any, fn: string): void {
    this.scannerAction = scannerAction;
    this.fn = fn;
    this.onScanQR(); // Show the scanner modal

    // Function to select a device, preferring the back camera
    const playDeviceFacingBack = (devices: any[]) => {
      const device = devices.find(f => /back|rear|environment/gi.test(f.label));
      scannerAction.playDevice(device ? device.deviceId : devices[0].deviceId);
    };

    // Start or stop the scanning action
    if (fn === 'start') {
      scannerAction[fn](playDeviceFacingBack).subscribe(
        (r: any) => console.log(fn, r),
        alert
      );
      this.cdr.detectChanges();     // Trigger change detection to update button state
    } else {
      scannerAction[fn]().subscribe((r: any) => console.log(fn, r), alert);
      this.cdr.detectChanges();     // Trigger change detection to update button state
    }
  }

  // Event handler when QR code is scanned
  public onEvent(results: ScannerQRCodeResult[], action?: any): void {
    this.onItemFound = false;
    if (results && results.length) {
      if (results) {
        action.pause(); // Pause scanning if needed

        console.log('QR value', results[0].value);
        console.log('Scanned Data:', results); // Handle scanned results here

        this.qrCode = results[0].value
        this.validateQR(this.qrCode)

      }

    }
  }

  onEnter(): void {
    console.log('Enter key pressed. QR Value:', this.qrCode);

    // Add your logic here
    if (this.qrCode.trim() !== '') {
      // Example: Perform a search action
      console.log('Performing search for:', this.qrCode);
      this.validateQR(this.qrCode)
    }
  }

  validateQR(qr: string): void {
    this.qrCode = ''
    this.api.retrieveicsITEMByQRCode(qr)
      .subscribe({
        next: (res) => {
          console.log('Retrieve ICS ITEMS', res);
          this.item = res[0];

          console.log('Show Items', this.item);

          this.onRetrieveITR(res[0].itrNo);

        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving ITR', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found in ITR`, 'info');
        }
      });

  }

  onRetrieveITR(itrNo: string) {
    this.api.retrieveITR(itrNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PTR', res);
          this.itr = res.details;

          Swal.fire({
            title: 'Item Found from ITR #' + itrNo,
            text: 'Do you want to view the ITR Details?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewITR(this.itr);
            } else {
              this.onResumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving ITR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  onPrintITR(itrNo: string) {

    this.api.retrieveITR(itrNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ITR AND ITEMS', res);
          const itr = res.details;
          const itrItems = res.itrItems;
          this.searchITRItems = this.itrItems;

          this.printService.setModel(itr);

          // Ensure ics.itrItems is an array or default to an empty array
          const items = Array.isArray(itrItems) ? itrItems : [];
          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy)
          ] as Observable<any>[]).subscribe(() => {
            // Once both services complete, continue with the report generation

            const items = Array.isArray(itrItems) ? itrItems : [];


            const rows = items.map((item: any, index: number) => `
            <tr ${item.qrCode ? `class="${item.qrCode}"` : ''}>
              <td style="font-size: small;">${item.qty || '1'}</td>
              <td style="font-size: small;">${item.unit || 'pcs'}</td>
              <td style="font-size: small;">
              ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
                    <td style="font-size: small;">${((item?.qty || 0) * (item?.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="font-size: small;">${item.description || 'N/A'}</td>
              <td style="font-size: small;">${index + 1 || item.icsNo || item.icsItemNo || item.iid || 'N/A'}</td>
              <td style="font-size: small;">${item.eul + ' year(s)' || 'N/A'}</td>
            </tr>
          `).join('');



            // Generate the full report content
            const reportContent = `

          <div class="watermark">ITR</div>

          <div class="row">
            <div class="col-12 ">
              <p class="fs-6">LGU: <span class="fw-bold border-bottom ms-1">${itr.entityName || 'N/A'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">FUND: <span class="fw-bold border-bottom ms-1">${itr.fund || 'N/A'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6 text-end">PTR No.: <span class="fw-bold border-bottom ms-1">${itr.itrNo || 'N/A'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">TRANSFER TYPE: <span class="fw-bold border-bottom ms-1">
              ${(((itr.ttype + '').toString().toLowerCase() == "others") ? itr.ttype + ' - ' + itr.otype : itr.ttype) || 'N/A'}
              </span></p>
            </div>
            <div class="col-6">
              <p class="fs-6 text-end">Date No.: <span class="fw-bold border-bottom ms-1">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            </div>
          </div>

          <!-- Table with List of Items -->
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th class="text-center align-middle" style="font-size: small;" rowspan="2">QTY</th>
                        <th class="text-center align-middle" style="font-size: small;" rowspan="2">UNIT</th>
                        <th class="text-center align-middle" style="font-size: small;" colspan="2" >Amount</th>
                        <th class="text-center align-middle" style="font-size: small; "rowspan="2">DESCRIPTION</th>
                        <th class="text-center align-middle" style="font-size: small; "rowspan="2">ICS NO</th>
                        <th class="text-center align-middle" style="font-size: small; "rowspan="2">ESTIMATED USEFUL LIFE</th>
                    </tr>

                    <tr>
                      <th class="text-center" style="font-size: small;">Unit Cost</th>
                      <th class="text-center" style="font-size: small;">Total Cost</th>
                    </tr>

                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>`;

            // Print the report
            this.printService.printReport('ITR', reportContent);

          });
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving RE-PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve RE-PAR Item.', 'error');
          return;
        }
      });



  }


}

