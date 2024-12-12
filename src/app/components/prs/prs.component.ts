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
import { forkJoin, Observable } from 'rxjs';


// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-prs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './prs.component.html',
  styleUrl: './prs.component.css'
})
export class PrsComponent implements OnInit, AfterViewInit {

  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('ListItemModalForm') ListItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  // pars: any = [];
  par!: any;
  prs!: any;
  prss: any = [];
  parItems: Item[] = [];
  prsItems: Item[] = [];
  searchPRSItems: Item[] = [];
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


  // receivedBy: string = '';
  // issuedBy: string = '';
  // approvedBy: string = '';

  errorMessage: string = '';

  brands: any[] = [];
  models: any[] = [];
  descriptions: any[] = [];

  item: Item | null | undefined;
  itemName: string | null | undefined
  userAccount: any;
  userProfile: any;
  prsForm!: FormGroup;
  itemForm!: FormGroup;
  isEditMode: boolean = false;
  isEditItemMode: boolean = false;
  currentEditId: string | null = null;

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  parINo: number | null = null;
  propertyNo: string | null = null;

  typeOptions: string[] = ['Disposal', 'Repair', 'Return to Stock'];
  isCustomType = false;

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
  private logger: LogsService;

  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  fn: string = 'start';

  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth
      },
    },
  };

  constructor(private fb: FormBuilder, private api: ApiService, private store: StoreService, private vf: ValidateForm, private auth: AuthService, private cdr: ChangeDetectorRef,
    private printService: PrintService
  ) {
    this.logger = new LogsService();

    this.today = new Date().toISOString().split('T')[0];

    this.prsForm = this.fb.group({
      prsNo: ['', Validators.required],
      type: ['', Validators.required],
      others: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
      searchPRSItemKey: ['']
    });


    this.roleNoFromToken = this.auth.getRoleFromToken();
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.getAllPRS();
    this.getUserAccount();
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
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllPRS() {
    this.isLoading = true;

    setTimeout(() => {
      this.api.getAllPRS()
        .subscribe({
          next: (res) => {
            this.prss = res;
            this.logger.printLogs('i', 'LIST OF PRS', this.prss);
            this.isLoading = false;
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching PRS', err);
          }
        });

    }, 3000);
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

  onSearchPRS() {
    //Populate all User Groups
    if (!this.searchKey) {
      this.getAllPRS();
    } else {
      if (this.searchKey.trim()) {
        this.api.searchPRS(this.searchKey)
          .subscribe({
            next: (res) => {
              this.prss = res;
              this.logger.printLogs('i', 'SEARCH PRS', this.prss);
              this.prss = this.prss.slice(0, 10);
            },
            error: (err: any) => {
              console.log("Error Fetching PRS:", err);
            }
          });
      }
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchPRS();
    } else {
      this.onSearchPRS();
    }
  }

  // Function to display the QR Scanner modal
  onScanQR() {
    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();
  }

  onAddPRS() {
    this.isEditMode = false;
    this.prs = [];
    this.prsItems = [];
    this.searchPRSItems = [];
    this.openPARModal(this.AddEditModal);
  }

  onSubmit() {

    if (!this.prsForm.valid) {
      this.vf.validateFormFields(this.prsForm);
      return;
    }

    if (this.prsItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.prsForm.valid && this.prsItems.length > 0) {

      this.logger.printLogs('i', 'PRS Form', this.prsForm.value);

      this.prs = {
        prsNo: this.prsForm.value['prsNo'],
        rtype: this.prsForm.value['type'],
        otype: this.prsForm.value['others'],
        receivedBy: this.receivedID ? this.receivedID : null,
        issuedBy: this.issuedID ? this.issuedID : null,
        approvedBy: this.approvedID ? this.approvedID : null,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      this.logger.printLogs('i', this.isEditMode ? 'Updating...' : 'Saving...', this.prs);

      if (this.isEditMode) {
        this.Update()
      } else {
        this.Save();
      }

    }

  }

  Save() {
    this.logger.printLogs('i', 'Saving PRS', this.prs);
    this.logger.printLogs('i', 'Saving PRS Item', this.prsItems);
    this.api.createPRS(this.prs, this.prsItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', this.prs);
          // Handle success, e.g., show a success message
          Swal.fire({
            title: 'Saved',
            text: 'Do you want to add new PRS?',
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
          this.getAllPRS();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving PAR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  Update() {
    this.logger.printLogs('i', 'Updating PRS', this.prs);
    this.logger.printLogs('i', 'Updating PRS Items', this.prsItems);

    this.api.updatePRS(this.prs, this.prsItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', res);
          Swal.fire({
            title: 'Updated',
            text: res.message,
            icon: 'success',
            allowOutsideClick: false,
            allowEscapeKey: false
          });
          this.logger.printLogs('i', 'Saved Success', res.details);
          this.getAllPRS();
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
          this.getAllPRS();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR Item', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }

  onPostPRS(prs: any) {

    if ((this.roleNoFromToken != 'System Administrator' && !prs.postFlag) || this.roleNoFromToken == 'System Administrator') {
      let prsNo = prs.prsNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (prs.postFlag ? 'Unpost' : 'Post') + ` PRS #${prsNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postPRS(prsNo, !prs.postFlag)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.getAllPRS();
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Posting PRS!']);
                Swal.fire('Warning', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditPRS(prs: any) {
    if (prs.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted PRS.', 'warning');
      return;
    }

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance && modalInstance._isShown) {
        modalElement.addEventListener('hidden.bs.modal', () => {
          // Perform actions after the modal is fully closed
          this.handleEditPRSLogic(prs);
        }, { once: true });  // { once: true } ensures the listener fires only once

        this.closeModal(this.ViewModal);
      } else {
        // If the modal is not open, proceed immediately
        this.handleEditPRSLogic(prs);
      }
    } else {
      // If ViewModal is undefined, proceed with the logic
      this.handleEditPRSLogic(prs);
    }

    // this.isEditMode = true;
    // this.prs = prs;
    // this.currentEditId = prs.prsNo;

    // this.logger.printLogs('i', 'Restoring PRS', prs);

    // this.issuedID = prs.issuedBy;
    // this.receivedID = prs.receivedBy;
    // this.approvedID = prs.approvedBy;

    // this.prsForm.patchValue({
    //   prsNo: prs.prsNo,
    //   type: prs.rtype,
    //   others: prs.otype,
    //   userID3: prs.approved,
    //   userID1: prs.received,
    //   userID2: prs.issued,
    // });

    // this.api.retrievePRS(this.currentEditId!)
    //   .subscribe({
    //     next: (res) => {
    //       this.logger.printLogs('i', 'Retrieving PRS Item', res);
    //       this.prs = res.details;
    //       this.prsItems = res.prsItems;
    //       this.openPARModal(this.AddEditModal); // Open the modal after patching
    //     },
    //     error: (err: any) => {
    //       this.logger.printLogs('e', 'Error Retreiving PRS Item', err);
    //       Swal.fire('Error', 'Failure to Retrieve REPAR Item.', 'error');
    //     }
    //   });


  }

  handleEditPRSLogic(prs: any) {
    this.isEditMode = true;
    this.prs = prs;
    this.currentEditId = prs.prsNo;

    this.logger.printLogs('i', 'Restoring PRS', prs);

    this.issuedID = prs.issuedBy;
    this.receivedID = prs.receivedBy;
    this.approvedID = prs.approvedBy;

    this.prsForm.patchValue({
      prsNo: prs.prsNo,
      type: prs.rtype,
      others: prs.otype,
      userID3: prs.approved,
      userID1: prs.received,
      userID2: prs.issued,
    });

    this.api.retrievePRS(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PRS Item.....', res);
          this.prs = res.details;
          this.prsItems = res.prsItems;
          this.openPARModal(this.AddEditModal);  // Open modal after ensuring the other one closed
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retrieving PRS Item', err);
          Swal.fire('Error', 'Failure to Retrieve REPAR Item.', 'error');
        }
      });
  }


  onViewPRS(prs: any) {
    this.prs = prs;
    this.currentEditId = prs.prsNo;
    this.logger.printLogs('i', 'Viewing PRS', prs);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.issuedID = prs.issuedBy;
    this.receivedID = prs.receivedBy;
    this.approvedID = prs.approvedBy;

    this.prsForm.patchValue({
      prsNo: prs.prsNo,
      type: prs.rtype,
      others: prs.otype,
      userID3: prs.approvedBy,
      userID1: prs.receivedBy,
      userID2: prs.issuedBy,
    });

    this.api.retrievePRS(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PRS', res);
          this.prs = res.details;
          this.prsItems = res.prsItems;
          this.searchPRSItems = this.prsItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PRS Item', err);
          Swal.fire('Error', 'Failure to Retrieve PRS Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(prs: any) {

    if (prs.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted PRS.', 'warning');
      return;
    }

    let prsNo = prs.prsNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove PRS #' + prsNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deletePRS(prsNo)
          .subscribe({
            next: (res) => {
              this.getAllPRS();
              Swal.fire('Success', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting PRS', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });

  }

  onAddPARItem() {
    const PRSNo: string = this.prsForm.value['prsNo'];
    if (!PRSNo) {
      Swal.fire('INFORMATION!', 'Please input PRS No. first before adding item', 'warning');
      return;
    }
    this.api.getAllPARItem()
      .subscribe({
        next: (res) => {
          this.parItems = res;

          this.parItems = this.parItems.filter(
            item => !this.prsItems.some(prsItem => prsItem.parino === item.parino) &&
              item.prsFlag === false
          );
          this.logger.printLogs('i', 'LIST OF ACTIVE PAR ITEM ', this.parItems);
          this.logger.printLogs('i', 'LIST OF ACTIVE PRS ITEM ', this.prsItems);

          this.parItems.length < 1 ? Swal.fire('Information', 'No Items can be return.', 'info') : this.openItemModal(this.ListItemModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Groups', err);
        }
      });

  }


  // PRS ITEM
  onAddItem(item: Item) {
    this.logger.printLogs('i', 'ADD ITEMS', this.parItems);

    Swal.fire({
      title: 'Confirm',
      text: 'Do you want to PRS the selected Item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then(result => {
      if (result.isConfirmed) {
        item.prsFlag = true;
        item.prsNo = this.prsForm.value['prsNo'];
        this.prsItems.push(item);

        this.logger.printLogs('i', 'TO UPDATE PRS ITEMS', this.prsItems);

        this.parItems = this.parItems.filter(item => item.prsFlag === false);

        this.parItems.length < 1 ? this.closeModal(this.ListItemModal) : '';

        this.logger.printLogs('i', 'UPDATED PAR ITEMS', this.parItems);


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

    this.prsForm.patchValue({
      userID2: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
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
              if (res.length == 1 && res[0].fullName == this.issuedByID) {
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
    this.issuedID = userProfile.userID;

    this.logger.printLogs('i', 'Selected to Received', userProfile);

    this.prsForm.patchValue({
      userID1: userProfile.fullName  // Patch the selected IID to the form
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
              if (res.length == 1 && res[0].fullName == this.issuedByID) {
                this.selectApproved(res[0]);
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
    this.issuedID = userProfile.userID;

    this.logger.printLogs('i', 'Selected to Approved', userProfile);

    this.prsForm.patchValue({
      userID3: userProfile.fullName  // Patch the selected IID to the form
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }

  onAutoSuggest(actionType: 'issued' | 'received' | 'approved') {

    const searchValue = {
      issued: this.issuedByID,
      received: this.receivedByID,
      approved: this.approvedByID
    }[actionType];

    if (!searchValue) {
      this.userProfiles = [];
      return;
    }

    this.activeInput = actionType;
    if (searchValue.trim()) {
      this.api.searchProfile(searchValue)
        .subscribe({
          next: (res) => {
            if (res.length === 1 && res[0].fullName === searchValue) {
              this.selectProfile(actionType, res[0]);
              this.logger.printLogs('i', `Fetch Specific ${actionType} By`, res[0]);
            } else {
              this.userProfiles = res.slice(0, 5);
              this.logger.printLogs('i', `Fetching ${actionType} By`, res);
            }
          },
          error: (err: any) => {
            this.logger.printLogs('e', `Error Fetching ${actionType} By`, err);
          }
        });
    }
  }

  selectProfile(actionType: 'issued' | 'received' | 'approved', userProfile: any): void {
    const formPatchMap = {
      issued: 'userID2',
      received: 'userID1',
      approved: 'userID3'
    };

    this[`${actionType}ID`] = userProfile.userID;

    this.logger.printLogs('i', `Selected to ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`, userProfile);

    this.prsForm.patchValue({
      [formPatchMap[actionType]]: userProfile.fullName
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }


  searchPRSItem() {
    this.parItemKey = this.prsForm.value['searchPRSItemKey'];

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.prsItems = [...this.searchPRSItems];  // Reset to full list
    } else {
      console.log(this.parItemKey);
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.prsItems = this.searchPRSItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
        item.brand!.toLowerCase().includes(searchKey) ||
        item.model!.toLowerCase().includes(searchKey) ||
        item.serialNo!.toLowerCase().includes(searchKey) ||
        item.propertyNo!.toLowerCase().includes(searchKey) ||
        item.qrCode!.toLowerCase().includes(searchKey)
      );
    }
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
                  this.logger.printLogs('i', 'Retreived REPAR No: ' + item.reparNo!, this.repar);
                  this.openItemModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving REPAR', err);
                  Swal.fire('Denied', err, 'warning');
                }
              });
          } else {
            this.api.retrievePAR(item.parNo!)
              .subscribe({
                next: (res) => {
                  this.par = res[0];
                  this.logger.printLogs('i', 'Retreived PAR No: ' + item.parNo!, this.par);
                  this.openItemModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving PAR', err);
                  Swal.fire('Denied', err, 'warning');
                }
              });
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
          this.prsItems = this.prsItems.filter(items => items.propertyNo !== this.propertyNo);
          this.logger.printLogs('i', 'Execute delete Item where propertyNo matches to list', this.prsItems);
          Swal.fire('Remove!', 'Item has been removed.', 'success');
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
    console.log('Resetting Form...');
    this.isEditMode = false;
    this.currentEditId = null;
    this.prs = null;
    this.isModalOpen = false;
    this.item = null;
    this.isOpen = false;
    this.parItems = [];
    this.prsItems = [];
    this.selectedParItems = [];
    this.parItemKey = '';
    this.searchKey = '';
    this.issuedID = null;
    this.receivedID = null;
    this.approvedID = null;
    this.prsForm.reset({
      type: '',
      userID1: '',
      userID2: '',
      userID3: ''
    });
    // this.getAllPRS();
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


        this.api.retrievePARITEMByQRCode(results[0].value)
          .subscribe({
            next: (res) => {
              console.log('Retrieve PRS ITEMS', res);
              this.item = res[0];

              console.log('Show Items', this.item);

              this.onRetrievePRS(res[0].prsNo);

            },
            error: (err: any) => {
              this.logger.printLogs('w', 'Problem with Retreiving PRS', err);
              Swal.fire('Item not Found', `QR Code ${results[0].value} not found in PRS`, 'info');
            }
          });

      }

    }
  }

  onRetrievePRS(prsNo: string) {
    this.api.retrievePRS(prsNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PRS', res);
          this.prs = res.details;

          Swal.fire({
            title: 'Do you want to view the PRS Details?',
            text: 'Item Found from  PRS #' + this.prs.prsNo,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewPRS(this.prs);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving PRS', err);
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
    this.isCustomType = selectedValue == 'Others';
    if (!this.isCustomType) {
      this.prsForm.get('type')?.setValue(selectedValue);
      this.prsForm?.get('others')?.setValue('N/A');
    } else {
      this.prsForm?.get('others')?.setValue(null);
      this.prsForm.get('type')?.markAsUntouched();
      this.prsForm.get('others')?.markAsTouched();
    }
  }

  onPrintREPAR(prsNo: string) {

    this.api.retrievePRS(prsNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving PRS', res);
          this.prs = res.details;
          this.prsItems = res.prsItems;

          this.printService.setModel(this.prs);

          // Ensure par.parItems is an array or default to an empty array
          const items = Array.isArray(this.prsItems) ? this.prsItems : [];
          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy)
          ] as Observable<any>[]).subscribe(() => {
            // Once both services complete, continue with the report generation

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

          <div class="watermark">PRS</div>

          <div class="row">
            <div class="col-12">
              <p class="fs-6">Name of Local Government Unit: <span class="fw-bold border-bottom ms-1">PROVINCIAL GOVERNMENT OF DAVAO DEL NORTE</span></p>
            </div>
            <div class="col-6">
              <p class="fs-6">Purpose: <span class="fw-bold border-bottom ms-1">
              ${(((this.prs.rtype + '').toString().toLowerCase() == "others") ? this.prs.rtype + ' - ' + this.prs.otype : this.prs.rtype) || 'N/A'}
              </span></p>
            </div>
            <div class="col-6">
              <p class="fs-6 text-end">PTR No.: <span class="fw-bold border-bottom ms-1">${this.prs.prsNo || 'Default PTR No.'}</span></p>
            </div>
          </div>

          <div class="row">
          <div class="col">
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
            </table>

            </div>
            </div>
            `;

            // Print the report
            this.printService.printReport('PRS', reportContent);

          });
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PRS Item', err);
          Swal.fire('Error', 'Failure to Retrieve PRS Item.', 'error');
          return;
        }
      });



  }


}

