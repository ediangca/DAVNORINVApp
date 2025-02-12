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


// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-repar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './repar.component.html',
  styleUrl: './repar.component.css'
})
export class ReparComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  ptrs: any = [];
  totalItems: number = 0;
  par!: any | null;
  parItems: Item[] = [];
  selectedParItems: Item[] = []; // Array to track selected items from repar
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

  item: Item | null | undefined;
  itemName: string | null | undefined
  userAccount: any;
  userProfile: any;
  parForm!: FormGroup;
  itemForm!: FormGroup;
  isEditMode: boolean = false;
  isEditItemMode: boolean = false;
  currentEditId: string | null = null;

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  parINo: number | null = null;
  propertyNo: string | null = null;

  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isRepar: boolean = false;
  reparForm!: FormGroup;
  repar: any | null | undefined;
  searchPARItems: Item[] = [];

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
    private printService: PrintService, private logger: LogsService
  ) {
    this.ngOnInit();
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  ngOnInit(): void {

    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.getUserAccount();
    this.checkPrivileges();
    this.today = new Date().toISOString().split('T')[0];

    this.parForm = this.fb.group({
      lgu: ['', Validators.required],
      fund: ['', Validators.required],
      parNo: ['', Validators.required],
      type: ['', Validators.required],
      others: ['', Validators.required],
      reason: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
    });

    this.reparForm = this.fb.group({
      searchPARItemKey: [''],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
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

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('PTR', 'create');
    this.canRetrieve = this.store.isAllowedAction('PTR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('PTR', 'update');
    this.canDelete = this.store.isAllowedAction('PTR', 'delete');
    this.canPost = this.store.isAllowedAction('PTR', 'post');
    this.canUnpost = this.store.isAllowedAction('PTR', 'unpost');
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

  openPARModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    }
  }

  openItemModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    }
  }

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
          this.getAllPTR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllPTR() {
    this.isLoading = true; // Start spinner
    this.api.getAllREPAR()
      .pipe(
        delay(3000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show PTRs only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated PTRs', res);
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 10); // For administrators, show all records, limited to 10
          }
          const filteredPTRs = res.filter((ptr: any) =>
            ptr.createdBy === this.userAccount.userID ||
            ptr.receivedBy === this.userAccount.userID
          );
          this.totalItems = filteredPTRs.length;
          return filteredPTRs.slice(0, 10); // Limit to the first 10 items
        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filteredPTRs) => {
          this.ptrs = filteredPTRs;
          this.logger.printLogs('i', 'List of PTRs', this.ptrs);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching PTRs', err);
        }
      });
  }

  onSearchPTR() {
    if (!this.searchKey) {
      this.getAllPTR(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchREPAR(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter results based on `createdBy` and slice for pagination
              this.logger.printLogs('i', 'Show PTRs only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated PTRs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 10); // For administrators, show all records, limited to 10
              }
              // Filter or process the response if needed
              const filteredPTRs = res.filter((ptr: any) =>
                ptr.issuedBy === this.userAccount.userID ||
                ptr.receivedBy === this.userAccount.userID
              );
              this.totalItems = filteredPTRs.length;
              return filteredPTRs.slice(0, 10); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filteredPTRs) => {
              this.ptrs = filteredPTRs; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH PTRs', this.ptrs);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching PTR on Search', err);
            }
          });
      }
    }
  }

  getAllUserProfile() {
    this.api.getAllProfile()
      .subscribe({
        next: (res) => {
          this.userProfiles = res;
          this.logger.printLogs('i', 'LIST OF USER PROFILES', this.userProfiles);
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
    this.parItemKey = this.reparForm.value['searchPARItemKey'];
    console.log(this.parItemKey);

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.parItems = [...this.searchPARItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.parItems = this.searchPARItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
        item.propertyNo!.toLowerCase().includes(searchKey) ||
        item.qrCode!.toLowerCase().includes(searchKey)
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



  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearchPTR();
    } else {
      this.onSearchPTR();
    }
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

    if (this.parForm!) {
      this.parForm.patchValue({
        userID1: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    if (this.reparForm!) {
      this.reparForm.patchValue({
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

    if (this.parForm!) {
      this.parForm.patchValue({
        userID3: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    this.reparForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  onAddPARItem() {
    const PARNo: string = this.parForm.value['parNo'];
    if (!PARNo) {
      Swal.fire('INFORMATION!', 'Please input PAR No. first before adding item', 'warning');
      return;
    }
    this.openItemModal(this.ItemModal);
  }


  onSubmit() {

    if (!this.parForm.valid) {
      this.vf.validateFormFields(this.parForm);
      return;
    }

    if (this.parItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.par.reparNo;

    if (this.parForm.valid && this.parItems.length > 0) {

      this.logger.printLogs('i', 'PAR Form', this.parForm.value);

      // this.par = {
      //   parNo: this.parForm.value['parNo'],
      //   lgu: this.parForm.value['lgu'],
      //   fund: this.parForm.value['fund'],
      //   receivedBy: this.parForm.value['userID1'],
      //   issuedBy: this.parForm.value['userID2'],
      //   postFlag: false,
      //   voidFlag: false,
      //   createdBy: this.userAccount.userID,
      // }

      this.repar = {
        reparNo: this.currentEditId,
        parNo: this.parForm.value['parNo'],
        ttype: this.parForm.value['type'],
        otype: this.parForm.value['others'],
        reason: this.parForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedID,
        approvedBy: this.approvedID,
        createdBy: this.userAccount.userID,
      }


      if (this.isEditMode) {
        this.Update(this.repar)
      }
      // else {
      //   this.Save(this.par);
      // }

    }

  }

  onSubmitREPAR() {

    if (!this.reparForm.valid) {
      this.vf.validateFormFields(this.reparForm);
      return;
    }

    if (this.selectedParItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.reparForm.valid && this.parItems.length > 0) {

      this.logger.printLogs('i', 'REPAR Form', this.par);
      this.Save(this.par);

    }

  }


  Save(par: any) {
    if (this.isRepar) {
      this.repar = {
        reparNo: par.reparNo,
        parNo: par.parNo,
        receivedBy: this.reparForm.value['userID1'],
        issuedBy: par.receivedBy,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      Swal.fire({
        title: 'Confirmation',
        text: 'Do you want to REPAR Selected Item(s)?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          this.logger.printLogs('i', 'Saving REPAR', this.repar);

          this.api.createREPAR(this.repar, this.selectedParItems)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Saved Success', res);
                Swal.fire('Saved', res.message, 'success');
                this.logger.printLogs('i', 'Saved Success', res.details);

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving REPAR', err);
                Swal.fire('Denied', err, 'warning');
              }
            });
        }
      });

    }
  }

  saveParItems() {
    this.api.createPARItem(this.parItems)  // Send the array of items
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', this.parItems);

          // Handle success, e.g., show a success message
          Swal.fire({
            title: 'Saved',
            text: 'Do you want to add new PAR?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (!result.isConfirmed) {
              this.closeModal(this.AddEditModal);
            }
          });

          this.resetForm();
          this.getAllPTR();

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving PAR Items', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  Update(repar: any) {
    this.logger.printLogs('i', 'Updating REPAR', repar);

    this.api.updateREPAR(this.repar, this.parItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', res);
          Swal.fire('Saved', res.message, 'success');
          this.logger.printLogs('i', 'Saved Success', res.details);
          this.getAllPTR();
          this.closeModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving REPAR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }


  updatePARItems() {
    this.api.updatePARItem(this.currentEditId!, this.parItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.parItems);
          Swal.fire('Updated!', res.message, 'warning');
          this.getAllPTR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR Item', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }

  onPostREPAR(ptr: any) {

    if (!ptr.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (ptr.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !ptr.postFlag) || this.roleNoFromToken == 'System Administrator' || (ptr.postFlag && this.canUnpost) || (!ptr.postFlag && this.canPost)) {
      let reparNo = ptr.reparNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (ptr.postFlag ? 'Unpost' : 'Post') + ` PTR #${reparNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postREPAR(reparNo, !ptr.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllPTR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving PTR Item!']);
                Swal.fire('Warning', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditREPAR(par: any) {
    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted PTR.', 'warning');
      return;
    }

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
      }
    }

    this.isEditMode = true;
    this.par = par;
    this.currentEditId = par.reparNo;
    this.issuedID = par.issuedBy
    this.approvedID = par.approvedBy
    this.receivedID = par.receivedBy

    this.logger.printLogs('i', 'Restoring PAR', par);

    this.parForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      type: par.ttype,
      others: par.otype,
      reason: par.reason,
      userID1: par.received,
      userID2: par.issued,
      userID3: par.approved,
    });

    this.api.retrieveREPAR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PTR Item', res);
          this.repar = res.details;
          this.parItems = res.parItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PTR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PTR Item.', 'error');
        }
      });

    this.openPARModal(this.AddEditModal); // Open the modal after patching

  }


  onViewREPAR(par: any) {
    this.par = par;
    this.currentEditId = par.reparNo;
    this.logger.printLogs('i', 'Viewing REPAR', par);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.parForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      userID1: par.receivedBy, // These will now be patched correctly
      userID2: par.issuedBy,
      userID3: par.approvedBy
    });

    this.api.retrieveREPAR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving REPAR Item', res);
          this.par = res.details;
          this.parItems = res.parItems;
          this.searchPARItems = this.parItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onRepar(par: any) {
    if (!par.postFlag) {
      Swal.fire('Information!', 'Cannot REPAR unposted PAR.', 'warning');
      return;
    }

    this.isRepar = true;
    this.par = par;
    this.logger.printLogs('i', 'Restoring PAR', par);

    this.reparForm.patchValue({
      userID2: par.receivedBy,
      searchPARItemKey: [''],
    });

    this.api.retrievePARItemByParNo(this.par.parNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PAR Item', res);
          this.parItems = res;
          this.searchPARItems = this.parItems;

          this.noOfParItems = this.parItems.filter((group: any) => group.reparFlag === false).length;
          this.logger.printLogs('i', 'Number of PAR Item Retrieved', this.noOfParItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(par: any) {

    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted REPAR.', 'warning');
      return;
    }

    let reparNo = par.reparNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove REPAR #' + reparNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteREPAR(reparNo)
          .subscribe({
            next: (res) => {
              this.getAllPTR();
              Swal.fire('Success', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting PAR', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });

  }


  // PAR ITEM

  async onAddItem() {
    if (!this.itemForm.valid) {
      this.validateFormFields(this.itemForm);
      Swal.fire('Information!', 'Please check all fields.', 'warning');
      return;
    }

    const PARNo: string = this.parForm.value['parNo'];
    const IID: string = this.itemForm.value['iid'];
    const Brand: string = this.itemForm.value['brand'];
    const Model: string = this.itemForm.value['model'];
    const Description: string = this.itemForm.value['description'];
    const SerialNo: string = this.itemForm.value['serialNo'];
    const PropertyNo: string = this.itemForm.value['propertyNo'];
    const QRCode: string = this.itemForm.value['qrCode'];
    const Unit: string = this.itemForm.value['unit'];
    const Amount: number = this.itemForm.value['amount'];
    const Date_Acquired: Date = this.itemForm.value['date_Acquired'];



    if (!(await this.isItemFound())) {
      Swal.fire('Information!', 'Item not available!', 'warning');
      return;
    }

    if (!this.isEditItemMode) {

      if (await this.isExist(PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists!', 'warning');
        return;
      }

      if (await this.isExist(SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists!', 'warning');
        return;
      }

      if (await this.isExist(QRCode)) {
        Swal.fire('Information!', 'QRCode already exists!', 'warning');
        return;
      }

      this.item = new Item(null, PARNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
      this.parItems.push(this.item);
      this.logger.printLogs('i', 'PAR ITEMS', this.parItems);
      this.resetItemForm();

      Swal.fire({
        title: 'Saved',
        text: 'Do you want to add new Item?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then(result => {
        if (!result.isConfirmed) {
          this.closeModal(this.ItemModal);
        }
      });

    } else {

      if (await this.isExistOnUpdate(this.parINo, PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.parINo, SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.parINo, QRCode)) {
        Swal.fire('Information!', 'QRCode already exists!', 'warning');
        return;
      }

      const index = this.parItems.findIndex(i => i.propertyNo === this.item!.propertyNo);
      if (index !== -1) {
        this.parItems[index] = new Item(this.parINo, PARNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
        Swal.fire('Success!', 'Item updated successfully!', 'success');
        this.resetItemForm();
        this.closeModal(this.ItemModal);
      }
    }
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



  onEditItem(item: Item) {
    this.isEditItemMode = true;
    this.item = item;
    this.parINo = item.parino;
    this.propertyNo = item.propertyNo;

    if (this.ViewItemModal) {
      const modalElement = this.ViewItemModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewItemModal)
      }
    }

    this.logger.printLogs('i', 'Restore Item', [item]);

    this.api.retrieveItem(item.iid!)
      .subscribe({
        next: (res) => {

          this.logger.printLogs('i', 'Retreived Item', res);
          this.iid = item.iid!;

          this.itemForm.patchValue({
            iid: res.description,
            qrCode: item.qrCode,
            description: item.description,
            brand: item.brand,
            model: item.model,
            serialNo: item.serialNo,
            propertyNo: item.propertyNo,
            unit: item.unit,
            amount: item.amount,
            date_Acquired: this.formatDate(item.date_Acquired),
          });

          this.openItemModal(this.ItemModal)
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  onViewItem(item: Item) {
    this.item = item;
    this.parINo = item.parino;
    this.propertyNo = item.propertyNo;

    this.logger.printLogs('i', 'View Item', [item]);

    this.api.retrieveItem(item.iid!)
      .subscribe({
        next: (res) => {

          this.logger.printLogs('i', 'Retreived Item', res);
          this.iid = item.iid!;

          this.itemName = res.description;

          if (item.reparFlag) {
            this.api.retrieveREPAR(item.reparNo!)
              .subscribe({
                next: (res) => {
                  this.repar = res.details;
                  this.logger.printLogs('i', 'Retreived REPAR No: ' + item.reparNo!, res.details);
                  this.openItemModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving REPAR', err);
                  Swal.fire('Denied', err, 'warning');
                }
              });
          } else {
            this.openItemModal(this.ViewItemModal)
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

  onDeleteItem(item: Item) {
    this.item = item;
    this.propertyNo = item.propertyNo;

    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove Property #' + this.propertyNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        // Execute delete Item where propertyNo matches to list
        if (this.propertyNo) {
          this.parItems = this.parItems.filter(items => items.propertyNo !== this.propertyNo);
          Swal.fire('Deleted!', 'Item has been removed.', 'success');
        } else {
          Swal.fire('Information!', 'Invalid property number.', 'warning');
        }
      }
    });

  }

  toggleSelection(item: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    const index = this.selectedParItems.indexOf(item);

    if (isChecked && index === -1) {
      // If checked and item is not in the list, add it
      this.selectedParItems.push(item);
    } else if (!isChecked && index > -1) {
      // If unchecked and item is in the list, remove it
      this.selectedParItems.splice(index, 1);
    }
    this.displaySelectedItems();
  }


  onTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue == 'Others';
    if (!this.isCustomType) {
      this.parForm.get('type')?.setValue(selectedValue);
      this.parForm?.get('others')?.setValue('N/A');
    } else {
      this.parForm?.get('others')?.setValue(null);
      this.parForm.get('type')?.markAsUntouched();
      this.parForm.get('others')?.markAsTouched();
    }
  }

  // Optional function to get the currently selected items
  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected PAR Items', this.selectedParItems!);
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
    this.isRepar = false;
    this.item = null;
    this.isOpen = false;
    this.parForm.reset({
      userID1: '',
      userID2: '',
      userID3: ''
    });
    this.reparForm.reset({
      userID1: '',
      userID2: ''
    });
    this.parItems = [];
    this.selectedParItems = [];
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
    this.propertyNo = null;
    this.IIDKey = null;
    this.iid = null;
    // this.item = null;
    this.items = [];
    this.brands = [];
    this.models = [];
    this.descriptions = [];
  }

  // Function to display the QR Scanner modal
  onScanQR() {
    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();
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
    this.api.retrievePARITEMByQRCode(qr)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PAR ITEMS', res);
          this.item = res[0];

          console.log('Show Items', this.item);

          this.onRetrieveREPAR(res[0].reparNo);

        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving PTR', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found in PTR`, 'info');
        }
      });

  }

  onRetrieveREPAR(reparNo: string) {
    this.api.retrieveREPAR(reparNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PTR', res);
          this.par = res.details;

          Swal.fire({
            title: 'Item Found from PTR #' + reparNo,
            text: 'Do you want to view the PTR Details?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewREPAR(this.par);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving PTR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  resumeScanning(scannerAction: any): void {
    // Add any conditions or user prompts if needed before resuming

    scannerAction.play().subscribe(
      (r: any) => console.log('Resuming Scan:', r),
      (error: any) => console.error('Error while resuming scan:', error)
    );
  }

  onCloseQRScanning(scannerAction: any) {
    // Close the modal
    this.closeModal(this.QRScannerModal!);
    this.fn = 'stop';
    scannerAction.stop();
    scannerAction.isStart = false;
    scannerAction.isLoading = false;

  }

  onPrintREPAR(reparNo: string) {

    this.api.retrieveREPAR(reparNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving REPAR', res);
          const repar = res.details;
          const parItems = res.parItems;

          this.printService.setModel(repar);

          // Ensure par.parItems is an array or default to an empty array
          const items = Array.isArray(parItems) ? parItems : [];
          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy)
          ] as Observable<any>[]).subscribe(() => {
            // Once both services complete, continue with the report generation
            const parItems = res.parItems;
            this.searchPARItems = this.parItems;
            const items = Array.isArray(parItems) ? parItems : [];

            const rows = items.map((item: any, index: number) => `
              <tr ${item.qrCode ? `class="${item.qrCode}  item-row"` : ''}>
                <td>${index + 1}</td>
                <td>${item.qty || '1'}</td>
                <td>${item.unit || 'pcs'}</td>
                <td>${item.description || 'N/A'}</td>
                <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                <td>${item.propertyNo || 'N/A'}
                </td>
                <td>
                ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

              </tr>`).join('');



            // Generate the full report content
            const reportContent = `

          <div class="watermark">PTR</div>

          <div class="row">
            <div class="col-12">
              <p class="fs-6">LGU: <span class="fw-bold border-bottom ms-1">${repar.lgu || 'Default LGU'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">FUND: <span class="fw-bold border-bottom ms-1">${repar.fund || 'Default LGU'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6 text-end">PTR No.: <span class="fw-bold border-bottom ms-1">${repar.reparNo || 'Default PTR No.'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">TRANSFER TYPE: <span class="fw-bold border-bottom ms-1">
              ${(((repar.ttype + '').toString().toLowerCase() == "others") ? repar.ttype + ' - ' + repar.otype : repar.ttype) || 'N/A'}
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
                  <tr class="item-row">
                    <th>#</th>
                    <th>QTY</th>
                    <th>UNIT</th>
                    <th>DESCRIPTION</th>
                    <th>DATE ACQUIRED</th>
                    <th>PROPERTY NUMBER</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>`;

            // Print the report
            this.printService.printReport('PTR', reportContent);

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

