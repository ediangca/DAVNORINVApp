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
import { ToastrService } from 'ngx-toastr';

// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-par',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './par.component.html',
  styleUrl: './par.component.css'
})
export class ParComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  pars: any = [];
  totalItems: number = 0;
  par!: any;
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

  filteredItems: string[] = [];
  showDropdown: boolean = false;

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
    private printService: PrintService, private logger: LogsService, private toastr: ToastrService
  ) {
    this.ngOnInit();
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
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
    });

    this.reparForm = this.fb.group({
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
    this.canCreate = this.store.isAllowedAction('PAR', 'create');
    this.canRetrieve = this.store.isAllowedAction('PAR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('PAR', 'update');
    this.canDelete = this.store.isAllowedAction('PAR', 'delete');
    this.canPost = this.store.isAllowedAction('PAR', 'post');
    this.canUnpost = this.store.isAllowedAction('PAR', 'unpost');

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
          this.getAllPAR(); // Method name corrected for consistent casing
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllPAR() {
    this.isLoading = true; // Start spinner
    this.api.getAllPAR()
      .pipe(
        delay(3000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show PARS only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated PARs', res);

          this.totalItems = res.length;
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 20); // For administrators, show all records, limited to 10
          }

          // For regular users, filter data based on `receivedBy` or relevant fields
          const filteredPARs = res.filter((par: any) =>
            par.createdBy === this.userAccount.userID ||
            par.issuedBy === this.userAccount.userID ||
            par.receivedBy === this.userAccount.userID
          );
          this.totalItems = filteredPARs.length;
          return filteredPARs.slice(0, 20); // Limit to 10 results

        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filteredPARs) => {
          this.pars = filteredPARs;
          this.logger.printLogs('i', 'List of PARs', this.pars);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching PARs', err);
        }
      });
  }

  // onSearchPAR() {
  //   //Populate all User Groups
  //   if (!this.searchKey) {
  //     this.getAllPAR();
  //   } else {
  //     if (this.searchKey.trim()) {
  //       this.api.searchPAR(this.searchKey)
  //         .subscribe({
  //           next: (res) => {
  //             this.pars = res;
  //             this.logger.printLogs('i', 'SEARCH PARS', this.pars);
  //             this.pars = this.pars.slice(0, 10);
  //           },
  //           error: (err: any) => {
  //             console.log("Error Fetching PARS:", err);
  //           }
  //         });
  //     }
  //   }
  // }

  onSearchPAR() {
    if (!this.searchKey) {
      this.getAllPAR(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchPAR(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter results based on `createdBy` and slice for pagination
              this.logger.printLogs('i', 'Show PARS only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated PARs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 20); // For administrators, show all records, limited to 10
              }
              // Filter or process the response if needed
              const filteredPARs = res.filter((par: any) =>
                par.createdBy === this.userAccount.userID ||
                par.issuedBy === this.userAccount.userID ||
                par.receivedBy === this.userAccount.userID
              );
              return filteredPARs.slice(0, 20); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filteredPARs) => {
              this.pars = filteredPARs; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH PARS', this.pars);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching PARS on Search', err);
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

    this.parForm.patchValue({
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

    this.reparForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
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
    if (event.key === 'Enter') {
      this.onSearchPAR();
    } else {
      this.onSearchPAR();
    }
  }

  onAddPARItem() {
    const PARNo: string = this.parForm.value['parNo'];
    if (!PARNo) {
      Swal.fire('INFORMATION!', 'Please input PAR No. first before adding item', 'warning');
      return;
    }


    this.api.isPARExist(PARNo).subscribe((exists: boolean) => {

      this.logger.printLogs('i', `PAR No ${PARNo} Exist`, exists);
      if (!this.isEditMode && exists) {
        Swal.fire('INFORMATION!', 'PAR No. already exists!', 'warning');
        return;
      }

      this.openModal(this.ItemModal);
    });

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
  
  onSubmit() {

    if (!this.parForm.valid) {
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      this.vf.validateFormFields(this.parForm);
      return;
    }

    if (this.parItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.parForm.valid && this.parItems.length > 0) {

      this.logger.printLogs('i', 'PAR Form', this.parForm.value);

      this.par = {
        parNo: this.parForm.value['parNo'],
        lgu: this.parForm.value['lgu'],
        fund: this.parForm.value['fund'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedID,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }
      this.currentEditId = this.par.parNo;

      if (this.isEditMode) {
        this.Update(this.par)
      } else {
        this.Save(this.par);
      }

    }

  }


  onSubmitREPAR() {

    if (!this.reparForm.valid) {
      this.vf.validateFormFields(this.reparForm);
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
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
    if (!this.isRepar) {
      this.logger.printLogs('i', 'Saving PARRRRRRRRRRRR', par);
      this.api.createPAR(par, this.parItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', par);
            this.logger.printLogs('i', 'Saved Success', this.parItems);

            this.toast('Saved!', res.message, 'success');
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
            this.getAllPAR();

            // this.saveParItems();
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving PAR', err);
            Swal.fire('Saving Denied', err, 'warning');
            this.toast('Saving Denied!', err, 'warning');
            this.parItems = [];
          }
        });
    } else {

      this.repar = {
        parNo: par.parNo,
        ttype: this.reparForm.value['type'],
        otype: this.reparForm.value['others'],
        reason: this.reparForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedByID,
        approvedBy: this.approvedID,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      Swal.fire({
        title: 'Confirmation',
        text: 'Do you want to PTR Selected Item(s)?',
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
                this.toast('Saved!', res.message, 'success');
                this.logger.printLogs('i', 'Saved Success', res.details);

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving PTR', err);
                Swal.fire('Saving Denied', err, 'warning');
                this.toast('Saving Denied!', err, 'warning');
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
          this.toast('Saved!', res.message, 'success');
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
          this.getAllPAR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving PAR Items', err);
          Swal.fire('Saving Denied', err, 'warning');
          this.toast('Saving Denied!', err, 'warning');

        }
      });
  }


  Update(par: any) {
    this.logger.printLogs('i', 'Updating PAR', par);

    this.api.updatePAR(this.currentEditId!, par, this.parItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Update Success', par);
          Swal.fire('Updated!', res.message, 'success');
          this.toast('Updated!', res.message, 'success');
          this.getAllPAR();
          // this.updatePARItems();

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR', err);
          Swal.fire('Updating Denied', err, 'warning');
          this.toast('Updating Denied!', err, 'warning');
        }
      });
  }
  updatePARItems() {
    this.api.updatePARItem(this.currentEditId!, this.parItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.parItems);
          Swal.fire('Updated!', res.message, 'warning');
          this.toast('Updated!', res.message, 'success');
          this.getAllPAR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR Item', err);
          Swal.fire('Updating Denied', err, 'warning');
          this.toast('Updating Denied!', err, 'warning');
        }
      });

  }

  onPostPAR(par: any) {

    if (!par.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (par.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !par.postFlag) || this.roleNoFromToken == 'System Administrator' || (par.postFlag && this.canUnpost) || (!par.postFlag && this.canPost)) {
      let parNo = par.parNo;


      Swal.fire({
        title: (par.postFlag ? 'Unpost' : 'Post') + ` PAR #${parNo}`,
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postPAR(par.parNo, !par.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllPAR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.toast('Success!', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving PAR Item!']);
                Swal.fire('Denied!', err, 'warning');
                this.toast('Denied!', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditPAR(par: any) {
    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted PAR.', 'warning');
      return;
    }

    this.isEditMode = true;
    this.par = par;
    this.currentEditId = par.parNo;
    this.receivedID = par.receivedBy
    this.issuedID = par.issuedBy

    this.logger.printLogs('i', 'Restoring PAR', par);

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
      }
    }


    this.parForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      userID1: par.received,
      userID2: par.issued
    });

    this.api.retrievePARItemByParNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PAR Item', res);
          this.parItems = res;
          this.openModal(this.AddEditModal); // Open the modal after patching
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
        }
      });


  }


  onViewPAR(par: any) {
    this.par = par;
    this.isRepar = false;
    this.currentEditId = par.parNo;
    this.logger.printLogs('i', 'Viewing PAR', par);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.parForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      userID1: par.receivedBy, // These will now be patched correctly
      userID2: par.issuedBy
    });

    this.api.retrievePARItemByParNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PAR Item', res);
          this.parItems = res;
          this.searchPARItems = this.parItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

  }

  onRepar(par: any) {
    if (!par.postFlag) {
      Swal.fire('Information!', 'Cannot PTR unposted PAR.', 'warning');
      return;
    }

    this.isRepar = true;
    this.par = par;
    this.logger.printLogs('i', 'Restoring PAR', par);
    this.receivedByID = null;
    this.issuedByID = par.receivedBy;

    this.reparForm.patchValue({
      userID2: par.receivedBy,
      userID1: '', //Received BY
      userID3: '', //Approved BY
      type: '',
      searchPARItemKey: [''],
    });

    this.api.retrievePARItemByParNo(this.par.parNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PAR Item', res);
          this.parItems = res.filter((item: any) => item.reparFlag === false);
          this.searchPARItems = this.parItems;

          this.noOfParItems = this.parItems.filter((group: any) => group.reparFlag === false).length;
          this.logger.printLogs('i', 'Number of PAR Item Retrieved', this.noOfParItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

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
              this.getAllPAR();
              Swal.fire('Success', res.message, 'success');
              this.toast('Success!', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting PAR', err);
              Swal.fire('Denied', err, 'warning');
              this.toast('Denied!', err, 'warning');
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

      this.item = new Item(null, PARNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
      this.parItems.push(this.item);
      this.logger.printLogs('i', 'PAR ITEMS', this.parItems);
      this.resetItemForm();

      Swal.fire({
        title: 'Successfully Added',
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

  isListed(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isEditItemMode) {
        this.parItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 1 ? resolve(true) : resolve(false);
      } else {
        this.parItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 0 ? resolve(true) : resolve(false);
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

  isExistOnUpdate(parINo: number | null, key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!parINo) {
        resolve(false); // Consider an item as existing in case of error.
        this.logger.printLogs('e', 'NO PARINO', 'FOR UPDATE ITEM IN CREATING NEW PAR ITEM.');
        return
      }
      this.api.scanExistingUniquePARItem(parINo!, key!)
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
    this.onRetrieveItem(item)

  }


  onRetrieveItem(item: Item) {

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
                  this.logger.printLogs('i', 'Retreived PTR No: ' + item.reparNo!, res.details);
                  this.openModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving PTR', err);
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

  // Method to handle "Select All/Unselect All" functionality
  toggleAllSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    // Loop through all items
    this.parItems.forEach(item => {
      item.reparFlag = isChecked; // Update reparFlag based on checkbox state
      const index = this.selectedParItems.indexOf(item);

      if (isChecked && index === -1) {
        this.selectedParItems.push(item); // Add to selected items if checked and not already in the list
      } else if (!isChecked && index > -1) {
        this.selectedParItems.splice(index, 1); // Remove from selected items if unchecked
      }
    });

    this.displaySelectedItems(); // Update the UI or other components
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
    this.userProfiles = [];
    this.parItems = [];
    this.searchPARItems = [];
    this.selectedParItems = [];
    this.parItemKey = '';
    this.searchKey = '';

    this.parForm.reset({
      lgu: '',
      fund: '',
      parNo: '',
      userID1: '',
      userID2: '',
    });
    this.reparForm.reset({
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
      this.api.retrievePARITEMByQRCode(qr)
        .subscribe({
          next: (res) => {
            console.log('Retrieve PAR ITEMS', res);
            this.item = res[0];

            console.log('Show Items', this.item);

            this.onRetrievePAR(res[0].parNo);

          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Problem with Retreiving PAR', err);
            Swal.fire('Item not Found', `QR Code ${qr} not found in PAR`, 'info');
          }
        });
    }
  }

  onRetrievePAR(parNo: string) {
    this.api.retrievePAR(parNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PAR', res);
          this.par = res[0];

          Swal.fire({
            title: 'Item Found from PAR #' + parNo + "",
            text: 'Do you want to view the PAR?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewPAR(this.par);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving PAR', err);
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

  onTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue === 'Others';
    if (!this.isCustomType) {
      this.reparForm.get('type')?.setValue(selectedValue);
      this.reparForm.get('others')?.setValue('N/A');
    } else {
      // Wait for Angular to render the input field before focusing
      this.reparForm.get('type')?.markAsUntouched();
      this.reparForm.get('others')?.markAsTouched();
      this.reparForm.get('others')?.setValue(null);
    }
  }

  onPrintPAR(parNo: string) {

    this.api.retrievePAR(parNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PAR', res);
          const par = res[0];


          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res[0].receivedBy),
            this.printService.setIssuedBy(res[0].issuedBy)
          ] as Observable<any>[]).subscribe(() => {

            this.api.retrievePARItemByParNo(parNo!)
              .subscribe({
                next: (res) => {

                  this.logger.printLogs('i', 'Retrieving PAR Item', res);
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

                  <div class="watermark">PAR</div>

                  <div class="row">
                    <div class="col-12">
                      <p class="fs-6">LGU: <span class="fw-bold border-bottom ms-1">${par.lgu || 'Default N/A'}</span></p>
                    </div>
                    <div class="col-6">
                      <p class="fs-6">FUND: <span class="fw-bold border-bottom ms-1">${par.fund || 'Default N/A'}</span></p>
                    </div>
                    <div class="col-6">
                      <p class="text-end fs-6">PAR NO.: <span class="fw-bold border-bottom ms-1">${par.parNo || 'Default N/A'}</span></p>
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
                  this.printService.printReport('PAR', reportContent);

                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
                  Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
                }
              });

          });

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve PAR Item.', 'error');
          return;
        }
      });



  }
}

