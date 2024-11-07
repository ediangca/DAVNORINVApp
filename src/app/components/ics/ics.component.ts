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
  selector: 'app-ics',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './ics.component.html',
  styleUrl: './ics.component.css'
})
export class IcsComponent implements OnInit {


  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;
  @ViewChild('ViewModalForm') ViewModal!: ElementRef;
  @ViewChild('ItemModalForm') ItemModal!: ElementRef;
  @ViewChild('ViewItemModalForm') ViewItemModal!: ElementRef;

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

  receivedBy: string = '';
  issuedBy: string = '';

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

  isLoading: boolean = true;
  onItemFound: boolean = false;

  isOpen = false;

  today: string | undefined;
  private logger: LogsService;

  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  fn: string = 'start';

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


  constructor(private fb: FormBuilder, private api: ApiService, private store: StoreService, private vf: ValidateForm,
    private auth: AuthService, private cdr: ChangeDetectorRef, private printService: PrintService) {
    this.logger = new LogsService();

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
    });

    // this.getALLPAR();
    // this.getUserAccount();
    this.roleNoFromToken = this.auth.getRoleFromToken();
  }

  ngOnInit(): void {
    this.getALLPAR();
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
      this.isITR = false;
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

  getALLPAR() {
    this.isLoading = true; // Stop showing the loading spinner
    // Simulate an API call with a delay
    setTimeout(() => {
      this.api.getAllICS()
        .subscribe({
          next: (res) => {
            this.icss = res;
            this.logger.printLogs('i', 'LIST OF ICS', this.icss);
            this.isLoading = false; // Stop showing the loading spinner
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching ICS', err);
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

      this.icsItems = this.searchPARItems.filter(item => item.description!.toLowerCase().includes(searchKey));
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



  onSearchPAR() {

  }

  onKeyUp($event: KeyboardEvent) {
  }


  onAddPARItem() {
    const PARNo: string = this.icsForm.value['icsNo'];
    if (!PARNo) {
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

    if (this.icsForm.valid && this.icsItems.length > 0) {

      this.logger.printLogs('i', 'ICS Form', this.icsForm.value);

      this.ics = {
        icsNo: this.icsForm.value['icsNo'],
        entityName: this.icsForm.value['entityName'],
        fund: this.icsForm.value['fund'],
        receivedBy: this.icsForm.value['userID1'],
        issuedBy: this.icsForm.value['userID2'],
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


  onSubmitREPAR() {

    if (!this.itrForm.valid) {
      this.vf.validateFormFields(this.itrForm);
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
      this.logger.printLogs('i', 'Saving ICS', ics);

      this.api.createICS(ics, this.icsItems)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('i', 'Saved Success', ics);
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
            this.getALLPAR();
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Saving ICS', err);
            Swal.fire('Denied', err, 'warning');
          }
        });
    } else {

      this.itr = {
        icsNo: ics.icsNo,
        ttype: this.itrForm.value['type'],
        otype: this.itrForm.value['others'],
        reason: this.itrForm.value['reason'],
        receivedBy: this.itrForm.value['userID1'],
        issuedBy: ics.receivedBy,
        approvedBy: this.itrForm.value['userID3'],
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
                this.logger.printLogs('i', 'Saved Success', res.details);

                this.closeModal(this.ViewModal);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Saving ITR', err);
                Swal.fire('Denied', err, 'warning');
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
          this.logger.printLogs('i', 'Saved Success', ics);
          Swal.fire('Updated!', res.message, 'warning');
          this.getALLPAR();

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Updating PAR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });


  }

  onPostICS(ics: any) {

    if ((this.roleNoFromToken != 'System Administrator' && !ics.postFlag) || this.roleNoFromToken == 'System Administrator') {
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
                this.getALLPAR();
                this.logger.printLogs('i', 'Posted Success', res);
                Swal.fire('Success', res.message, 'success');
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error', ['Retrieving ICS Item!']);
                Swal.fire('Warning', err, 'warning');
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

    if (this.ViewModal) {
      const modalElement = this.ViewModal.nativeElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      // Check if the modal is shown or not
      if (modalInstance && modalInstance._isShown) {
        this.closeModal(this.ViewModal)
      }
    }

    this.isEditMode = true;
    this.ics = ics;
    this.currentEditId = ics.icsNo;

    this.logger.printLogs('i', 'Restoring ICS', ics);

    this.icsForm.patchValue({
      icsNo: ics.icsNo,
      entityName: ics.entityName,
      fund: ics.fund,
      userID1: ics.receivedBy,
      userID2: ics.issuedBy
    });

    this.api.retrieveICSItemByICSNo(this.currentEditId!)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieving ICS Item', res);
          this.icsItems = res;
          this.openPARModal(this.AddEditModal);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving ICS Item', err);
          Swal.fire('Error', 'Failure to Retrieve ICS Item.', 'error');
        }
      });


  }


  onViewICS(ics: any) {
    this.ics = ics;
    this.currentEditId = ics.icsNo;
    this.logger.printLogs('i', 'Viewingggggggggggggggggg ICS', ics);

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

    this.openPARModal(this.ViewModal); // Open the modal after patching

  }

  onRepar(ics: any) {
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

    this.openPARModal(this.ViewModal); // Open the modal after patching

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
        this.api.deletePAR(icsNo)
          .subscribe({
            next: (res) => {
              this.getALLPAR();
              Swal.fire('Success', res.message, 'success');
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
      this.validateFormFields(this.itemForm);
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


      // icsItemNo, icsNo, iid, description, qty, unit, amount: number, itrFlag, ITRNo

      this.item = new ICSItem(null, ICSNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Qty, Unit, Amount, Eul, false, null);
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



      if (await this.isExistOnUpdate(this.ICSItemNo, PropertyNo)) {
        Swal.fire('Information!', 'Property No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.ICSItemNo, SerialNo)) {
        Swal.fire('Information!', 'Serial No. already exists!', 'warning');
        return;
      }

      if (await this.isExistOnUpdate(this.ICSItemNo, QRCode)) {
        Swal.fire('Information!', 'QRCode already exists!', 'warning');
        return;
      }


      const index = this.icsItems.findIndex(i => i.description === this.item!.description);
      if (index !== -1) {
        this.icsItems[index] = new  ICSItem(this.ICSItemNo, ICSNo, this.iid!, Brand, Model, Description, SerialNo, PropertyNo, QRCode, Qty, Unit, Amount, Eul, false, null);

        Swal.fire('Success!', 'Item updated successfully!', 'success');
        this.resetItemForm();
        this.closeModal(this.ItemModal);
      }
    }
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

  isExistOnUpdate(ICSItemNo: number | null, key: string | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
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
          });

          this.openItemModal(this.ItemModal)
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
                  this.openItemModal(this.ViewItemModal)
                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Retreiving ITR', err);
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

  onCopyItem(item: ICSItem) {
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
            qty: item.qty,
            unit: item.unit,
            amount: item.amount,
            eul: item.eul
          });

          this.openItemModal(this.ItemModal)
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
          this.icsItems = this.icsItems.filter(items => items.icsItemNo !== item.icsItemNo);
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
    this.isITR = false;
    this.isEditMode = false;
    this.currentEditId = null;
    this.isModalOpen = false;
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
    this.searchPARItems = [];
    this.selectedICSItems = [];
    this.parItemKey = '';
    this.searchKey = '';
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

              this.onRetrievePAR(res[0].icsNo);

            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Retreiving PAR ITEMS', err);
              Swal.fire('Denied', err, 'warning');
            }
          });

      }

    }
  }

  onRetrievePAR(icsNo: string) {
    this.api.retrievePAR(icsNo)
      .subscribe({
        next: (res) => {
          console.log('Retrieve ICS', res);
          this.ics = res[0];

          Swal.fire({
            title: 'Item Found from ICS #' + this.ics.icsNo + "",
            text: 'Do you want to view the ICS?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          }).then((result) => {
            if (result.isConfirmed) {
              this.onItemFound = true;
              this.onViewICS(this.ics);
            }
          });
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Retreiving PAR', err);
          Swal.fire('Denied', err, 'warning');
        }
      });
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
                    <td style="font-size: small;">${ ((item?.qty || 0) * (item?.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</td>
                    <td style="font-size: small;">${item.description || 'N/A'}</td>
                    <td style="font-size: small;">${index + 1 || item.icsNo || item.icsItemNo || item.iid || 'N/A'}</td>
              <td style="font-size: small;">${item.eul + ' year(s)' || 'N/A'}</td>
                  </tr>
                `).join('');


                  // Generate the full report content
                  const reportContent = `
                  <div class="row mb-3">
                    <div class="col text-center">
                        <h5>INVENTORY CUSTODIAN SLIP</h5>
                    </div>
                  </div>

                  <div class="watermark">ICS</div>

                  <table class="table">
                    <tbody>
                        <tr style="border-color: transparent;">
                            <td><strong>Entity Name:</strong></td>
                            <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${par.entityName || 'Default LGU'} </p></td>
                            <td></td>
                            <td</td>

                        </tr>
                        <tr style="border-color: transparent;">
                            <td><strong>Fund Cluster:</strong></td>
                            <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${par.fund || 'Default FUND'}  </p></td>

                            <td><strong>ICS No.:</strong></td>
                            <td> <p class="fs-6 m-0 pe-3 border-bottom"> ${par.icsNo || 'N/A'} </p></td>
                        </tr>
                    </tbody>
                  </table>

                      <!-- Table with List of Items -->
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th class="text-center align-middle" style="font-size: small;" rowspan="2">QTY</th>
                                    <th class="text-center align-middle" style="font-size: small;" rowspan="2">UNIT</th>
                                    <th class="text-center align-middle" style="font-size: small;" colspan="2" >Amount</th>
                                    <th class="text-center align-middle" style="font-size: small; "rowspan="2">DESCRIPTION</th>
                                    <th class="text-center align-middle" style="font-size: small; "rowspan="2">ITEM NO</th>
                                    <th class="text-center align-middle" style="font-size: small; "rowspan="2">ESTIMATED USEFUL LIFE</th>
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

