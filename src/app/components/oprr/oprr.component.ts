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
import { catchError, delay, finalize, forkJoin, map, Observable, of } from 'rxjs';


// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-oprr',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './oprr.component.html',
  styleUrl: './oprr.component.css',
})
export class OprrComponent implements OnInit, AfterViewInit {

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
  oprr!: any;
  oprrs: any = [];
  totalItems: number = 0;
  oprItems: any[] = [];
  oprrItems: any[] = [];
  searchOPRRItems: any[] = [];
  selectedOPRItems: any[] = []; // Array to track selected items from repar
  userProfiles: any = [];
  items: any = [];
  searchKey: string = '';
  parItemKey: string = '';

  activeOPRItemKey: string = ''

  activeInput: 'received' | 'issued' | 'approved' | null = null;
  receivedByID: string | null = null;
  issuedByID: string | null = null;
  approvedByID: string | null = null;
  receivedID: string | null = null;
  issuedID: string | null = null;
  approvedID: string | null = null;

  errorMessage: string = '';

  brands: any[] = [];
  models: any[] = [];
  descriptions: any[] = [];

  item: any | null | undefined;
  itemName: string | null | undefined
  userAccount: any;
  userProfile: any;
  oprrForm!: FormGroup;
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
    private printService: PrintService, private logger: LogsService) {

    this.ngOnInit();
  }

  ngOnInit(): void {
    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.getUserAccount();
    this.checkPrivileges();
    this.today = new Date().toISOString().split('T')[0];

    this.oprrForm = this.fb.group({
      type: ['', Validators.required],
      others: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
      searchOPRRItemKey: ['']
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
    this.canCreate = this.store.isAllowedAction('OPRR', 'create');
    this.canRetrieve = this.store.isAllowedAction('OPRR', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('OPRR', 'update');
    this.canDelete = this.store.isAllowedAction('OPRR', 'delete');
    this.canPost = this.store.isAllowedAction('OPRR', 'post');
    this.canUnpost = this.store.isAllowedAction('OPRR', 'unpost');
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
          this.getAllOPRR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllOPRR() {
    this.isLoading = true;
    this.api.getAllOPRR()
      .pipe(
        delay(3000),
        map((res) => {
          this.logger.printLogs('i', 'Show OPRRS only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated OPRR', res);
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 10);
          }
          const filtered = res.filter((item: any) =>
            item.createdBy === this.userAccount.userID ||
            item.issuedBy === this.userAccount.userID ||
            item.receivedBy === this.userAccount.userID
          );
          this.totalItems = filtered.length;
          return filtered.slice(0, 10);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (filtered) => {
          this.oprrs = filtered;
          this.logger.printLogs('i', 'List of OPRR', this.oprrs);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching OPRR', err);
        }
      });
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

  onSearchOPRR() {
    if (!this.searchKey) {
      this.getAllOPRR(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchOPRR(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter results based on `createdBy` and slice for pagination
              this.logger.printLogs('i', 'Show OPRR only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated OPRR', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 10); // For administrators, show all records, limited to 10
              }
              // Filter or process the response if needed
              const filtered = res.filter((item: any) =>
                item.createdBy === this.userAccount.userID ||
                item.issuedBy === this.userAccount.userID ||
                item.receivedBy === this.userAccount.userID
              );
              this.totalItems = filtered.length;
              return filtered.slice(0, 10); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filtered) => {
              this.oprrs = filtered; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH OPRR', this.oprrs);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching OPRR on Search', err);
            }
          });
      }
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    this.onSearchOPRR();
  }

  onSearchActiveOPRItem() {
    if (!this.activeOPRItemKey) {
      this.getAllPostedOPRItem(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.activeOPRItemKey.trim()) {
        this.api.searchAllPostedOPRItem(this.activeOPRItemKey.trim()) // Trim search key to avoid leading/trailing spaces
          .subscribe({
            next: (res) => {

              this.logger.printLogs('i', `LIST OF ACTIVE OPR ITEM KEY ${this.activeOPRItemKey.trim()}`, res);
              this.oprItems = res

              this.oprItems = this.oprItems.filter(
                item => !this.oprrItems.some(oprrItem => oprrItem.oprino === item.oprino) &&
                  item.oprrFlag === false).slice(0, 10);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching SEARCH ACTIVE OPR ITEM', err);
            }
          });

      }
    }
  }

  getAllPostedOPRItem() {
    this.api.getAllPostedOPRItem()
      .subscribe({
        next: (res) => {
          this.oprItems = res;

          this.logger.printLogs('i', 'LIST OF ACTIVE OPR ITEM ', this.oprItems);

          this.oprItems = this.oprItems.filter(
            item => !this.oprrItems.some(oprrItems => oprrItems.oprino === item.oprino) &&
              item.oprrFlag === false
          ).slice(0, 10);

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching ACTIVE OPR ITEM ', err);
        }
      });
  }

  onKeyUpPARItem(event: KeyboardEvent): void {
    this.onSearchActiveOPRItem();
  }

  // Function to display the QR Scanner modal
  onScanQR() {
    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();
  }

  onAddOPRR() {
    this.resetForm()
    this.openPARModal(this.AddEditModal);
  }

  onSubmit() {

    if (!this.oprrForm.valid) {
      this.vf.validateFormFields(this.oprrForm);
      return;
    }

    if (this.oprrItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.oprrForm.valid && this.oprrItems.length > 0) {

      this.logger.printLogs('i', 'OPRR Form', this.oprrForm.value);

      this.oprr = {
        rtype: this.oprrForm.value['type'],
        otype: this.oprrForm.value['others'],
        receivedBy: this.receivedID ? this.receivedID : null,
        issuedBy: this.issuedID ? this.issuedID : null,
        approvedBy: this.approvedID ? this.approvedID : null,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      this.logger.printLogs('i', this.isEditMode ? 'Updating...' : 'Saving...', this.oprr);

      if (this.isEditMode) {
        this.Update()
      } else {
        this.Save();
      }

    }

  }

  Save() {
    this.logger.printLogs('i', 'Saving OPRR', this.oprr);
    this.logger.printLogs('i', 'Saving OPRR Item', this.oprrItems);
    this.api.createOPRR(this.oprr, this.oprrItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', this.oprr);
          // Handle success, e.g., show a success message
          Swal.fire({
            title: 'Saved',
            text: 'Do you want to add new OPRR?',
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
          this.getAllOPRR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving OPRR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
  }

  Update() {
    this.logger.printLogs('i', 'Updating OPRR', this.oprr);
    this.logger.printLogs('i', 'Updating OPRR Items', this.oprrItems);

    this.api.updateOPRR(this.oprr, this.oprrItems)
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
          this.getAllOPRR();
          this.closeModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving REPAR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }


  updateOPRItems() {
    this.api.updatePARItem(this.currentEditId!, this.oprItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.oprItems);
          Swal.fire('Updated!', res.message, 'warning');
          this.getAllOPRR();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating OPR Item', err);
          Swal.fire('Denied', err, 'warning');
        }
      });

  }

  onPostOPRR(oprr: any) {

    if (!oprr.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (oprr.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }

    if ((this.roleNoFromToken != 'System Administrator' && !oprr.postFlag) || this.roleNoFromToken == 'System Administrator' || (oprr.postFlag && this.canUnpost) || (!oprr.postFlag && this.canPost)) {
      let oprrNo = oprr.oprrNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (oprr.postFlag ? 'Unpost' : 'Post') + ` OPRR #${oprrNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postOPRR(oprrNo, !oprr.postFlag)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.getAllOPRR();
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Posting OPRR!']);
                Swal.fire('Warning', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditOPRR(oprr: any) {
    if (oprr.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted OPRR.', 'warning');
      return;
    }

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance && modalInstance._isShown) {
        modalElement.addEventListener('hidden.bs.modal', () => {
          // Perform actions after the modal is fully closed
          this.handleEditLogic(oprr);
        }, { once: true });  // { once: true } ensures the listener fires only once

        this.closeModal(this.ViewModal);
      } else {
        // If the modal is not open, proceed immediately
        this.handleEditLogic(oprr);
      }
    } else {
      // If ViewModal is undefined, proceed with the logic
      this.handleEditLogic(oprr);
    }
  }

  handleEditLogic(oprr: any) {
    this.isEditMode = true;
    this.oprr = oprr;
    this.currentEditId = oprr.oprrNo;

    this.logger.printLogs('i', 'Restoring OPRR', oprr);

    this.issuedID = oprr.issuedBy;
    this.receivedID = oprr.receivedBy;
    this.approvedID = oprr.approvedBy;

    this.oprrForm.patchValue({
      type: oprr.rtype,
      others: oprr.otype,
      userID3: oprr.approved,
      userID1: oprr.received,
      userID2: oprr.issued,
    });

    this.api.retrieveOPRR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPRR Item.....', res);
          this.oprr = res.details;
          this.oprrItems = res.oprrItems;
          this.openPARModal(this.AddEditModal);  // Open modal after ensuring the other one closed
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retrieving OPRR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPRR Item.', 'error');
        }
      });
  }


  onViewOPRR(oprr: any) {
    this.oprr = oprr;
    this.currentEditId = oprr.oprrNo;
    this.logger.printLogs('i', 'Viewing OPRR', oprr);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.issuedID = oprr.issuedBy;
    this.receivedID = oprr.receivedBy;
    this.approvedID = oprr.approvedBy;

    this.oprrForm.patchValue({
      type: oprr.rtype,
      others: oprr.otype,
      userID3: oprr.approvedBy,
      userID1: oprr.receivedBy,
      userID2: oprr.issuedBy,
    });

    this.api.retrieveOPRR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPRR', res);
          this.oprr = res.details;
          this.oprrItems = res.oprrItems;
          this.searchOPRRItems = this.oprrItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPRR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPRR Item.', 'error');
        }
      });

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(oprr: any) {

    if (oprr.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted OPRR.', 'warning');
      return;
    }

    let oprrNo = oprr.oprrNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove OPRR #' + oprrNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteOPRR(oprrNo)
          .subscribe({
            next: (res) => {
              this.getAllOPRR();
              Swal.fire('Success', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting OPRR', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });

  }

  onAddPARItem() {

    this.api.getAllPostedOPRItem()
      .subscribe({
        next: (res) => {
          this.oprItems = res;

          this.logger.printLogs('i', 'LIST OF ACTIVE OPR ITEM ', this.oprItems);

          this.oprItems = this.oprItems.filter(
            item => !this.oprrItems.some(oprrItems => oprrItems.oprino === item.oprino) &&
              item.oprrFlag === false
          );
          this.logger.printLogs('i', 'LIST OF ACTIVE OPR ITEM ', this.oprItems);
          this.logger.printLogs('i', 'LIST OF ACTIVE OPRR ITEM ', this.oprrItems);

          this.oprItems.length < 1 ? Swal.fire('Information', 'No Items can be return.', 'info') : this.openItemModal(this.ListItemModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Posted OPR', err);
        }
      });

  }


  // OPRR ITEM
  onAddItem(item: any) {
    this.logger.printLogs('i', 'ADD ITEMS', this.oprItems);

    Swal.fire({
      title: 'Confirm',
      text: 'Do you want to OPRR the selected Item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then(result => {
      if (result.isConfirmed) {

        item.oprrFlag = true;
        this.oprrItems.push(item);

        this.logger.printLogs('i', 'TO UPDATE OPRR ITEMS', this.oprrItems);

        this.oprItems = this.oprItems.filter(item => item.oprrFlag === false);

        this.oprItems.length < 1 ? this.closeModal(this.ListItemModal) : '';

        this.logger.printLogs('i', 'UPDATED OPR ITEMS', this.oprItems);


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

    this.oprrForm.patchValue({
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

    this.oprrForm.patchValue({
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

    this.oprrForm.patchValue({
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

    this.oprrForm.patchValue({
      [formPatchMap[actionType]]: userProfile.fullName
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }


  searchOPRRItem() {
    this.parItemKey = this.oprrForm.value['searchOPRRItemKey'];

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.oprrItems = [...this.oprrItems];  // Reset to full list
    } else {
      console.log(this.parItemKey);
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.oprrItems = this.searchOPRRItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
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
        if (this.propertyNo) {
          this.oprrItems = this.oprrItems.filter(oprrItems => oprrItems.propertyNo !== this.propertyNo);
          this.logger.printLogs('i', 'Execute delete Item where propertyNo matches to list', this.oprrItems);
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

    const index = this.selectedOPRItems.indexOf(item);

    if (isChecked && index === -1) {
      this.selectedOPRItems.push(item);
    } else if (!isChecked && index > -1) {
      this.selectedOPRItems.splice(index, 1);
    }
    this.displaySelectedItems();
  }


  displaySelectedItems() {
    this.logger.printLogs('i', 'List of selected OPR Items', this.selectedOPRItems!);
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
    this.oprr = null;
    this.isModalOpen = false;
    this.item = null;
    this.isOpen = false;
    this.oprItems = [];
    this.oprrItems = [];
    this.selectedOPRItems = [];
    this.parItemKey = '';
    this.searchKey = '';
    this.issuedID = null;
    this.receivedID = null;
    this.approvedID = null;
    this.oprrForm.reset({
      type: '',
      userID1: '',
      userID2: '',
      userID3: ''
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
  }

  resetQRScanForm(action: any, fn: string) {
    this.onCloseQRScanning(this.scannerAction)
  }

  public handle(scannerAction: any, fn: string): void {
    this.scannerAction = scannerAction;
    this.fn = fn;
    this.onScanQR();

    const playDeviceFacingBack = (devices: any[]) => {
      const device = devices.find(f => /back|rear|environment/gi.test(f.label));
      scannerAction.playDevice(device ? device.deviceId : devices[0].deviceId);
    };


    if (fn === 'start') {
      scannerAction[fn](playDeviceFacingBack).subscribe(
        (r: any) => console.log(fn, r),
        alert
      );
      this.cdr.detectChanges();
    } else {
      scannerAction[fn]().subscribe((r: any) => console.log(fn, r), alert);
      this.cdr.detectChanges();
    }
  }


  public onEvent(results: ScannerQRCodeResult[], action?: any): void {
    this.onItemFound = false;
    if (results && results.length) {
      if (results) {
        action.pause();

        console.log('QR value', results[0].value);
        console.log('Scanned Data:', results);

        this.qrCode = results[0].value
        this.validateQR(this.qrCode)

      }

    }
  }

  onEnter(): void {
    console.log('Enter key pressed. QR Value:', this.qrCode);


    if (this.qrCode.trim() !== '') {
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

          this.onRetrieveOPRR(res[0].oprrNo);

        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving OPRR', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found in OPRR`, 'info');
        }
      });

  }

  onRetrieveOPRR(oprrNo: string) {
    this.api.retrieveOPRR(oprrNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve OPRR', res);
          this.oprr = res.details;

          Swal.fire({
            title: 'Do you want to view the OPRR Details?',
            text: 'Item Found from  OPRR #' + oprrNo,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewOPRR(this.oprr);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving OPRR', err);
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
      this.oprrForm.get('type')?.setValue(selectedValue);
      this.oprrForm?.get('others')?.setValue('N/A');
    } else {
      this.oprrForm?.get('others')?.setValue(null);
      this.oprrForm.get('type')?.markAsUntouched();
      this.oprrForm.get('others')?.markAsTouched();
    }
  }

  onPrint(oprrNo: string) {

    const referenceModel: any | null = null;

    this.api.retrieveOPRR(oprrNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving OPRR', res);
          this.oprr = res.details;
          this.oprrItems = res.oprrItems;

          this.printService.setModel(this.oprr);

          // Ensure par.parItems is an array or default to an empty array
          const items = Array.isArray(this.oprrItems) ? this.oprrItems : [];
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy),
            ...items.map(item =>
              this.getModel(item.reparFlag ? item.reparNo : item.parNo, item.reparFlag ? 'PTR' : 'PAR')
            )
          ]).subscribe((responses: any[]) => {
            const [setReceivedBy, setIssuedBy, setApprovedBy, ...models] = responses;

            // Generate rows with fetched data
            const rows = items.map((item: any, index: number) => `
              <tr ${item.qrCode ? `class="${item.qrCode} item-row"` : ''}>
                <td>${item.qty || 1}</td>
                <td>${item.unit || 'pcs'}</td>
                <td>${item.description || 'N/A'}</td>
                <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                <td>${item.propertyNo || 'N/A'}</td>
                <td>${item.iid || 'N/A'}</td>
                <td>${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${((item.qty || 1) * (item.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${models[index].toString().toUpperCase()}</td>
              </tr>
            `).join('');

            // Generate report content
            const reportContent = `
              <div class="watermark">OPRR</div>
              <div class="row">
                <div class="col-12">
                  <p class="fs-6">Name of Local Government Unit: <span class="fw-bold border-bottom ms-1">PROVINCIAL GOVERNMENT OF DAVAO DEL NORTE</span></p>
                </div>
                <div class="col-6">
                  <p class="fs-6">Purpose: <span class="fw-bold border-bottom ms-1">
                    ${(((this.oprr.rtype + '').toLowerCase() === "others") ? this.oprr.rtype + ' - ' + this.oprr.otype : this.oprr.rtype) || 'N/A'}
                  </span></p>
                </div>
                <div class="col-6">
                  <p class="fs-6 text-end">OPRR No.: <span class="fw-bold border-bottom ms-1">${this.oprr.oprrNo || 'Default OPRR No.'}</span></p>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr class="item-row">
                        <th class='text-center'>QTY</th>
                        <th class='text-center'>UNIT</th>
                        <th class='text-center'>DESCRIPTION</th>
                        <th class='text-center'>DATE ACQUIRED/PURCHASE</th>
                        <th class='text-center'>PROPERTY NUMBER</th>
                        <th class='text-center'>CLASS NUMBER</th>
                        <th class='text-center'>UNIT VALUE</th>
                        <th class='text-center'>TOTAL VALUE</th>
                        <th class='text-center'>ISSUED TO</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              </div>
            `;

            // Print the report
            this.printService.printReport('OPRR', reportContent);
          });

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving OPR Item', err);
          Swal.fire('Error', 'Failure to Retrieve OPR Item.', 'error');
          return;
        }
      });
  }

  getModel(idNo: any, table: string): Observable<string> {
    if (table === 'PTR') {
      return this.api.retrieveREPAR(idNo).pipe(
        map((res: any) => res.details.received || 'N/A'),
        catchError((err: any) => {
          this.logger.printLogs('w', 'Problem Retrieving PTR', err);
          return of('N/A'); // Return default value on error
        })
      );
    } else if (table === 'PAR') {
      return this.api.retrievePAR(idNo).pipe(
        map((res: any[]) => (res[0]?.received || 'N/A')),
        catchError((err: any) => {
          this.logger.printLogs('w', 'Problem Retrieving PAR', err);
          Swal.fire('Denied', err, 'warning');
          return of('N/A');
        })
      );
    }
    return of('N/A'); // Default value for invalid table input
  }


}


