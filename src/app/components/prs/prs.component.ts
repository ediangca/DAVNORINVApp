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
  selectedParItems: Item[] = []; // Array to track selected items from repar
  userProfiles: any = [];
  items: any = [];
  searchKey: string = '';
  searchPARItemKey = '';
  parItemKey: string = '';

  receivedBy: string = '';
  issuedBy: string = '';

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

  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isRepar: boolean = false;
  reprsForm!: FormGroup;
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
    const modal = document.getElementById('AddEditModalForm')!;
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
      });
    }
    const viewPARModal = document.getElementById('ViewModalForm')!;
    if (viewPARModal) {
      viewPARModal.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
      });
    }

    const itemModal = document.getElementById('ItemModalForm')!;
    if (itemModal) {

      itemModal.addEventListener('hidden.bs.modal', () => {
        this.resetItemForm();
      });
    }

    const viewItemModal = document.getElementById('ViewItemModalForm')!;
    if (viewItemModal) {

      viewItemModal.addEventListener('hidden.bs.modal', () => {
        this.resetItemForm();
      });
    }

    const QRScannerModal = document.getElementById('QRScannerForm')!;
    if (QRScannerModal) {

      QRScannerModal.addEventListener('hidden.bs.modal', () => {
        this.resetQRScanForm(this.scannerAction, this.fn);

      });
    }
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
    this.parItems = [];
    this.openPARModal(this.AddEditModal);
  }

  onSubmit() {

    if (!this.prsForm.valid) {
      this.vf.validateFormFields(this.prsForm);
      return;
    }

    if (this.parItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.par.reparNo;

    if (this.prsForm.valid && this.parItems.length > 0) {

      this.logger.printLogs('i', 'PAR Form', this.prsForm.value);

      this.prs = {
        reparNo: this.currentEditId,
        parNo: this.prsForm.value['parNo'],
        ttype: this.prsForm.value['type'],
        otype: this.prsForm.value['others'],
        reason: this.prsForm.value['reason'],
        receivedBy: this.prsForm.value['userID1'],
        issuedBy: this.prsForm.value['userID2'],
        approvedBy: this.prsForm.value['userID3'],
        postFlag: false,
        voidFlag: false,
        createdBy: this.userAccount.userID,
      }


      if (this.isEditMode) {
        this.Update(this.prs)
      }else {
        this.Save(this.prs);
      }

    }

  }


  onSubmitREPAR() {

    if (!this.reprsForm.valid) {
      this.vf.validateFormFields(this.reprsForm);
      return;
    }

    if (this.selectedParItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.reprsForm.valid && this.parItems.length > 0) {

      this.logger.printLogs('i', 'REPAR Form', this.par);
      this.Save(this.par);

    }

  }


  Save(par: any) {
    if (!this.isRepar) {
      this.logger.printLogs('i', 'Saving PAR', par);
      this.api.createPAR(par)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', par);
            this.saveParItems();
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving PAR', err);
            Swal.fire('Denied', err, 'warning');
          }
        });
    } else {


      this.repar = {
        reparNo: par.reparNo,
        parNo: par.parNo,
        receivedBy: this.reprsForm.value['userID1'],
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
          this.getAllPRS();

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

          this.api.postREPAR(prsNo, !prs.postFlag)
            .subscribe({
              next: (res) => {
                this.getAllPRS();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
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

  onEditREPAR(par: any) {
    if (par.postFlag) {
      Swal.fire('Information!', 'Cannot edit posted REPAR.', 'warning');
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

    this.logger.printLogs('i', 'Restoring PAR', par);

    this.prsForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      type: par.ttype,
      others: par.otype,
      reason: par.reason,
      userID3: par.approvedBy,
      userID1: par.receivedBy,
      userID2: par.issuedBy,
    });

    this.api.retrieveREPAR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving REPAR Item', res);
          this.repar = res.details;
          this.parItems = res.parItems;
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving REPAR Item', err);
          Swal.fire('Error', 'Failure to Retrieve REPAR Item.', 'error');
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

    this.prsForm.patchValue({
      lgu: par.lgu,
      fund: par.fund,
      parNo: par.parNo,
      userID1: par.receivedBy, // These will now be patched correctly
      userID2: par.issuedBy
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

    this.reprsForm.patchValue({
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
              this.getAllPRS();
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
          this.prsItems = this.prsItems.filter(item => item.propertyNo !== this.propertyNo);
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
    this.isEditMode = false;
    this.currentEditId = null;
    this.isModalOpen = false;
    this.isRepar = false;
    this.item = null;
    this.isOpen = false;
    this.prsForm.reset({
      userID1: '',
      userID2: '',
      userID3: ''
    });
    this.reprsForm.reset({
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
              console.log('Retrieve PAR ITEMS', res);
              this.item = res[0];

              console.log('Show Items', this.item);

              this.onRetrieveREPAR(res[0].reparNo);

            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Retreiving PAR ITEMS', err);
              Swal.fire('Denied', err, 'warning');
            }
          });

      }

    }
  }

  onRetrieveREPAR(reparNO: string) {
    this.api.retrieveREPAR(reparNO)
      .subscribe({
        next: (res) => {
          console.log('Retrieve PAR', res);
          this.par = res.details;

          Swal.fire({
            title: 'Do you want to view the REPAR Details?',
            text: 'Item Found from REPAR #' + this.par.reparNo,
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
          this.logger.printLogs('e', 'Error Retreiving PAR', err);
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
            this.printService.setApprovedBy(res.details.issuedBy)
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
              <p class="text-end fs-6">PTR No.: <span class="fw-bold border-bottom ms-1">${repar.reparNo || 'Default PTR No.'}</span></p>
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

