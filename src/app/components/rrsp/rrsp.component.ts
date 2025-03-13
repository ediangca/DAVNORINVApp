import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxScannerQrcodeModule, LOAD_WASM, ScannerQRCodeConfig, ScannerQRCodeResult, NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';

import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { LogsService } from '../../services/logs.service';
import { StoreService } from '../../services/store.service';
import { ICSItem } from '../../models/ICSItem';
import ValidateForm from '../../helpers/validateForm';
import { AuthService } from '../../services/auth.service';

import { PrintService } from '../../services/print.service';
import { catchError, delay, finalize, forkJoin, map, Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-rrsp',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './rrsp.component.html',
  styleUrl: './rrsp.component.css'
})
export class RrspComponent {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;
  @ViewChild('ListItemModalForm') ListItemModal!: ElementRef;
  @ViewChild('QRScannerForm') QRScannerModal!: ElementRef;

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  ics!: any;
  rrsep!: any;
  rrseps: any = [];
  totalItems: number = 0;
  icsItems: ICSItem[] = [];
  rrsepItems: ICSItem[] = [];
  searchRRSEPItems: ICSItem[] = [];
  selectedParItems: ICSItem[] = [];
  userProfiles: any = [];
  items: any = [];
  searchKey: string = '';
  parItemKey: string = '';

  activceICSItemKey: string = ''

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

  item: ICSItem | null | undefined;
  itemName: string | null | undefined
  userAccount: any;
  userProfile: any;
  rrsepForm!: FormGroup;
  itemForm!: FormGroup;
  isEditMode: boolean = false;
  isEditItemMode: boolean = false;
  currentEditId: string | null = null;

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  icsItemNo: number | null = null;
  propertyNo: string | null = null;

  typeOptions: string[] = ['Disposal', 'Repair', 'Return to Stock'];
  isCustomType = false;

  itr: any | null | undefined;
  searchPARItems: ICSItem[] = [];

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

    this.rrsepForm = this.fb.group({
      rrsepNo: ['', Validators.required],
      entityName: ['', Validators.required],
      type: ['', Validators.required],
      others: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
      searchRRSEPItemKey: ['']
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
    this.canCreate = this.store.isAllowedAction('RRSEP', 'create');
    this.canRetrieve = this.store.isAllowedAction('RRSEP', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('RRSEP', 'update');
    this.canDelete = this.store.isAllowedAction('RRSEP', 'delete');
    this.canPost = this.store.isAllowedAction('RRSEP', 'post');
    this.canUnpost = this.store.isAllowedAction('RRSEP', 'unpost');
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
      icsModal && !this.isEditMode ? this.resetForm() : this.resetItemForm()
    );

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
          this.getAllRRSEP();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllRRSEP() {
    this.isLoading = true; // Start spinner
    this.api.getAllRRSEP()
      .pipe(
        delay(3000), // Add delay using RxJS operators (simulated for testing)
        map((res) => {
          // Filter results based on `createdBy` and slice for pagination
          this.logger.printLogs('i', 'Show RRSEPs only for Administrator || User Account :', this.userAccount.userID);
          this.logger.printLogs('i', 'List of Originated RRSEPs', res);
          this.totalItems = res.length;
          if (this.userAccount.userGroupName === 'System Administrator') {
            return res.slice(0, 10); // For administrators, show all records, limited to 10
          }
          const filteredRRSEPs = res.filter((rrsp: any) =>
            rrsp.createdBy === this.userAccount.userID ||
            rrsp.issuedBy === this.userAccount.userID ||
            rrsp.receivedBy === this.userAccount.userID ||
            rrsp.approvedBy === this.userAccount.userID
          );
          this.totalItems = filteredRRSEPs.length;
          return filteredRRSEPs.slice(0, 10); // Limit to the first 10 items
        }),
        finalize(() => this.isLoading = false) // Ensure spinner stops after processing
      )
      .subscribe({
        next: (filteredRRSEPs) => {
          this.rrseps = filteredRRSEPs;
          this.logger.printLogs('i', 'List of RRSEPs', this.rrseps);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching RRSEPs', err);
        }
      });
  }

  onSearchRRSEP() {
    if (!this.searchKey) {
      this.getAllRRSEP(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchRRSEP(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              // Filter or process the response if needed
              this.logger.printLogs('i', 'Show RRSEPs only for Administrator || User Account :', this.userAccount.userID);
              this.logger.printLogs('i', 'List of Originated RRSEPs', res);
              if (this.userAccount.userGroupName === 'System Administrator') {
                return res.slice(0, 20); // For administrators, show all records, limited to 10
              }
              const filteredRRSEPs = res.filter((rrsp: any) =>
                rrsp.createdBy === this.userAccount.userID ||
                rrsp.issuedBy === this.userAccount.userID ||
                rrsp.receivedBy === this.userAccount.userID ||
                rrsp.approvedBy === this.userAccount.userID
              );
              return filteredRRSEPs.slice(0, 20); // Limit to 10 results for display
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filteredRRSEPs) => {
              this.rrseps = filteredRRSEPs; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH RRSEPs', this.rrseps);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching RRSEPs on Search', err);
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

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchRRSEP();
    } else {
      this.onSearchRRSEP();
    }
  }

  onSearchPostedICSItem() {
    if (!this.activceICSItemKey) {
      this.getAllPostedICSItems(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.activceICSItemKey.trim()) {
        this.api.searchAllPostedICSItem(this.activceICSItemKey.trim()) // Trim search key to avoid leading/trailing spaces
          .subscribe({
            next: (res) => {

              this.icsItems = res;

              this.logger.printLogs('i', `LIST OF ACTIVE ICS ITEM KEY ${this.activceICSItemKey.trim()}`, res);

              this.icsItems = this.icsItems.filter(
                item => !this.rrsepItems.some(rrsepItem => rrsepItem.icsItemNo === item.icsItemNo) &&
                  item.rrsepFlag === false).slice(0, 10)

              this.logger.printLogs('i', `LIST OF ACTIVE RRSEP ITEM `, this.rrsepItems);
              this.icsItems = res

            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching SEARCH ACTIVE ICS ITEM', err);
            }
          });

      }
    }
  }

  getAllPostedICSItems() {
    this.api.getAllPostedICSItems()
      .subscribe({
        next: (res) => {
          this.icsItems = res;

          this.logger.printLogs('i', 'LIST OF ACTIVE ICS ITEM ', this.icsItems);

          this.icsItems = this.icsItems.filter(
            item => !this.rrsepItems.some(rrsepItem => rrsepItem.icsItemNo === item.icsItemNo) &&
              item.rrsepFlag === false).slice(0, 10);

          this.logger.printLogs('i', 'LIST OF ACTIVE RRSEP ITEM ', this.rrsepItems);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Items', err);
        }
      });
  }

  onKeyUpPARItem(event: KeyboardEvent): void {
    this.onSearchPostedICSItem();
  }

  // Function to display the QR Scanner modal
  onScanQR() {
    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();
  }

  onAddRRSEP() {
    this.resetForm()
    this.openModal(this.AddEditModal);
  }

  onSubmit() {

    if (!this.rrsepForm.valid) {
      this.vf.validateFormFields(this.rrsepForm);
      return;
    }

    if (this.rrsepItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.rrsepForm.valid && this.rrsepItems.length > 0) {

      this.logger.printLogs('i', 'RRSEP Form', this.rrsepForm.value);

      this.rrsep = {
        rrsepNo: this.rrsepForm.value['rrsepNo'],
        entityName: this.rrsepForm.value['entityName'],
        rtype: this.rrsepForm.value['type'],
        otype: this.rrsepForm.value['others'],
        receivedBy: this.receivedID ? this.receivedID : null,
        issuedBy: this.issuedID ? this.issuedID : null,
        approvedBy: this.approvedID ? this.approvedID : null,
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }

      this.logger.printLogs('i', this.isEditMode ? 'Updating...' : 'Saving...', this.rrsep);

      if (this.isEditMode) {
        this.Update()
      } else {
        this.Save();
      }

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

  Save() {
    this.logger.printLogs('i', 'Saving RRSEP', this.rrsep);
    this.logger.printLogs('i', 'Saving RRSEP Item', this.rrsepItems);
    this.api.createRRSEP(this.rrsep, this.rrsepItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', this.rrsep);
          
          this.toast('Saved!', res.message, 'success');
          Swal.fire({
            title: 'Saved',
            text: 'Do you want to add new RRSEP?',
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
          this.getAllRRSEP();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving RRSEP', err);
          Swal.fire('Saving Denied', err, 'warning');
          this.toast('Saving Denied!', err, 'warning');
        }
      });
  }

  Update() {
    this.logger.printLogs('i', 'Updating RRSEP', this.rrsep);
    this.logger.printLogs('i', 'Updating RRSEP Items', this.rrsepItems);

    this.api.updateRRSEP(this.rrsep, this.rrsepItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Saved Success', res);
          this.logger.printLogs('i', 'Saved Success', res.details);
          Swal.fire('Updated!', res.message, 'success');
          this.toast('Updated!', res.message, 'success');
          this.getAllRRSEP();
          this.closeModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Saving RRSEP', err);
          Swal.fire('Updating Denied', err, 'warning');
          this.toast('Updating Denied!', err, 'warning');
        }
      });

  }


  updateICSItems() {
    this.api.updateICSItem(this.currentEditId!, this.icsItems)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Updated Success', this.icsItems);
          Swal.fire('Updated!', res.message, 'warning');
          this.toast('Updated!', res.message, 'success');
          this.getAllRRSEP();
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR Item', err);
          Swal.fire('Denied', err, 'warning');
          Swal.fire('Updating Denied', err, 'warning');
          this.toast('Updating Denied!', err, 'warning');
        }
      });

  }

  onPostRRSEP(rrsep: any) {


    if (!rrsep.postFlag && !this.canPost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Post', 'warning');
      return;
    }

    if (rrsep.postFlag && !this.canUnpost) {
      Swal.fire('Unauthorized Access', 'User is not authorize to Unpost', 'warning');
      return
    }


    if ((this.roleNoFromToken != 'System Administrator' && !rrsep.postFlag) || this.roleNoFromToken == 'System Administrator' || (rrsep.postFlag && this.canUnpost) || (!rrsep.postFlag && this.canPost)) {
      let rrsepNo = rrsep.rrsepNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (rrsep.postFlag ? 'Unpost' : 'Post') + ` RRSEP #${rrsepNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postPRRSEP(rrsepNo, !rrsep.postFlag)
            .subscribe({
              next: (res) => {
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
                this.toast('Success!', res.message, 'success');
                this.getAllRRSEP();
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Posting RRSEP!']);
                Swal.fire('Warning', err, 'warning');
                this.toast('Denied!', err, 'warning');
              }
            });

        }
      });
    }

  }

  onEditRRSEP(rrsep: any) {
    if (rrsep.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted RRSEP.', 'warning');
      return;
    }

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance && modalInstance._isShown) {
        modalElement.addEventListener('hidden.bs.modal', () => {
          // Perform actions after the modal is fully closed
          this.handleEditPRSLogic(rrsep);
        }, { once: true });  // { once: true } ensures the listener fires only once

        this.closeModal(this.ViewModal);
      } else {
        // If the modal is not open, proceed immediately
        this.handleEditPRSLogic(rrsep);
      }
    } else {
      // If ViewModal is undefined, proceed with the logic
      this.handleEditPRSLogic(rrsep);
    }

  }

  handleEditPRSLogic(rrsep: any) {
    this.isEditMode = true;
    this.rrsep = rrsep;
    this.currentEditId = rrsep.rrsepNo;

    this.logger.printLogs('i', 'Restoring RRSEP', rrsep);

    this.issuedID = rrsep.issuedBy;
    this.receivedID = rrsep.receivedBy;
    this.approvedID = rrsep.approvedBy;

    this.rrsepForm.patchValue({
      rrsepNo: rrsep.rrsepNo,
      entityName: rrsep.entityName,
      type: rrsep.rtype,
      others: rrsep.otype,
      userID3: rrsep.approved,
      userID1: rrsep.received,
      userID2: rrsep.issued,
    });

    this.api.retrieveRRSEP(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving RRSEP Item.....', res);
          this.rrsep = res.details;
          this.rrsepItems = res.prsItems;
          this.openModal(this.AddEditModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retrieving RRSEP Item', err);
          Swal.fire('Error', 'Failure to Retrieve RRSEP Item.', 'error');
        }
      });
  }


  onViewRRSEP(rrsep: any) {
    this.rrsep = rrsep;
    this.currentEditId = rrsep.rrsepNo;
    this.logger.printLogs('i', 'Viewing RRSEP', rrsep);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.issuedID = rrsep.issuedBy;
    this.receivedID = rrsep.receivedBy;
    this.approvedID = rrsep.approvedBy;

    this.rrsepForm.patchValue({
      rrsepNo: rrsep.rrsepNo,
      entityName: rrsep.rtype,
      type: rrsep.rtype,
      others: rrsep.otype,
      userID3: rrsep.approvedBy,
      userID1: rrsep.receivedBy,
      userID2: rrsep.issuedBy,
    });

    this.api.retrieveRRSEP(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving RRSEP', res);
          this.rrsep = res.details;
          this.rrsepItems = res.prsItems;
          this.searchRRSEPItems = this.rrsepItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving RRSEP Item', err);
          Swal.fire('Error', 'Failure to Retrieve RRSEP Item.', 'error');
        }
      });

    this.openModal(this.ViewModal); // Open the modal after patching

  }

  onDelete(rrsep: any) {

    if (rrsep.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted RRSEP.', 'warning');
      return;
    }

    let rrsepNo = rrsep.rrsepNo;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove RRSEP #' + rrsepNo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteRRSEP(rrsepNo)
          .subscribe({
            next: (res) => {
              this.getAllRRSEP();
              Swal.fire('Success', res.message, 'success');
              this.toast('Success!', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting RRSEP', err);
              Swal.fire('Denied', err, 'warning');
              this.toast('Denied!', err, 'warning');
            }
          });
      }
    });

  }

  onAddICSItem() {
    const RRSEPNo: string = this.rrsepForm.value['rrsepNo'];
    if (!RRSEPNo) {
      Swal.fire('INFORMATION!', 'Please input RRSEP No. first before adding item', 'warning');
      return;
    }

    this.api.getAllPostedICSItems()
      .subscribe({
        next: (res) => {
          this.icsItems = res;

          this.icsItems = this.icsItems.filter(
            item => !this.rrsepItems.some(rrsepItem => rrsepItem.icsItemNo === item.icsItemNo) &&
              item.rrsepFlag === false
          );
          this.logger.printLogs('i', 'LIST OF ACTIVE ICS ITEM ', this.icsItems);
          this.logger.printLogs('i', 'LIST OF ACTIVE RRSEP ITEM ', this.rrsepItems);

          this.icsItems.length < 1 ? Swal.fire('Information', 'No Items can be return.', 'info') : this.openModal(this.ListItemModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Items', err);
        }
      });

  }


  // PRS ITEM
  onAddItem(item: ICSItem) {
    this.logger.printLogs('i', 'ADD ITEMS', this.icsItems);

    Swal.fire({
      title: 'Confirm',
      text: 'Do you want to RRSEP the selected Item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then(result => {
      if (result.isConfirmed) {
        item.rrsepFlag = true;
        item.rrsepNo = this.rrsepForm.value['rrsepNo'];
        this.rrsepItems.push(item);

        this.logger.printLogs('i', 'TO UPDATE RRSEP ITEMS', this.rrsepItems);

        this.icsItems = this.icsItems.filter(item => item.rrsepFlag === false);

        this.icsItems.length < 1 ? this.closeModal(this.ListItemModal) : '';

        this.logger.printLogs('i', 'UPDATED ICS ITEMS', this.icsItems);


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

    this.rrsepForm.patchValue({
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

    this.rrsepForm.patchValue({
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

    this.rrsepForm.patchValue({
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

    this.rrsepForm.patchValue({
      [formPatchMap[actionType]]: userProfile.fullName
    });

    this.activeInput = null;
    this.userProfiles = [];  // Clear the suggestion list after selection
  }


  searchPRSItem() {
    this.parItemKey = this.rrsepForm.value['searchRRSEPItemKey'];

    // Populate all items if the search key is empty
    if (!this.parItemKey || this.parItemKey.trim() === "") {
      this.rrsepItems = [...this.searchRRSEPItems];  // Reset to full list
    } else {
      console.log(this.parItemKey);
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.rrsepItems = this.searchRRSEPItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
        item.brand!.toLowerCase().includes(searchKey) ||
        item.model!.toLowerCase().includes(searchKey) ||
        item.serialNo!.toLowerCase().includes(searchKey) ||
        item.propertyNo!.toLowerCase().includes(searchKey) ||
        item.qrCode!.toLowerCase().includes(searchKey)
      );
    }
  }

  onViewItem(item: ICSItem) {
    this.item = item;
    this.icsItemNo = item.icsItemNo;
    this.propertyNo = item.propertyNo;

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
                  this.logger.printLogs('i', 'Retreived ITR No: ' + item.itrNo!, this.itr);
                  this.openModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving ITR', err);
                  Swal.fire('Denied', err, 'warning');
                }
              });
          } else {
            this.api.retrieveICS(item.icsNo!)
              .subscribe({
                next: (res) => {
                  this.ics = res[0];
                  this.logger.printLogs('i', 'Retreived ICS No: ' + item.icsNo!, this.ics);
                  this.openModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving ICS', err);
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

  onDeleteItem(item: ICSItem) {
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
          this.rrsepItems = this.rrsepItems.filter(items => items.propertyNo !== this.propertyNo);
          this.logger.printLogs('i', 'Execute delete Item where propertyNo matches to list', this.rrsepItems);
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
    // console.log('Resetting Form...');
    this.isEditMode = false;
    this.currentEditId = null;
    this.rrsep = null;
    this.isModalOpen = false;
    this.item = null;
    this.isOpen = false;
    this.icsItems = [];
    this.rrsepItems = [];
    this.selectedParItems = [];
    this.parItemKey = '';
    this.searchKey = '';
    this.issuedID = null;
    this.receivedID = null;
    this.approvedID = null;
    this.rrsepForm.reset({
      entityName: '',
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
    // this.itemForm.reset({
    //   iid: '',
    //   qrCode: '',
    //   description: '',
    //   brand: '',
    //   model: '',
    //   serialNo: '',
    //   propertyNo: '',
    //   unit: '',
    //   amount: '',
    //   date_Acquired: this.today,
    // });
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
          console.log('Retrieve RRSEP ITEMS', res);
          this.item = res[0];

          console.log('Show Items', this.item);

          this.onRetrieveRRSEP(res[0].rrsepNo);

        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving RRSEP', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found in RRSEP`, 'info');
        }
      });

  }

  onRetrieveRRSEP(rrsepNo: string) {
    this.api.retrieveRRSEP(rrsepNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve RRSEP', res);
          this.rrsep = res.details;

          Swal.fire({
            title: 'Do you want to view the RRSEP Details?',
            text: 'Item Found from  RRSEP #' + rrsepNo,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onCloseQRScanning(this.scannerAction);
              this.onViewRRSEP(this.rrsep);
            } else {
              this.resumeScanning(this.scannerAction);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem Retreiving RRSEP', err);
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
      this.rrsepForm.get('type')?.setValue(selectedValue);
      this.rrsepForm?.get('others')?.setValue('N/A');
    } else {
      this.rrsepForm?.get('others')?.setValue(null);
      this.rrsepForm.get('type')?.markAsUntouched();
      this.rrsepForm.get('others')?.markAsTouched();
    }
  }

  onPrintREPAR(rrsepNo: string) {

    const referenceModel: any | null = null;

    this.api.retrieveRRSEP(rrsepNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving RRSEP', res);
          this.rrsep = res.details;
          this.rrsepItems = res.prsItems;

          this.printService.setModel(this.rrsep);

          // Ensure par.parItems is an array or default to an empty array
          const items = Array.isArray(this.rrsepItems) ? this.rrsepItems : [];
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy),
            this.printService.setApprovedBy(res.details.approvedBy),
            ...items.map(item =>
              this.getModel(item.itrFlag ? item.itrNo : item.icsNo, item.itrFlag ? 'ITR' : 'ICS')
            )
          ]).subscribe((responses: any[]) => {
            const [setReceivedBy, setIssuedBy, setApprovedBy, ...models] = responses;

            // Generate rows with fetched data
            const rows = items.map((item: any, index: number) => `
              <tr ${item.qrCode ? `class="${item.qrCode} item-row"` : ''}>
                <td>${item.description || 'N/A'}</td>
                <td>${item.qty || 1}</td>
                <td>${item.itrFlag ? item.itrNo : item.icsNo}</td>
                <td>${models[index].toString().toUpperCase()}</td>
                <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
              </tr>
            `).join('');

            // Generate report content
            const reportContent = `
              <div class="watermark">RRSEP</div>
              <div class="row">
                <div class="col col-lg-6">
                  <p class="fs-6">Entity Name: <span class="fw-bold border-bottom ms-1">${this.rrsep.entityName}</span></p>
                </div>
                <!--
                <div class="col col-lg-6">
                  <p class="fs-6">Purpose: <span class="fw-bold border-bottom ms-1">
                    ${(((this.rrsep.rtype + '').toLowerCase() === "others") ? this.rrsep.rtype + ' - ' + this.rrsep.otype : this.rrsep.rtype) || 'N/A'}
                  </span></p>
                </div>
                -->
                <div class="col-lg-6">
                  <p class="fs-6 text-end">RRSEP No.: <span class="fw-bold border-bottom ms-1">${this.rrsep.rrsepNo || 'Default RRSEP No.'}</span></p>
                </div>
                <div class="col col-lg-12 border border-dark py-0">
                  <p class="fs-6 text-center py-0">This is to acknowledge receipt of the returned Semi-expendable Property</p>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr class="item-row">
                        <th class='text-center'>DESCRIPTION</th>
                        <th class='text-center'>QUANTITY</th>
                        <th class='text-center'>ICS/ITR</th>
                        <th class='text-center'>END USER TO</th>
                        <th class='text-center'>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              </div>
            `;

            // Print the report
            this.printService.printReport('RRSEP', reportContent);
          });

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PRS Item', err);
          Swal.fire('Error', 'Failure to Retrieve PRS Item.', 'error');
          return;
        }
      });
  }

  getModel(idNo: any, table: string): Observable<string> {
    if (table === 'ITR') {
      return this.api.retrieveITR(idNo).pipe(
        map((res: any) => res.details.received || 'N/A'),
        catchError((err: any) => {
          this.logger.printLogs('w', 'Problem Retrieving PTR', err);
          return of('N/A'); // Return default value on error
        })
      );
    } else if (table === 'ICS') {
      return this.api.retrieveICS(idNo).pipe(
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
