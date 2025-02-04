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
  selector: 'app-optr',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './optr.component.html',
  styleUrl: './optr.component.css'
})
export class OptrComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  ptrs: any = [];
  totalItems: number = 0;
  opr!: any | null;
  oprItems: any[] = [];
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
  oprForm!: FormGroup;
  itemForm!: FormGroup;
  isEditMode: boolean = false;
  isEditItemMode: boolean = false;
  currentEditId: number | null = null;

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  oprINo: number | null = null;
  propertyNo: string | null = null;

  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isOPTR: boolean = false;
  optrForm!: FormGroup;
  optr: any | null | undefined;
  searchOPRItems: Item[] = [];

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

    this.oprForm = this.fb.group({
      type: ['', Validators.required],
      others: ['', Validators.required],
      reason: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
    });

    this.optrForm = this.fb.group({
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
    this.canCreate = this.store.isAllowedAction('OPTR', 'create');
    this.canRetrieve = this.store.isAllowedAction('OPTR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('OPTR', 'update');
    this.canDelete = this.store.isAllowedAction('OPTR', 'delete');
    this.canPost = this.store.isAllowedAction('OPTR', 'post');
    this.canUnpost = this.store.isAllowedAction('OPTR', 'unpost');
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
          this.getAllOPTR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllOPTR() {
    this.isLoading = true; // Start spinner
    this.api.getAllOPTR()
      .pipe(
        delay(3000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show OPTRs only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated OPTRs', res);
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 10); // For administrators, show all records, limited to 10
          }
          const filtered = res.filter((ptr: any) =>
            ptr.createdBy === this.userAccount.userID ||
            ptr.receivedBy === this.userAccount.userID
          );
          this.totalItems = filtered.length;
          return filtered.slice(0, 10); // Limit to the first 10 items
        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filtered) => {
          this.ptrs = filtered;
          this.logger.printLogs('i', 'List of OPTRs', this.ptrs);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching OPTRs', err);
        }
      });
  }

  onSearchOPTR() {
    if (!this.searchKey) {
      this.getAllOPTR(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchOPTR(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter results based on `createdBy` and slice for pagination
              this.logger.printLogs('i', 'Show OPTRs only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated OPTRs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 10); // For administrators, show all records, limited to 10
              }
              // Filter or process the response if needed
              const filtered = res.filter((optr: any) =>
                optr.issuedBy === this.userAccount.userID ||
                optr.receivedBy === this.userAccount.userID
              );
              this.totalItems = filtered.length;
              return filtered.slice(0, 10); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filtered) => {
              this.ptrs = filtered; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH OPTRs', this.ptrs);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching OPTRs on Search', err);
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
    this.parItemKey = this.optrForm.value['searchPARItemKey'];
    console.log(this.parItemKey);

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.oprItems = [...this.searchOPRItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.oprItems = this.searchOPRItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
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
    this.getAllOPTR();
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

    if (this.oprForm!) {
      this.oprForm.patchValue({
        userID1: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    if (this.optrForm!) {
      this.optrForm.patchValue({
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

    if (this.oprForm!) {
      this.oprForm.patchValue({
        userID3: userProfile.fullName  // Patch the selected IID to the form
      });
    }

    this.optrForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  onAddPARItem() {
    const OPRNo: string = this.oprForm.value['oprNo'];
    if (!OPRNo) {
      Swal.fire('INFORMATION!', 'Please input OPR No. first before adding item', 'warning');
      return;
    }
    this.openItemModal(this.ItemModal);
  }


  onSubmit() {

    if (!this.oprForm.valid) {
      this.vf.validateFormFields(this.oprForm);
      return;
    }

    if (this.oprItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.opr.optrNo;

    if (this.oprForm.valid && this.oprItems.length > 0) {

      this.logger.printLogs('i', 'OPR Form', this.oprForm.value);


      this.optr = {
        optrNo: this.currentEditId,
        oprNo: this.opr.oprNo,
        ttype: this.oprForm.value['type'],
        otype: this.oprForm.value['others'],
        reason: this.oprForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedID,
        approvedBy: this.approvedID,
        createdBy: this.userAccount.userID,
      }


      if (this.isEditMode) {
        this.Update(this.optr)
      }
    
    }

  }

  Update(optr: any) {
    this.logger.printLogs('i', 'Updating OPTR', optr);

    this.api.updateOPTR(this.optr, this.oprItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', res);
          Swal.fire('Saved', res.message, 'success');
          this.logger.printLogs('i', 'Saved Success', res.details);
          this.getAllOPTR();
          this.closeModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving OPTR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }

  updateOPRItems() {
    this.api.updateOPRItem(this.currentEditId!, this.oprItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.oprItems);
          Swal.fire('Updated!', res.message, 'warning');
          this.getAllOPTR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating OPR Item', err);
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
                this.getAllOPTR();
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

  onEditOPTR(opr: any) {
    if (opr.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted OPTR.', 'warning');
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
    this.opr = opr;
    this.currentEditId = opr.optrNo;
    this.issuedID = opr.issuedBy
    this.approvedID = opr.approvedBy
    this.receivedID = opr.receivedBy

    this.logger.printLogs('i', 'Restoring OPR', opr);

    this.oprForm.patchValue({
      lgu: opr.lgu,
      fund: opr.fund,
      parNo: opr.parNo,
      type: opr.ttype,
      others: opr.otype,
      reason: opr.reason,
      userID1: opr.received,
      userID2: opr.issued,
      userID3: opr.approved,
    });

    this.api.retrieveOPTR(this.currentEditId!+"")
      .subscribe({
        next: (res) => {
          this.optr = res.details;
          this.logger.printLogs('i', 'Retrieving OPTR', this.optr);
          this.oprItems = res.parItems;
          this.logger.printLogs('i', 'Retrieving OPTR Item', this.oprItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPTR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPTR Item.', 'error');
        }
      });

    this.openPARModal(this.AddEditModal); // Open the modal after patching

  }


  onViewOPTR(opr: any) {
    this.opr = opr;
    this.currentEditId = opr.optrNo;
    this.logger.printLogs('i', 'Viewing OPTR', opr);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.oprForm.patchValue({
      lgu: opr.lgu,
      fund: opr.fund,
      parNo: opr.parNo,
      userID1: opr.receivedBy, // These will now be patched correctly
      userID2: opr.issuedBy,
      userID3: opr.approvedBy
    });

    this.api.retrieveOPTR(this.currentEditId!+"")
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPTR Item', res);
          this.opr = res.details;
          this.oprItems = res.oprItems;
          this.optr = this.oprItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPTR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPTR Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onOPTR(opr: any) {
    if (!opr.postFlag) {
      Swal.fire('Information!', 'Cannot OPTR unposted PAR.', 'warning');
      return;
    }

    this.isOPTR = true;
    this.opr = opr;
    this.logger.printLogs('i', 'Restoring OPR', opr);

    this.optrForm.patchValue({
      userID2: opr.receivedBy,
      searchPARItemKey: [''],
    });

    this.api.retrieveOPRItemByOPRNo(this.opr.oprNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPR Item', res);
          this.oprItems = res;
          this.searchOPRItems = this.oprItems;

          this.noOfParItems = this.oprItems.filter((group: any) => group.optrFlag === false).length;
          this.logger.printLogs('i', 'Number of OPR Item Retrieved', this.noOfParItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPR Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(opr: any) {

    if (opr.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted OPTR.', 'warning');
      return;
    }

    let optrNo = opr.optrNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove OPTR #' + optrNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteOPTR(optrNo)
          .subscribe({
            next: (res) => {
              this.getAllOPTR();
              Swal.fire('Success', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting OPTR', err);
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

    const OPRNo: string = this.oprForm.value['oprNo'];
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

      this.item = new Item(null, OPRNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
      this.oprItems.push(this.item);
      this.logger.printLogs('i', 'OPR ITEMS', this.oprItems);
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

      if (await this.isExistOnUpdate(this.oprINo, PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.oprINo, SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.oprINo, QRCode)) {
        Swal.fire('Information!', 'QRCode already exists!', 'warning');
        return;
      }

      const index = this.oprItems.findIndex(i => i.propertyNo === this.item!.propertyNo);
      if (index !== -1) {
        this.oprItems[index] = new Item(this.oprINo, OPRNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
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



  onEditItem(item: any) {
    this.isEditItemMode = true;
    this.item = item;
    this.oprINo = item.oprino;
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

  onViewItem(item: any) {
    this.item = item;
    this.oprINo = item.oprINo;
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
                  this.optr = res.details;
                  this.logger.printLogs('i', 'Retreived OPTR No: ' + item.reparNo!, res.details);
                  this.openItemModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving OPTR', err);
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

  onDeleteItem(item: any) {
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
          this.oprItems = this.oprItems.filter(items => items.propertyNo !== this.propertyNo);
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
      this.oprForm.get('type')?.setValue(selectedValue);
      this.oprForm?.get('others')?.setValue('N/A');
    } else {
      this.oprForm?.get('others')?.setValue(null);
      this.oprForm.get('type')?.markAsUntouched();
      this.oprForm.get('others')?.markAsTouched();
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
    this.isOPTR = false;
    this.item = null;
    this.isOpen = false;
    this.oprForm.reset({
      userID1: '',
      userID2: '',
      userID3: ''
    });
    this.optrForm.reset({
      userID1: '',
      userID2: ''
    });
    this.oprItems = [];
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
    this.api.retrieveOPRITEMByQRCode(qr)
      .subscribe({
        next: (res) => {
          console.log('Retrieve OPR ITEMS', res);
          this.item = res[0];

          console.log('Show Items', this.item);

          this.onRetrieveOPTR(res[0].reparNo);

        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving OPTR', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found in OPTR`, 'info');
        }
      });

  }

  onRetrieveOPTR(optrNo: string) {
    this.api.retrieveOPTR(optrNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve OPTR', res);
          this.opr = res.details;

          Swal.fire({
            title: 'Item Found from OPTR #' + optrNo,
            text: 'Do you want to view the OPTR Details?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewOPTR(this.opr);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving OPTR', err);
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
  
  onSourceTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue === 'Others';
    if (!this.isCustomType) {
      this.oprForm.get('itemsource')?.setValue(selectedValue);
      this.oprForm.get('others')?.setValue('N/A');
    } else {
      // Wait for Angular to render the input field before focusing
      this.oprForm.get('itemsource')?.markAsUntouched();
      this.oprForm.get('others')?.markAsTouched();
      this.oprForm.get('others')?.setValue(null);
    }
  }


  onPrintOPTR(optrNo: string) {

    this.api.retrieveOPTR(optrNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPTR', res);
          const optr = res.details;
          const oprItems = res.parItems;

          this.printService.setModel(optr);

          // Ensure par.parItems is an array or default to an empty array
          const items = Array.isArray(oprItems) ? oprItems : [];
          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy)
          ] as Observable<any>[]).subscribe(() => {
            // Once both services complete, continue with the report generation
            const oprItems = res.parItems;
            this.searchOPRItems = this.oprItems;
            const items = Array.isArray(oprItems) ? oprItems : [];

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
              <p class="fs-6">LGU: <span class="fw-bold border-bottom ms-1">${optr.lgu || 'Default LGU'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">FUND: <span class="fw-bold border-bottom ms-1">${optr.fund || 'Default LGU'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6 text-end">PTR No.: <span class="fw-bold border-bottom ms-1">${optr.reparNo || 'Default PTR No.'}</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">TRANSFER TYPE: <span class="fw-bold border-bottom ms-1">
              ${(((optr.ttype + '').toString().toLowerCase() == "others") ? optr.ttype + ' - ' + optr.otype : optr.ttype) || 'N/A'}
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
            this.printService.printReport('OPTR', reportContent);

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

