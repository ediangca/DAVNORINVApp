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
import { when } from 'jquery';
import { ToastrService } from 'ngx-toastr';

// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-ics',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './ics.component.html',
  styleUrl: './ics.component.css'
})
export class IcsComponent implements OnInit, AfterViewInit {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  @ViewChild('othersInput') othersInput!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  icss: any = [];
  ics!: any;
  icsItems: ICSItem[] = [];
  selectedICSItems: ICSItem[] = []; // Array to track selected items from repar
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

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  ICSItemNo: number | null = null;

  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isITR: boolean = false;
  itrForm!: FormGroup;
  itr: any | null | undefined;
  searchPARItems: ICSItem[] = [];

  isNewItem: boolean = false;
  accID: string = "unknown";
  IIDKey: string | null = null;
  iid: string | null = null;
  brand: string = '';
  model: string = '';

  leave: any = null;

  // Pagination
  Math = Math;
  pageNumber = 1;
  pageSize = 20;
  totalItems = 0;

  isLoading: boolean = true;
  onItemFound: boolean = false;

  isOpen = false;

  today: string | undefined;

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

  canITR: boolean = false;

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

  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private vf: ValidateForm,
    private auth: AuthService, private cdr: ChangeDetectorRef,
    private printService: PrintService, private logger: LogsService,
    private toastr: ToastrService) {

    this.ngOnInit();

  }

  ngOnInit(): void {

    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.getUserAccount();
    this.checkPrivileges();
    this.today = new Date().toISOString().split('T')[0];

    this.icsForm = this.fb.group({
      icsNo: ['', Validators.required],
      entityName: ['', Validators.required],
      fund: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
    });

    this.itrForm = this.fb.group({
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
      qty: [1, [Validators.required, Validators.min(1)]],
      unit: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      eul: ['', [Validators.required, Validators.min(1)]],
      date_Acquired: [this.today, Validators.required],
    });

    this.getAllUserProfile();
    this.setupModalClose();
    // Check if action is defined and has the isReady property
    if (this.scannerAction && this.scannerAction.isReady) {
      this.scannerAction.isReady.subscribe((res: any) => {
        // Perform your actions when isReady emits a value
        // this.handle(this.action, 'start');
        this.logger.printLogs('i', 'Scanner is ready:', res);
      });
      this.logger.printLogs('i', 'Fetching User Account from Store Service', this.userAccount);
    } else {
      this.logger.printLogs('i', 'Scanner is not ready:', 'Action or isReady is not defined when ngOnInit is called.');
    }
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('ICS', 'create');
    this.canRetrieve = this.store.isAllowedAction('ICS', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('ICS', 'update');
    this.canDelete = this.store.isAllowedAction('ICS', 'delete');
    this.canPost = this.store.isAllowedAction('ICS', 'post');
    this.canUnpost = this.store.isAllowedAction('ICS', 'unpost');

    this.canITR = this.store.isAllowedAction('ITR', 'create');
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

  addModalHiddenListener(icsModal: boolean, modalId: string) {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('hidden.bs.modal', () =>
      icsModal && !this.isEditMode ? this.resetForm() : this.resetItemForm());
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

  getUserAccount() {
    this.store.getUserAccount()
      .subscribe({
        next: (res) => {
          this.userAccount = res;
          this.logger.printLogs('i', 'Fetching User Account from Store Service', this.userAccount);
          this.getAllICS();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllICS() {
    this.isLoading = true; // Start spinner
    this.api.getPaginatedICS(this.pageNumber, this.pageSize)
      .pipe(
        delay(2000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show ICSs only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated ICSs', res);

          if (this.userAccount.userGroupName === 'System Administrator') {
            this.totalItems = res.totalCount;
            return res.items; // For administrators, show all records, limited to 10
          }

          const filteredICSs = res.items.filter((ics: any) =>
            ics.createdBy === this.userAccount.userID ||
            ics.issuedBy === this.userAccount.userID ||
            ics.receivedBy === this.userAccount.userID
          );

          this.totalItems = filteredICSs.length;
          return filteredICSs; // Limit to the first 10 items
        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filteredICSs) => {
          this.icss = filteredICSs;
          this.logger.printLogs('i', 'List of ICSs', this.icss);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching ICSs', err);
        }
      });
  }

  changePage(page: number) {
    if (page < 1 || page > Math.ceil(this.totalItems / this.pageSize)) return;
    this.pageNumber = page;
    this.getAllICS();
  }

  onSearchICS() {
    if (!this.searchKey) {
      this.getAllICS(); // Call existing function to populate all ICSs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchICS(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter results based on `createdBy` and slice for pagination
              this.logger.printLogs('i', 'Show ICSs only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated ICSs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 20); // For administrators, show all records, limited to 10
              }
              // Filter or process the response if needed
              const filteredICSs = res.filter((ics: any) =>
                ics.createdBy === this.userAccount.userID ||
                ics.issuedBy === this.userAccount.userID ||
                ics.receivedBy === this.userAccount.userID
              );
              return filteredICSs.slice(0, 20); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filteredICSs) => {
              this.icss = filteredICSs; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH ICSs', this.icss);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching ICSs on Search', err);
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

  onAddICS() {
    this.resetForm();
    this.openModal(this.AddEditModal);
  }

  onAutoSuggest(): void {
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

    this.icsForm.patchValue({
      userID2: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }


  onAutoSuggestApproved() {
    this.approvedID = null;
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

  searchPARItem() {
    this.parItemKey = this.itrForm.value['searchPARItemKey'];
    this.logger.printLogs('i', 'ICS Item key: ', this.parItemKey);

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.icsItems = [...this.searchPARItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.icsItems = this.searchPARItems.filter(item => item.description!.toLowerCase().includes(searchKey));
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

    this.logger.printLogs('i', 'ICS ITEMS DESCRIPTION', [(!(this.IIDKey == '') ? this.IIDKey : '') + " " + (!(this.brand == '') ? this.brand : '') + " " + (!(this.model == '') ? this.model : '')]);

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
      this.onSearchICS();
    } else {
      this.onSearchICS();
    }
  }


  onAddICSItem() {
    const ICSNo: string = this.icsForm.value['icsNo'];
    if (!ICSNo) {
      Swal.fire('INFORMATION!', 'Please input ICS No. first before adding item', 'warning');
      return;
    }

    this.api.isICSExist(ICSNo).subscribe((exists: boolean) => {

      this.logger.printLogs('i', `ICS No ${ICSNo} Exist`, exists);
      if (!this.isEditMode && exists) {
        Swal.fire('INFORMATION!', 'ICS No. already exists!', 'warning');
        return;
      }

      this.resetItemForm();
      this.openModal(this.ItemModal);
    });


  }

  onSubmit() {

    if (!this.icsForm.valid) {
      this.vf.validateFormFields(this.icsForm);
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      return;
    }

    if (this.icsItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.icsForm.valid && this.icsItems.length > 0) {

      this.logger.printLogs('i', 'ICS Form', this.icsForm.value);

      this.ics = {
        icsNo: this.icsForm.value['icsNo'],
        entityName: this.icsForm.value['entityName'],
        fund: this.icsForm.value['fund'],
        receivedBy: this.receivedID,
        issuedBy: this.issuedID,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }
      this.currentEditId = this.ics.icsNo;

      if (this.isEditMode) {
        this.Update(this.ics)
      } else {
        this.Save(this.ics);
      }

    }

  }


  onSubmitITR() {

    if (!this.itrForm.valid) {
      this.vf.validateFormFields(this.itrForm);
      Swal.fire('Warning!', 'Please complete all required fields before proceeding!', 'warning');
      return;
    }

    if (this.selectedICSItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.itrForm.valid && this.icsItems.length > 0) {

      this.logger.printLogs('i', 'ITR Form', this.ics);
      this.Save(this.ics);

    }

  }

  Save(ics: any) {

    if (!this.isITR) {

      this.logger.printLogs('i', 'Saving ICSSSSSSSS', ics);
      this.api.createICS(ics, this.icsItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', ics);
            this.logger.printLogs('i', 'Saved Success', this.icsItems);

            this.api.showToast(res.message, 'Saved!', 'success');
            Swal.fire({
              title: 'Saved',
              text: 'Do you want to add new ICS?',
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
            this.getAllICS();

          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving ICS', err);
            Swal.fire('Saving Denied', err, 'warning');
            this.icsItems = [];
          }
        });

    } else {

      this.itr = {
        icsNo: ics.icsNo,
        ttype: this.itrForm.value['type'],
        otype: this.itrForm.value['others'],
        reason: this.itrForm.value['reason'],
        receivedBy: this.receivedID,
        issuedBy: ics.receivedBy,
        approvedBy: this.approvedID,
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

          this.api.createITR(this.itr, this.selectedICSItems)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Saved Success', res);
                Swal.fire('Saved', res.message, 'success');
                this.api.showToast(res.message, 'Saved!', 'success');
                this.logger.printLogs('i', 'Saved Success', res.details);

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving ITR', err);
                Swal.fire('Saving Denied', err, 'warning');
              }
            });
        }
      });
    }
  }


  Update(ics: any) {


    this.logger.printLogs('i', 'Updating ICS', ics);

    this.api.updateICS(this.currentEditId!, ics, this.icsItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', ics);
          Swal.fire('Updated!', res.message, 'success');
          this.api.showToast(res.message, 'Updated!', 'success');
          this.getAllICS();

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating ICS', err);
          Swal.fire('Updating Denied', err, 'warning');
        }
      });


  }

  onPostICS(ics: any) {

    if (!ics.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (ics.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !ics.postFlag) || this.roleNoFromToken == 'System Administrator' || (ics.postFlag && this.canUnpost) || (!ics.postFlag && this.canPost)) {
      let icsNo = ics.icsNo;

      Swal.fire({
        title: (ics.postFlag ? 'Unpost' : 'Post') + ` ICS #${icsNo}`,
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postICS(ics.icsNo, !ics.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllICS();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.api.showToast(res.message, (ics.postFlag ? 'Unposted' : 'Posted'), 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving ICS Item!']);
                Swal.fire('Denied!', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditICS(ics: any) {
    if (ics.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted ICS.', 'warning');
      return;
    }

    this.isEditMode = true;
    this.ics = ics;
    this.currentEditId = ics.icsNo;
    this.receivedID = ics.receivedBy
    this.issuedID = ics.issuedBy

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
      }
    }

    this.logger.printLogs('i', 'Restoring ICS', ics);

    this.icsForm.patchValue({
      entityName: ics.entityName,
      fund: ics.fund,
      icsNo: ics.icsNo,
      userID1: ics.received,
      userID2: ics.issued
    });

    this.api.retrieveICSItemByICSNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS Item', res);
          this.icsItems = res;
          this.openModal(this.AddEditModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
        }
      });


  }


  onViewICS(ics: any) {
    this.ics = ics;
    this.isITR = false;
    this.currentEditId = ics.icsNo;
    this.logger.printLogs('i', 'Viewing ICS', ics);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.itrForm.patchValue({
      entityName: ics.entityName,
      fund: ics.fund,
      icsNo: ics.icsNo,
      userID1: ics.receivedBy,
      userID2: ics.issuedBy,
    });

    if (this.ics.isReceivedActive) {
      this.api.retrieveLeave(this.ics.receivedBy)
        .subscribe({
          next: (res: any) => {
            this.logger.printLogs('i', 'Retrieve Leave', res);
            this.leave = res;
          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Fetching Leave Denied', err);
            this.leave = null;
          }
        });
    } else {
      this.leave = null;
    }

    this.api.retrieveICSItemByICSNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS Item', res);
          this.icsItems = res;
          this.searchPARItems = this.icsItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
          Swal.fire('Error', 'Failure to Retrieve ICS Item.', 'error');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

  }

  onITR(ics: any) {
    if (!ics.postFlag) {
      Swal.fire('Information!', 'Cannot ITR unposted ICS.', 'warning');
      return;
    }

    this.isITR = true;
    this.ics = ics;
    this.logger.printLogs('i', 'Restoring ICS', ics);

    this.itrForm.patchValue({
      userID1: '',
      userID2: ics.receivedBy,
      userID3: '',
      reason: '',
      type: '',
      others: 'N/A',
      searchPARItemKey: [''],
    });

    this.api.retrieveICSItemByICSNo(this.ics.icsNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS Item', res);
          this.icsItems = res.filter((item: any) => item.itrFlag === false);
          this.searchPARItems = this.icsItems;

          this.noOfParItems = this.icsItems.filter((group: any) => group.itrFlag === false).length;
          this.logger.printLogs('i', 'Number of ICS Item Retrieved', this.noOfParItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
          Swal.fire('Error', 'Failure to Retrieve ICS Item.', 'error');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(par: any) {

    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted ICS.', 'warning');
      return;
    }

    let icsNo = par.icsNo;
    Swal.fire({
      title: 'Remove ICS #' + icsNo + "",
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteICS(icsNo)
          .subscribe({
            next: (res) => {
              this.getAllICS();
              Swal.fire('Success', res.message, 'success');
              this.api.showToast(res.message, 'Deleted!', 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting ICS', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });

  }


  // ICS ITEM
  async onAddItem() {
    if (!this.itemForm.valid) {
      this.vf.validateFormFields(this.itemForm);
      Swal.fire('Information!', 'Please check all fields.', 'warning');
      return;
    }

    const ICSNo: string = this.icsForm.value['icsNo'];
    const IID: string = this.itemForm.value['iid'];
    const Brand: string = this.itemForm.value['brand'];
    const Model: string = this.itemForm.value['model'];
    const Description: string = this.itemForm.value['description'];
    const SerialNo: string = this.itemForm.value['serialNo'];
    const PropertyNo: string = this.itemForm.value['propertyNo'];
    const QRCode: string = this.itemForm.value['qrCode'];
    const Qty: number = this.itemForm.value['qty'];
    const Unit: string = this.itemForm.value['unit'];
    const Amount: number = this.itemForm.value['amount'];
    const Eul: number = this.itemForm.value['eul'];
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
        Swal.fire('Information!', 'Serial No. already exist!', 'warning');
        return;
      }

      if (await this.isExist(PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exist!', 'warning');
        return;
      }

      if (await this.isExist(QRCode)) {
        Swal.fire('Information!', 'QRCode already exist!', 'warning');
        return;
      }

      // IF EXIST FROM PAR ITEMS

      if (await this.isExistFromPAR(SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exist in PAR items!', 'warning');
        return;
      }

      if (await this.isExistFromPAR(PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exist in PAR items!', 'warning');
        return;
      }

      if (await this.isExistFromPAR(QRCode)) {
        Swal.fire('Information!', 'QRCode already exist in PAR items!', 'warning');
        return;
      }


      // icsItemNo, icsNo, iid, description, qty, unit, amount: number, itrFlag, ITRNo

      this.item = new ICSItem(null, ICSNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Qty, Unit, Amount, Date_Acquired, Eul, false, null);
      this.icsItems.push(this.item);
      this.logger.printLogs('i', 'PAR ITEMS', this.icsItems);
      this.resetItemForm();

      Swal.fire({
        title: 'Save',
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
      if (await this.isExistOnUpdate(this.ICSItemNo, SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exist!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.ICSItemNo, PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exist!', 'warning');
        return;
      }


      if (await this.isExistOnUpdate(this.ICSItemNo, QRCode)) {
        Swal.fire('Information!', 'QRCode already exist!', 'warning');
        return;
      }


      const index = this.icsItems.findIndex(i => i.description === this.item!.description);
      if (index !== -1) {
        this.icsItems[index] = new ICSItem(this.ICSItemNo, ICSNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Qty, Unit, Amount, Date_Acquired, Eul, false, null);

        Swal.fire('Success!', 'Item updated successfully!', 'success');
        this.resetItemForm();
        this.closeModal(this.ItemModal);
      }
    }
  }


  isListed(key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // this.icsItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key ).length > 0 ? resolve(true) : resolve(false);


      if (this.isEditItemMode) {
        this.icsItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 1 ? resolve(true) : resolve(false);
        // switch (field) {
        //   case "serial":
        //     this.icsItems.filter(items => items.serialNo === key).length > 1 ? resolve(true) : resolve(false);
        //     break;
        //   case "property":
        //     this.icsItems.filter(items => items.propertyNo === key).length > 1 ? resolve(true) : resolve(false);
        //     break;
        //   case "qr":
        //     this.icsItems.filter(items => items.qrCode === key).length > 1 ? resolve(true) : resolve(false);
        //     break;
        // }
      } else {
        // switch (field) {
        //   case "serial":
        //     this.icsItems.filter(items => items.serialNo === key).length > 0 ? resolve(true) : resolve(false);
        //     break;
        //   case "property":
        //     this.icsItems.filter(items => items.propertyNo === key).length > 0 ? resolve(true) : resolve(false);
        //     break;
        //   case "qr":
        //     this.icsItems.filter(items => items.qrCode === key).length > 0 ? resolve(true) : resolve(false);
        //     break;
        // }
        this.icsItems.filter(items => items.serialNo === key || items.propertyNo === key || items.qrCode === key).length > 0 ? resolve(true) : resolve(false);
      }
    });
  }

  isExist(key: string | null): Promise<boolean> {
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

  isExistFromPAR(key: string | null): Promise<boolean> {
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


  isExistOnUpdate(ICSItemNo: number | null, key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!ICSItemNo) {
        resolve(false); // Consider an item as existing in case of error.
        this.logger.printLogs('e', 'NO ICSItemNo', 'FOR UPDATE ITEM IN CREATING NEW ICS ITEM.');
        return
      }
      this.api.scanExistingUniqueICSItem(ICSItemNo!, key!)
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



  onEditItem(item: ICSItem) {
    this.isEditItemMode = true;
    this.item = item;
    this.ICSItemNo = item.icsItemNo;

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
            brand: item.brand,
            model: item.model,
            description: item.description,
            serialNo: item.serialNo,
            propertyNo: item.propertyNo,
            qrCode: item.qrCode,
            qty: item.qty,
            unit: item.unit,
            amount: item.amount,
            eul: item.eul,
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

  onViewItem(item: ICSItem) {
    this.item = item;
    this.ICSItemNo = item.icsItemNo;

    this.logger.printLogs('i', 'View Itemsssssssssss', [item]);

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

  onCopyItem(item: ICSItem) {
    this.logger.printLogs('i', 'Copy Item', [item]);

    this.resetItemForm();

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
            qty: item.qty,
            unit: item.unit,
            amount: item.amount,
            eul: item.eul
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

  onDeleteItem(item: ICSItem) {
    this.item = item;
    this.ICSItemNo = item.icsItemNo;

    Swal.fire({
      title: 'Remove Item ' + item.description + "",
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        // Execute delete Item where propertyNo matches to list
        if (this.ICSItemNo) {
          this.icsItems = this.icsItems.filter(items => items.propertyNo !== item.propertyNo);
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

    const index = this.selectedICSItems.indexOf(item);

    if (isChecked && index === -1) {
      // If checked and item is not in the list, add it
      this.selectedICSItems.push(item);
    } else if (!isChecked && index > -1) {
      // If unchecked and item is in the list, remove it
      this.selectedICSItems.splice(index, 1);
    }
    this.displaySelectedItems();
  }

  // Method to handle "Select All/Unselect All" functionality
  toggleAllSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked: boolean = input.checked;

    // Loop through all items
    this.icsItems.forEach(item => {
      item.itrFlag = isChecked; // Update reparFlag based on checkbox state
      const index = this.selectedICSItems.indexOf(item);

      if (isChecked && index === -1) {
        this.selectedICSItems.push(item); // Add to selected items if checked and not already in the list
      } else if (!isChecked && index > -1) {
        this.selectedICSItems.splice(index, 1); // Remove from selected items if unchecked
      }
    });

    this.displaySelectedItems(); // Update the UI or other components
  }

  // Optional function to get the currently selected items
  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected PAR Items', this.selectedICSItems!);
  }

  //Common Method - Advice to add in Helpers
  // private validateFormFields(fg: FormGroup) {
  //   Object.keys(fg.controls).forEach(field => {
  //     const control = fg.get(field)
  //     if (control instanceof FormControl) {
  //       control.markAsDirty({ onlySelf: true });
  //     } else if (control instanceof FormGroup) {
  //       this.validateFormFields(control);
  //     }
  //   })
  // }

  onTypeChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isCustomType = selectedValue === 'Others';
    if (!this.isCustomType) {
      this.itrForm.get('type')?.setValue(selectedValue);
      this.itrForm.get('others')?.setValue('N/A');
    } else {
      // Wait for Angular to render the input field before focusing
      this.itrForm.get('type')?.markAsUntouched();
      this.itrForm.get('others')?.markAsTouched();
      this.itrForm.get('others')?.setValue(null);
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.currentEditId = null;
    this.isModalOpen = false;
    this.isITR = false;
    this.item = null;
    this.isOpen = false;
    this.userProfiles = [];
    this.icsItems = [];
    this.searchPARItems = [];
    this.selectedICSItems = [];
    this.parItemKey = '';
    this.searchKey = '';

    this.icsForm.reset({
      entityName: '',
      fund: '',
      icsNo: '',
      userID1: '',
      userID2: '',
    });

    this.itrForm.reset({
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
    this.itemForm.reset({
      iid: '',
      description: '',
      qty: '1',
      unit: '',
      amount: '',
      eul: '',
    });
    // Clear related data
    this.IIDKey = null;
    this.iid = null;
    // this.item = null;
    this.items = [];
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
        (r: any) => this.logger.printLogs('i', fn, r),
        alert
      );
      this.cdr.detectChanges();     // Trigger change detection to update button state
    } else {
      scannerAction[fn]().subscribe((r: any) => this.logger.printLogs('i', fn, r), alert);
      this.cdr.detectChanges();     // Trigger change detection to update button state
    }
  }

  // Event handler when QR code is scanned
  public onEvent(results: ScannerQRCodeResult[], action?: any): void {
    this.onItemFound = false;
    if (results && results.length) {
      if (results) {
        action.pause(); // Pause scanning if needed
        this.logger.printLogs('i', 'Scanned Data:', results)
        this.logger.printLogs('i', 'QR value', results[0].value)

        this.qrCode = results[0].value
        this.validateQR(this.qrCode)
      }
    }
  }

  onEnter(): void {
    this.logger.printLogs('i', 'Enter key pressed. QR Value:', this.qrCode)

    // Add your logic here
    if (this.qrCode.trim() !== '') {
      // Example: Perform a search action
      this.logger.printLogs('i', 'Performing search for:', this.qrCode)
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
      this.api.retrieveicsITEMByQRCode(qr)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Retrieve ICS ITEMS', res)
            this.item = res[0];

            this.logger.printLogs('i', 'Show Items', this.item)

            this.onRetrieveICS(res[0].icsNo);

          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Problem with Retreiving ICS', err);
            Swal.fire('Item not Found', `QR Code ${qr} not found in ICS`, 'info');
          }
        });
    }
  }

  onRetrieveICS(icsNo: string) {
    this.api.retrieveICS(icsNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieve ICS', res)
          this.ics = res[0];

          Swal.fire({
            title: 'Item Found from ICS #' + icsNo + "",
            text: 'Do you want to view the ICS?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewICS(this.ics);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving ICS', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }


  resumeScanning(scannerAction: any): void {
    // Add any conditions or user prompts if needed before resuming

    scannerAction.play().subscribe(
      (r: any) =>
        this.logger.printLogs('i', 'Resuming Scan:', r),
      (error: any) =>
        this.logger.printLogs('w', 'Error while resuming scan:', error)
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


  onPrintICS(icsNo: string) {

    this.printService.setFooter('ICS');

    this.api.retrieveICS(icsNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS', res);
          const par = res[0];

          forkJoin([
            this.printService.setReceivedBy(res[0].receivedBy),
            this.printService.setIssuedBy(res[0].issuedBy),
          ] as Observable<any>[]).subscribe(() => {

            this.api.retrieveICSItemByICSNo(icsNo!)
              .subscribe({
                next: (res) => {

                  this.logger.printLogs('i', 'Retrieving ICS Item', res);
                  const icsItems = res;

                  // Ensure par.ICSItems is an array or default to an empty array
                  const items = Array.isArray(icsItems) ? icsItems : [];

                  // Create the table rows dynamically

                  const rows = items.map((item: any, index: number) => `
                  <tr ${item.qrCode ? `class="${item.qrCode}"` : ''}>
                    <td style="font-size: small;">${item.qty || '1'}</td>
                    <td style="font-size: small;">${item.unit || 'pcs'}</td>
                    <td style="font-size: small;">
                    ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style="font-size: small;">${((item?.qty || 0) * (item?.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="font-size: small;">${item.description || 'N/A'}</td>
                    <td style="font-size: small;">${item.propertyNo || index + 1 || item.icsNo || item.icsItemNo || item.iid || 'N/A'}</td>
                    <td style="font-size: small;">${item.eul + ' year(s)' || 'N/A'}</td>
                  </tr>
                `).join('');


                  // Generate the full report content
                  const reportContent = `

                  <div class="watermark">ICS</div>

                  <div class="row">
                    <div class="col-12">
                      <p class="fs-6">ENTITY NAME: <span class="fw-bold border-bottom ms-1">${par.entityName || 'Default N/A'}</span></p>
                    </div>
                    <div class="col-6">
                      <p class="fs-6">FUND CLUSTER: <span class="fw-bold border-bottom ms-1">${par.fund || 'Default N/A'}</span></p>
                    </div>
                    <div class="col-6">
                      <p class="text-end fs-6">ICS NO.: <span class="fw-bold border-bottom ms-1">${par.icsNo || 'Default N/A'}</span></p>
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
                                    <th class="text-center align-middle" style="font-size: small; "rowspan="2">PROPERTY NO</th>
                                    <th class="text-center align-middle" style="font-size: small; "rowspan="2">ESTIMATED <br> USEFUL LIFE</th>
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

                  this.printService.printReport('ICS', reportContent);

                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
                  Swal.fire('Error', 'Failure to Retrieve ICS Item.', 'error');
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

