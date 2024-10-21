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
import { ICSItem } from '../../models/ICSItem';


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

  roleNoFromToken: string = "Role";

  isModalOpen = false;

  itrs: any = [];
  itr!: any;
  icsItems: ICSItem[] = [];
  selectedParItems: ICSItem[] = []; // Array to track selected items from repar
  userProfiles: any = [];
  items: any = [];
  searchKey: string = '';
  parItemKey: string = '';

  receivedBy: string = '';
  issuedBy: string = '';

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

  generatedREPARNo: string | null | undefined;
  noOfParItems: number = 0;

  icsItemNo: number | null = null;
  propertyNo: string | null = null;


  typeOptions: string[] = ['Donation', 'Reassignment', 'Relocation'];
  isCustomType = false;

  isRepar: boolean = false;
  itrForm!: FormGroup;
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

    this.icsForm = this.fb.group({
      lgu: ['', Validators.required],
      fund: ['', Validators.required],
      icsNo: ['', Validators.required],
      userID1: ['', Validators.required],
      userID2: ['', Validators.required],
      userID3: ['', Validators.required],
      reason: ['', Validators.required],
      others: ['', Validators.required],
      type: ['', Validators.required],
    });

    this.itrForm = this.fb.group({
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

    // this.getALLPAR();
    // this.getUserAccount();
    this.roleNoFromToken = this.auth.getRoleFromToken();
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.getALLITR();
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

  getALLITR() {
    this.isLoading = true; // Stop showing the loading spinner
    // Simulate an API call with a delay
    setTimeout(() => {
      this.api.getAllITR()
        .subscribe({
          next: (res) => {
            this.itrs = res;
            this.logger.printLogs('i', 'LIST OF ITR', this.itrs);
            this.isLoading = false; // Stop showing the loading spinner
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching User Groups', err);
          }
        });

    }, 3000); // Simulate a 2-second delay
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
      this.icsItems = [...this.searchPARItems];  // Reset to full list
    } else {
      const searchKey = this.parItemKey.toLowerCase();  // Convert search key to lowercase

      this.icsItems = this.searchPARItems.filter(item => item.description!.toLowerCase().includes(searchKey) ||
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



  onSearchPAR() {
  }

  onKeyUp($event: KeyboardEvent) {
  }

  onAddPARItem() {
    const ICSNo: string = this.icsForm.value['icsNo'];
    if (!ICSNo) {
      Swal.fire('INFORMATION!', 'Please input ICS No. first before adding item', 'warning');
      return;
    }
    this.openItemModal(this.ItemModal);
  }

  onSubmit() {

    if (!this.icsForm.valid) {
      this.vf.validateFormFields(this.icsForm);
      return;
    }

    if (this.icsItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    this.currentEditId = this.itr.itrNo;

    if (this.icsForm.valid && this.icsItems.length > 0) {

      this.logger.printLogs('i', 'ITR Form', this.icsForm.value);

      this.itr = {
        parNo: this.icsForm.value['parNo'],
        lgu: this.icsForm.value['lgu'],
        fund: this.icsForm.value['fund'],
        receivedBy: this.icsForm.value['userID1'],
        issuedBy: this.icsForm.value['userID2'],
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


  onSubmitREPAR() {

    if (!this.itrForm.valid) {
      this.vf.validateFormFields(this.itrForm);
      return;
    }

    if (this.selectedParItems.length < 1) {
      Swal.fire('Warning!', 'Require at least 1 item to proceed!', 'warning');
      return;
    }

    if (this.itrForm.valid && this.icsItems.length > 0) {

      this.logger.printLogs('i', 'REPAR Form', this.itr);
      this.Save(this.itr);

    }

  }


  Save(itr: any) {
    if (!this.isRepar) {
      this.logger.printLogs('i', 'Saving ITR', itr);
      this.api.createITR(itr, this.icsItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', itr);
            Swal.fire('Saved', res.message, 'success');
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving itr', err);
            Swal.fire('Denied', err, 'warning');
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
          this.logger.printLogs('i', 'Saving REPAR', this.itr);

          this.api.createITR(this.itr, this.selectedParItems)
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

  Update(itr: any) {
    this.logger.printLogs('i', 'Updating ITR', itr);

    this.api.updateITR(this.itr, this.icsItems)
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

  onPostREPAR(par: any) {

    if ((this.roleNoFromToken != 'System Administrator' && !par.postFlag) || this.roleNoFromToken == 'System Administrator') {
      let reparNo = par.reparNo;

      Swal.fire({
        title: 'Are you sure?',
        text: (par.postFlag ? 'Unpost' : 'Post') + ` REPAR #${reparNo}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {

          this.api.postREPAR(reparNo, !par.postFlag)
            .subscribe({
              next: (res) => {
                this.getALLITR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving RPAR Item!']);
                Swal.fire('Warning', err, 'warning');
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
      Swal.fire('Information!', 'Cannot edit posted REPAR.', 'warning');
      return;
    }
    if (this.ViewModal) {
      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
        isViewNotVisible = true;
      }else{
        isViewNotVisible = true;
      }
    }else{
      isViewNotVisible = true;
    }

    setTimeout(() => {

      if(isViewNotVisible){
        this.isEditMode = true;
        this.itr = itr;
        this.currentEditId = itr.itrNo;

        this.logger.printLogs('i', 'Restoring ITR', itr);

        this.icsForm.patchValue({
          lgu: itr.entityName,
          fund: itr.fund,
          icsNo: itr.icsNo,
          userID1: itr.receivedBy,
          userID2: itr.issuedBy,
          userID3: itr.approvedBy
        });

        // Now handle the disabled state separately
        if (this.isEditMode) {
          this.icsForm.get('userID2')?.disable(); // Disable the control if needed
        }

        this.api.retrieveITR(this.currentEditId!)
          .subscribe({
            next: (res) => {
              this.logger.printLogs('i', 'Retrieving ITR Item', res);
              this.itr = res.details;
              this.icsItems = res.itrItems;
              this.openPARModal(this.AddEditModal);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Retreiving ITR Item', err);
              Swal.fire('Error', 'Failure to Retrieve ITR Item.', 'error');
            }
          });

      }
    }, 1000);

  }


  onViewITR(itr: any) {
    this.itr = itr;
    this.currentEditId = itr.itrNo;
    this.logger.printLogs('i', 'Viewing ITR', itr);

    if (!this.onItemFound) {
      this.item = null;
    }

    this.api.retrieveITR(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ITR Item', res);
          this.itr = res.details;
          this.icsItems = res.itrItems;
          this.searchPARItems = this.icsItems;

          this.openPARModal(this.ViewModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ITR Item', err);
          Swal.fire('Error', 'Failure to Retrieve ITR Item.', 'error');
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
              this.getALLITR();
              Swal.fire('Success', res.message, 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting ITR', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });

  }


  // PAR ITEM

  // async onAddItem() {
  //   if (!this.itemForm.valid) {
  //     this.validateFormFields(this.itemForm);
  //     Swal.fire('Information!', 'Please check all fields.', 'warning');
  //     return;
  //   }

  //   const PARNo: string = this.parForm.value['parNo'];
  //   const IID: string = this.itemForm.value['iid'];
  //   const Brand: string = this.itemForm.value['brand'];
  //   const Model: string = this.itemForm.value['model'];
  //   const Description: string = this.itemForm.value['description'];
  //   const SerialNo: string = this.itemForm.value['serialNo'];
  //   const PropertyNo: string = this.itemForm.value['propertyNo'];
  //   const QRCode: string = this.itemForm.value['qrCode'];
  //   const Unit: string = this.itemForm.value['unit'];
  //   const Amount: number = this.itemForm.value['amount'];
  //   const Date_Acquired: Date = this.itemForm.value['date_Acquired'];



  //   if (!(await this.isItemFound())) {
  //     Swal.fire('Information!', 'Item not available!', 'warning');
  //     return;
  //   }

  //   if (!this.isEditItemMode) {

  //     if (await this.isExist(PropertyNo)) {
  //       Swal.fire('Information!', 'Property No. already exists!', 'warning');
  //       return;
  //     }

  //     if (await this.isExist(SerialNo)) {
  //       Swal.fire('Information!', 'Serial No. already exists!', 'warning');
  //       return;
  //     }

  //     if (await this.isExist(QRCode)) {
  //       Swal.fire('Information!', 'QRCode already exists!', 'warning');
  //       return;
  //     }

  //     this.item = new Item(null, PARNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
  //     this.icsItem.push(this.item);
  //     this.logger.printLogs('i', 'PAR ITEMS', this.icsItem);
  //     this.resetItemForm();

  //     Swal.fire({
  //       title: 'Saved',
  //       text: 'Do you want to add new Item?',
  //       icon: 'success',
  //       showCancelButton: true,
  //       confirmButtonText: 'Yes',
  //       cancelButtonText: 'No',
  //     }).then(result => {
  //       if (!result.isConfirmed) {
  //         this.closeModal(this.ItemModal);
  //       }
  //     });

  //   } else {

  //     if (await this.isExistOnUpdate(this.parINo, PropertyNo)) {
  //       Swal.fire('Information!', 'Property No. already exists!', 'warning');
  //       return;
  //     }

  //     if (await this.isExistOnUpdate(this.parINo, SerialNo)) {
  //       Swal.fire('Information!', 'Serial No. already exists!', 'warning');
  //       return;
  //     }

  //     if (await this.isExistOnUpdate(this.parINo, QRCode)) {
  //       Swal.fire('Information!', 'QRCode already exists!', 'warning');
  //       return;
  //     }

  //     const index = this.icsItem.findIndex(i => i.propertyNo === this.item!.propertyNo);
  //     if (index !== -1) {
  //       this.icsItem[index] = new Item(this.parINo, PARNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Unit, Amount, Date_Acquired, false, null);
  //       Swal.fire('Success!', 'Item updated successfully!', 'success');
  //       this.resetItemForm();
  //       this.closeModal(this.ItemModal);
  //     }
  //   }
  // }


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
                  this.logger.printLogs('i', 'Retreived REPAR No: ' + item.itrNo!, res.details);
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

  onDeleteItem(item: ICSItem) {
    this.item = item;
    this.propertyNo = item.description;

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
          this.icsItems = this.icsItems.filter(item => item.description !== this.propertyNo);
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
    this.icsForm.reset({
      userID1: '',
      userID2: ''
    });
    this.itrForm.reset({
      userID1: '',
      userID2: ''
    });
    this.icsItems = [];
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

  onPrintITR(reparNo: string) {

    this.api.retrieveITR(reparNo)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving REPAR', res);
          const repar = res.details;


          this.printService.setReceivedBy(res.details.receivedBy);
          this.printService.setIssuedBy(res.details.issuedBy);

          const icsItem = res.icsItem;

          // Ensure par.icsItem is an array or default to an empty array
          const items = Array.isArray(icsItem) ? icsItem : [];
          // Use forkJoin to wait for both observables to complete
          forkJoin([
            this.printService.setReceivedBy(res.details.receivedBy),
            this.printService.setIssuedBy(res.details.issuedBy)
          ] as Observable<any>[]).subscribe(() => {
            // Once both services complete, continue with the report generation
            const icsItem = res.icsItem;
            this.searchPARItems = this.icsItems;
            const items = Array.isArray(icsItem) ? icsItem : [];

            const rows = items.map((item: any, index: number) => `
              <tr ${item.qrCode ? `class="${item.qrCode}"` : ''}>
                <td style="font-size: small;">${index + 1}</td>
                <td style="font-size: small;">${item.qty || '1'}</td>
                <td style="font-size: small;">${item.unit || 'pcs'}</td>
                <td style="font-size: small;">${item.description || 'N/A'}</td>
                <td style="font-size: small;">${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                <td style="font-size: small;">${item.propertyNo || 'N/A'}</td>
                <td style="font-size: small;">${item.amount || '0'}</td>
              </tr>`).join('');



            // Generate the full report content
            const reportContent = `
          <div class="row mb-3">
            <div class="col text-center">
                <h5>PROPERTY ACKNOWLEDGEMENT RECEIPT</h5>
            </div>
          </div>

          <div class="watermark">REPAR</div>

          <table class="table">
            <tbody>
                <tr style="border-color: transparent;">
                    <td><strong>LGU:</strong></td>
                    <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${repar.lgu || 'Default LGU'} </p></td>
                    <td></td>
                    <td</td>

                </tr>
                <tr style="border-color: transparent;">
                    <td><strong>LGU:</strong></td>
                    <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${repar.fund || 'Default FUND'}  </p></td>

                    <td><strong>PAR No.:</strong></td>
                    <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${repar.parNo || 'N/A'} </p></td>
                </tr>
            </tbody>
          </table>

          <!-- Table with List of Items -->
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th style="font-size: small;">#</th>
                        <th style="font-size: small;">QTY</th>
                        <th style="font-size: small;">UNIT</th>
                        <th style="font-size: small;">DESCRIPTION</th>
                        <th style="font-size: small;">DATE ACQUIRED</th>
                        <th style="font-size: small;">PROPERTY NUMBER</th>
                        <th style="font-size: small;">AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>`;

            // Print the report
            this.printService.printReport('RE-PAR', reportContent);

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

