import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
  selector: 'app-others',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './others.component.html',
  styleUrl: './others.component.css'
})
export class OthersComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  oprs: any = [];
  totalItems: number = 0;
  opr!: any;
  oprItems: any[] = [];
  selectedOPRItems: Item[] = []; // Array to track selected items from repar
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

  filteredItems: string[] = [];
  showDropdown: boolean = false;

  errorMessage: string = '';

  brands: any[] = [];
  models: any[] = [];
  descriptions: any[] = [];

  item: any | null | undefined;
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

  typeOptions: string[] = ['Personal', 'Donation', 'Tie-up'];
  transferOptions: string[] = ['Borrow', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isOPTR: boolean = false;
  optrForm!: FormGroup;
  optr: any | null | undefined;
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
  legend: string | undefined | null;

  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  fn: string = 'start';
  purpose: string = 'retreive';

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  canPTR: boolean = false;

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#front_and_back_camera
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth
      },
    },
    canvasStyles: [
      { /* layer */
        lineWidth: 1,
        fillStyle: '#00950685',
        strokeStyle: '#00950685',
      },
      { /* text */
        font: '20px serif',
        fillStyle: '#ff0000',
        strokeStyle: '#ff0000',
      }
    ],
  };

  qrCode = ''

  constructor(private fb: FormBuilder, private api: ApiService, private store: StoreService,
    private vf: ValidateForm, private auth: AuthService, private cdr: ChangeDetectorRef,
    private printService: PrintService, private logger: LogsService
  ) {
    this.ngOnInit();
  }


  ngOnInit(): void {

    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.getUserAccount();
    this.checkPrivileges();
    this.today = new Date().toISOString().split('T')[0];

    this.oprForm = this.fb.group({
      itemsource: ['', Validators.required],
      others: ['', Validators.required],
      ownership: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
    });

    this.optrForm = this.fb.group({
      searchPARItemKey: [''],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
      reason: ['', Validators.required],
      others: ['', Validators.required],
      type: ['', Validators.required],
    });

    this.itemForm = this.fb.group({
      iid: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      description: ['', Validators.required],
      serialNo: ['', Validators.required],
      propertyNo: ['', Validators.required],
      qrCode: ['', Validators.required],
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
      this.initializeTooltips();
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('OPR', 'create');
    this.canRetrieve = this.store.isAllowedAction('OPR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('OPR', 'update');
    this.canDelete = this.store.isAllowedAction('OPR', 'delete');
    this.canPost = this.store.isAllowedAction('OPR', 'post');
    this.canUnpost = this.store.isAllowedAction('OPR', 'unpost');

    this.canPTR = this.store.isAllowedAction('PTR', 'create');
  }

  private initializeTooltips() {
    requestAnimationFrame(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    });
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
  addModalHiddenListener(oprModal: boolean, modalId: string) {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('hidden.bs.modal', () =>
      oprModal && !this.isEditMode ? this.resetForm() : (!this.isEditItemMode ? this.resetItemForm() : ''));
  }

  openModal(modalElement: ElementRef) {
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

  togglePopover() {
    const popover = document.querySelector('[ngbPopover]');
    if (popover) {
      const isOpen = popover.classList.contains('show');
      if (isOpen) {
        popover.classList.remove('show');
      } else {
        popover.classList.add('show');
      }
    }
  }

  getUserAccount() {
    this.store.getUserAccount()
      .subscribe({
        next: (res) => {
          this.userAccount = res;
          this.logger.printLogs('i', 'Fetching User Account from Store Service', this.userAccount);
          this.getAllOPR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllOPR() {
    this.isLoading = true;
    this.api.getAllOPR()
      .pipe(
        delay(3000),
        map((res) => {

          this.logger.printLogs('i', 'Show OPRS only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated OPRS', res);
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 10);
          }


          const filtered = res.filter((par: any) =>
            par.createdBy === this.userAccount.userID ||
            par.receivedBy === this.userAccount.userID
          );
          this.totalItems = filtered.length;
          return filtered.slice(0, 10);

        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (filtered) => {
          this.oprs = filtered;
          this.logger.printLogs('i', 'List of OPRs', this.oprs);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching OPRs', err);
        }
      });
  }

  onSearchOPR() {
    if (!this.searchKey) {
      this.getAllOPR();
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true;
        this.api.searchOPR(this.searchKey.trim())
          .pipe(
            map((res) => {

              this.logger.printLogs('i', 'Show OPRS only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated OPRS', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 10);
              }

              const filtered = res.filter((par: any) =>
                par.createdBy === this.userAccount.userID ||
                par.receivedBy === this.userAccount.userID
              );
              this.totalItems = filtered.length;
              return filtered.slice(0, 10);
            }),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (filtered) => {
              this.oprs = filtered;
              this.logger.printLogs('i', 'SEARCH OPRS', this.oprs);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching OPRS on Search', err);
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
          this.userProfiles = this.userProfiles.slice(0, 10);
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

  onAddPAR() {
    this.resetForm();
    this.openModal(this.AddEditModal);
  }

  onAutoSuggestItem(): void {
    this.iid = null;
    this.searchItem();
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

  onAutoSuggestIssued() {
    this.issuedID = null;
    if (!this.issuedByID) {
      // this.getAllUserProfile();//Populate all userProfiles
      this.userProfiles = [];
    } else {
      this.activeInput = 'issued';
      if (this.issuedByID.trim()) {
        this.api.searchProfile(this.issuedByID)
          .subscribe({
            next: (res) => {
              if (res.length == 1 && res[0].fullName == this.issuedByID) {
                this.selectIssued(res[0]);
                this.logger.printLogs('i', 'Fetch Specific Issued By', res[0]);
              } else {
                this.userProfiles = res;
                this.userProfiles = this.userProfiles.slice(0, 5)
                this.logger.printLogs('i', 'Fetching Issued By', res);
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Issued By', err);
            }
          });
      }
    }
  }

  selectIssued(userProfile: any): void {
    this.issuedID = userProfile.userID;

    this.logger.printLogs('i', 'Selected to Issued', userProfile);

    this.oprForm.patchValue({
      userID2: userProfile.fullName  // Patch the selected IID to the form
    });

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

    this.optrForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  searchPARItem() {
    this.parItemKey = this.optrForm.value['searchPARItemKey'];
    console.log(this.parItemKey);

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.oprItems = [...this.searchPARItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.oprItems = this.searchPARItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
        item.propertyNo!.toLowerCase().includes(searchKey) ||
        item.qrCode!.toLowerCase().includes(searchKey)
      );
    }
  }


  searchItem() {
    //Populate all Item
    if (!this.IIDKey) {
      // this.getAllItems();
      this.items = [];
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
                this.items = this.items.slice(0, 5)
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

  // onAutoSuggestProfileBy(event: KeyboardEvent) {
  //   const key = (event.target as HTMLInputElement).value;
  //   this.api.searchProfile(key)
  //     .subscribe({
  //       next: (res) => {
  //         this.userProfiles = res;
  //       },
  //       error: (err: any) => {
  //         this.logger.printLogs('e', 'Error Fetching Profiles:', err);
  //       }
  //     });
  // }



  onKeyUp(event: KeyboardEvent): void {
    this.onSearchOPR();
  }

  onAddPARItem() {
    const OPRNo: string = this.opr ? this.opr.oprNo : null;

    if (!OPRNo) {
      Swal.fire('INFORMATION!', 'Please input PAR No. first before adding item', 'warning');
      return;
    }
    this.openModal(this.ItemModal);
  }

  onSubmit() {

    if (!this.oprForm.valid) {
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      this.vf.validateFormFields(this.oprForm);
      return;
    }

    if (this.isEditMode && this.oprItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }


    this.logger.printLogs('i', 'OPR Form', this.oprForm.value);

    this.opr = {
      oprNo: this.isEditMode ? this.opr.oprNo : null,
      itemsource: this.oprForm.value['itemsource'] == 'Others' ? this.oprForm.value['others'] : this.oprForm.value['itemsource'],
      ownership: this.oprForm.value['ownership'],
      receivedBy: this.receivedID,
      issuedBy: this.issuedID,
      postFlag: false,
      voidFlag: false,
      createdBy: this.userAccount.userID,
    }
    this.currentEditId = this.opr.oprNo;

    if (this.isEditMode) {
      this.Update(this.opr)
    } else {
      this.Save(this.opr);
    }


  }


  onSubmitOPTR() {

    if (!this.optrForm.valid) {
      this.vf.validateFormFields(this.optrForm);
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      return;
    }

    if (this.selectedOPRItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.optrForm.valid && this.oprItems.length > 0) {

      this.logger.printLogs('i', 'OPTR Form', this.opr);
      this.Save(this.opr);

    }

  }


  Save(opr: any) {
    if (!this.isOPTR) {
      this.logger.printLogs('i', 'Saving OPR', opr);
      this.api.createOPR(opr)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', opr);
            Swal.fire('Saved!!', res.message, 'success');
            this.saveParItems();


            this.closeModal(this.AddEditModal);
            this.resetForm();
            this.getAllOPR();

          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving OPR', err);
            Swal.fire('Denied', err, 'warning');
          }
        });
    } else {

      this.optr = {
        oprNo: opr.oprNo,
        ttype: this.optrForm.value['type'],
        otype: this.optrForm.value['others'],
        reason: this.optrForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedByID,
        approvedBy: this.approvedID,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      Swal.fire({
        title: 'Confirmation',
        text: 'Do you want to OPTR Selected Item(s)?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          this.logger.printLogs('i', 'Saving OPTR', this.optr);
          this.logger.printLogs('i', 'Saving OPTR Items', this.selectedOPRItems);

          this.api.createOPTR(this.optr, this.selectedOPRItems)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'OPTR Saved Success', res);
                Swal.fire('Saved', res.message, 'success');
                // this.logger.printLogs('i', 'Saved Success', res.details);

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving OPTR', err);
                Swal.fire('Denied', err, 'warning');
              }
            });
        }
      });

    }
  }

  saveParItems() {
    this.api.createPARItem(this.oprItems)  // Send the array of items
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', this.oprItems);

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
          this.getAllOPR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving PAR Items', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }


  Update(par: any) {
    this.logger.printLogs('i', 'Updating PAR', par);

    this.api.updateOPR(this.currentEditId!, par)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'OPR Saved Success', par);
          this.updateOPRItem();

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating OPR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });


  }
  updateOPRItem() {
    this.api.updateOPRItem(this.currentEditId!, this.oprItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.oprItems);
          Swal.fire('Updated!', res.message, 'success');
          this.getAllOPR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating OPR Item', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }

  onPost(opr: any) {

    if (!opr.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (opr.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !opr.postFlag) || this.roleNoFromToken == 'System Administrator' ||
      (opr.postFlag && this.canUnpost) || (!opr.postFlag && this.canPost)) {

      Swal.fire({
        title: (opr.postFlag ? 'Unpost' : 'Post') + ` OPR #000${opr.oprNo}`,
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postOPR(opr.oprNo, !opr.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllOPR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Posting OPR!']);
                Swal.fire('Warning', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditOPR(opr: any) {
    if (opr.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted OPR.', 'warning');
      return;
    }

    this.oprItems = []
    this.isEditMode = true;
    this.opr = opr;
    this.currentEditId = opr.oprNo;
    this.receivedID = opr.receivedBy
    this.issuedID = opr.issuedBy

    this.logger.printLogs('i', 'Restoring OPR', opr);

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
      }
    }

    console.log('ITEMSOURCE >>>', opr.itemSource)
    const isInTypeOptions = this.typeOptions.some(x => x = opr.itemSource);
    console.log('isInTypeOptions >>> ', isInTypeOptions)

    this.oprForm.patchValue({
      itemsource: isInTypeOptions ? opr.itemSource : 'Others',
      others: isInTypeOptions ? 'N/A' : opr.itemSource,
      ownership: opr.ownership,
      userID1: opr.received,
      userID2: opr.issued,
    });

    this.api.retrieveOPRItemByOPRNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPR Item', res);
          this.oprItems = res;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Info', `No Property Added for OPR #000${opr.oprNo}.`, 'info');
        }
      });

    this.openModal(this.AddEditModal); // Open the modal after patching

  }


  onViewOPR(opr: any) {
    this.opr = opr;
    this.isOPTR = false;
    this.currentEditId = opr.oprNo;
    this.logger.printLogs('i', 'Viewing OPR', opr);

    if (!this.onItemFound) {
      this.item = null;
    }

    const isInTypeOptions = this.typeOptions.includes(opr.itemsource);

    this.oprForm.patchValue({
      itemsource: isInTypeOptions ? opr.itemsource : 'Others',
      others: isInTypeOptions ? '' : opr.itemsource,
      ownership: opr.ownership,
      userID1: opr.received,
      userID2: opr.issued,
    });

    this.api.retrieveOPRItemByOPRNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPR Item', res);
          this.oprItems = res;
          this.searchPARItems = this.oprItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Info', `No Property Added for OPR #000${opr.oprNo}.`, 'info');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

  }

  onTransfer(opr: any) {
    if (!opr.postFlag) {
      Swal.fire('Information!', 'Cannot Transfer unposted OPR.', 'warning');
      return;
    }

    this.isOPTR = true;
    this.opr = opr;
    this.logger.printLogs('i', 'Restoring OPR', opr);

    this.issuedByID = opr.receivedBy;

    this.optrForm.patchValue({
      userID2: opr.receivedBy,
      userID1: '', //Received BY
      userID3: '', //Approved BY
      type: '',
      searchPARItemKey: [''],
    });

    this.api.retrieveOPRItemByOPRNo(this.opr.oprNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPR Item', res);
          this.oprItems = res.filter((item: any) => item.optrFlag === false);
          this.searchPARItems = this.oprItems;

          this.noOfParItems = this.oprItems.filter((group: any) => group.optrFlag === false).length;
          this.logger.printLogs('i', 'Number of OPR Item Retrieved', this.noOfParItems);

          this.openModal(this.ViewModal); // Open the modal after patching
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPR Item.', 'error');
        }
      });


  }

  onDelete(par: any) {

    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted PAR.', 'warning');
      return;
    }

    let parNo = par.parNo;
    Swal.fire({
      title: 'Remove PAR #' + parNo + "",
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deletePAR(parNo)
          .subscribe({
            next: (res) => {
              this.getAllOPR();
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
    if (!this.itemForm.valid || !this.opr) {
      this.validateFormFields(this.itemForm);
      Swal.fire('Information!', 'Please check all fields.', 'warning');
      return;
    }

    const OPRNo: string = this.opr ? this.opr.oprNo : 0;
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
    if (await this.isListed(SerialNo)) {
      Swal.fire('Information!', 'Serial No. already listed!', 'warning');
      return;
    }
    if (await this.isListed(PropertyNo)) {
      Swal.fire('Information!', 'Property No. already listed!', 'warning');
      return;
    }
    if (await this.isListed(QRCode)) {
      Swal.fire('Information!', 'QRCode already listed!', 'warning');
      return;
    }


    if (!this.isEditItemMode) {


      if (await this.isExist(SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists!', 'warning');
        return;
      }

      if (await this.isExist(PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists!', 'warning');
        return;
      }

      if (await this.isExist(QRCode)) {
        Swal.fire('Information!', 'QRCode already exists!', 'warning');
        return;
      }
      // IF EXIST FROM ICS ITEMS

      if (await this.isExistFromICS(SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists in ICS items!', 'warning');
        return;
      }

      if (await this.isExistFromICS(PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists in ICS items!', 'warning');
        return;
      }

      if (await this.isExistFromICS(QRCode)) {
        Swal.fire('Information!', 'QRCode already exists in ICS items!', 'warning');
        return;
      }

      this.item = {
        oprINo: null,
        oprNo: OPRNo,
        iid: this.iid!,
        brand: Brand,
        model: Model,
        description: Description,
        serialNo: SerialNo,
        propertyNo: PropertyNo,
        qrCode: QRCode,
        unit: Unit,
        amount: Amount,
        date_Acquired: Date_Acquired,
      };

      this.oprItems.push(this.item);
      this.logger.printLogs('i', 'OPR ITEMS', this.oprItems);
      this.resetItemForm();

      Swal.fire({
        title: 'Save',
        text: 'Do you want to add new OPR Item?',
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

        this.item = {
          oprINo: this.oprINo,
          oprNo: OPRNo,
          iid: this.iid!,
          brand: Brand,
          model: Model,
          description: Description,
          serialNo: SerialNo,
          propertyNo: PropertyNo,
          qrCode: QRCode,
          unit: Unit,
          amount: Amount,
          date_Acquired: Date_Acquired,
        };
        this.oprItems[index] = this.item
        Swal.fire('Success!', 'Item updated successfully!', 'success');
        this.resetItemForm();
        this.closeModal(this.ItemModal);
      }
    }
  }

  isListed(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isEditItemMode) {
        this.oprItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 1 ? resolve(true) : resolve(false);
      } else {
        this.oprItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 0 ? resolve(true) : resolve(false);
      }
    });
  }

  isExist(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.api.scanUniqueOPRItem(key!)
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

  isExistFromICS(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.api.scanUniqueICSItem(key!)
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

  isExistOnUpdate(oprINo: number | null, key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!oprINo) {
        resolve(false); // Consider an item as existing in case of error.
        this.logger.printLogs('e', 'NO OPRINO', 'FOR UPDATE ITEM IN CREATING NEW OPR ITEM.');
        return
      }
      this.api.scanExistingUniqueOPRItem(oprINo!, key!)
        .subscribe({
          next: (res) => {
            res.length > 0 ? resolve(true) : resolve(false);
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error', err);
            Swal.fire('Denied', err, 'warning');
            resolve(false); // Consider an item as existing in case of error.
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
    this.oprINo = item.oprINo;
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
      this.onRetrieveItem(item)

  }

  onRetrieveItem(item: any) {
    this.api.retrieveItem(item.iid!)
      .subscribe({
        next: (res) => {

          this.logger.printLogs('i', 'Retreived Item', res);
          this.iid = item.iid!;

          this.itemForm.patchValue({
            iid: res.description,
            brand: item.brand,
            model: item.model,
            description: item.description,
            serialNo: item.serialNo,
            propertyNo: item.propertyNo,
            qrCode: item.qrCode,
            unit: item.unit,
            amount: item.amount,
            date_Acquired: this.formatDate(item.date_Acquired),
          });

          this.openModal(this.ItemModal)
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

          if (item.optrFlag) {
            this.api.retrieveOPTR(item.optrNo!)
              .subscribe({
                next: (res) => {
                  this.optr = res.details;
                  this.logger.printLogs('i', 'Retreived OPTR No: ' + item.optrNo!, res.details);
                  this.openModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving OPTR', err);
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

  onCopyItem(item: Item) {
    this.logger.printLogs('i', 'Copy Item', [item]);

    this.api.retrieveItem(item.iid!)
      .subscribe({
        next: (res) => {

          this.logger.printLogs('i', 'Retreived Item', res);
          this.iid = item.iid!;

          this.itemForm.patchValue({
            iid: res.description,
            brand: item.brand,
            model: item.model,
            description: item.description,
            serialNo: '',
            propertyNo: '',
            qrCode: '',
            unit: item.unit,
            amount: item.amount,
            date_Acquired: this.formatDate(item.date_Acquired),
          });

          this.openModal(this.ItemModal)
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
      title: 'Remove Property #' + this.propertyNo + "",
      text: 'Are you sure?',
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

    const index = this.selectedOPRItems.indexOf(item);

    if (isChecked && index === -1) {
      // If checked and item is not in the list, add it
      this.selectedOPRItems.push(item);
    } else if (!isChecked && index > -1) {
      // If unchecked and item is in the list, remove it
      this.selectedOPRItems.splice(index, 1);
    }
    this.displaySelectedItems();
  }

  // Method to handle "Select All/Unselect All" functionality
  toggleAllSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    // Loop through all items
    this.oprItems.forEach(item => {
      item.optrFlag = isChecked; // Update reparFlag based on checkbox state
      const index = this.selectedOPRItems.indexOf(item);

      if (isChecked && index === -1) {
        this.selectedOPRItems.push(item); // Add to selected items if checked and not already in the list
      } else if (!isChecked && index > -1) {
        this.selectedOPRItems.splice(index, 1); // Remove from selected items if unchecked
      }
    });

    this.displaySelectedItems(); // Update the UI or other components
  }

  // Optional function to get the currently selected items
  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected PAR Items', this.selectedOPRItems!);
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
    this.userProfiles = [];
    this.oprItems = [];
    this.searchPARItems = [];
    this.selectedOPRItems = [];
    this.parItemKey = '';
    this.searchKey = '';

    this.oprForm.reset({
      itemsource: '',
      others: '',
      ownership: '',
      userID1: '',
      userID2: '',
    });
    this.optrForm.reset({
      searchPARItemKey: '',
      userID1: '',
      userID2: '',
      userID3: '',
      reason: '',
      others: '',
      type: '',
    });

  }

  resetItemForm() {
    this.isEditItemMode = false;
    this.isModalOpen = false;
    this.propertyNo = null;
    this.IIDKey = null;
    this.iid = null;
    this.items = [];
    this.brands = [];
    this.models = [];
    this.descriptions = [];

    if (this.isEditItemMode) {
      this.itemForm.reset({
        iid: '',
        description: '',
        brand: '',
        model: '',
        serialNo: '',
        propertyNo: '',
        qrCode: '',
        unit: '',
        amount: '',
        date_Acquired: this.today,
      });
    }
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
  public handle(scannerAction: any, fn: string, purpose: string): void {
    this.scannerAction = scannerAction;
    this.fn = fn;
    this.purpose = purpose;

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
    if (this.purpose == 'get') {
      this.itemForm.patchValue({
        qrCode: qr
      });
      this.onCloseQRScanning(this.scannerAction);
    } else {
      this.api.retrieveOPRITEMByQRCode(qr)
        .subscribe({
          next: (res) => {
            console.log('Retrieve OPR ITEMS', res);
            this.item = res[0];

            console.log('Show Items', this.item);

            this.onRetrieveOPR(res[0].oprNo);

          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Problem with Retreiving OPR', err);
            Swal.fire('Item not Found', `QR Code ${qr} not found in OPR`, 'info');
          }
        });
    }
  }

  onRetrieveOPR(oprNo: number) {
    this.api.retrieveOPR(oprNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve OPR', res);
          this.opr = res[0];

          Swal.fire({
            title: 'Item Found from OPR #000' + oprNo + "",
            text: 'Do you want to view the OPR?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewOPR(this.opr);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving OPR', err);
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

  onTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue === 'Others';
    if (!this.isCustomType) {
      this.optrForm.get('type')?.setValue(selectedValue);
      this.optrForm.get('others')?.setValue('N/A');
    } else {
      // Wait for Angular to render the input field before focusing
      this.optrForm.get('type')?.markAsUntouched();
      this.optrForm.get('others')?.markAsTouched();
      this.optrForm.get('others')?.setValue(null);
    }
  }

  onPrint(oprNo: number) {

    this.api.retrieveOPR(oprNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPR', res);
          const opr = res[0];


          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res[0].receivedBy),
            this.printService.setIssuedBy(res[0].issuedBy)
          ] as Observable<any>[]).subscribe(() => {

            this.api.retrieveOPRItemByOPRNo(oprNo!)
              .subscribe({
                next: (res) => {

                  this.logger.printLogs('i', 'Retrieving OPR Item', res);
                  const parItems = res;

                  // Ensure par.parItems is an array or default to an empty array
                  const items = Array.isArray(parItems) ? parItems : [];

                  // Create the table rows dynamically
                  const rows = items.map((item: any, index: number) => `
                <tr ${item.qrCode ? `class="${item.qrCode} item-row"` : ''}>
                  <td>${index + 1}</td>
                  <td>${item.qty || '1'}</td>
                  <td>${item.unit || 'pcs'}</td>
                  <td>${item.description || 'N/A'}</td>
                  <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                  <td>${item.propertyNo || 'N/A'}</td>
                  </td>
                  <td>
                  ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>`).join('');



                  // Generate the full report content
                  const reportContent = `

                  <div class="watermark">OPR</div>

                  <div class="row">
                    <div class="col-6">
                      <p class="fs-6">SOURCE OF ITEM: <span class="fw-bold border-bottom ms-1">${opr.itemSource || 'Default N/A'}</span></p>
                    </div>
                    <div class="col-6">
                      <p class="fs-6">OWNERSHIP: <span class="fw-bold border-bottom ms-1">${opr.ownership || 'Default N/A'}</span></p>
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
                  this.printService.printReport('OPR', reportContent);

                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
                  Swal.fire('Info', 'No OPR Item yet added.', 'info');
                }
              });

          });

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPR.', 'error');
          return;
        }
      });



  }
}

