import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { StoreService } from '../../services/store.service';
import { PrintService } from '../../services/print.service';
import { LogsService } from '../../services/logs.service';


import Swal from 'sweetalert2';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateForm';
declare var bootstrap: any;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, AfterViewInit {

  @ViewChild('FilterBranch') filterModal!: ElementRef;
  @ViewChild('PropertyCard') PropertyCardModal!: ElementRef;
  @ViewChild('PropertyCardOwner') PropertyCardOwnerModal!: ElementRef;
  @ViewChild('PropertyOwner') PropertyOwnerModal!: ElementRef;

  reportsMap: { [key: string]: string } = {
    PAR: 'Property Acknowledgement Receipt',
    PTR: 'Property Transfer Receipt',
    PRS: 'Property Return Slip',
    ICS: 'Inventory Custodian Slip',
    ITR: 'Inventory Transfer Record',
    RRSEP: 'Receipt Return Semi-Expandable Property',
    OPR: 'Other Property Receipt',
    OPTR: 'Other Property Transfer Receipt',
    OPRR: 'Other Property Return Report',
    SOPA5: 'Summary of Property Above 50k',
    SOPB5: 'Summary of Property Below 50k',
    SOOP: 'Summary of Other Property',
  };



  filterForm!: FormGroup;
  offices: any = [];
  propertyCardForm!: FormGroup;
  propertyCards: any = []
  typeOptions: string[] = ['Above50k', 'Below50k', 'Others'];
  activeInput: 'card' | 'issued' | 'approved' | null = null;

  propertyOwnerForm!: FormGroup;
  propertyOwner: any = []

  office: string | null = null;
  category: string | null = null;
  itemID: string | null = null;
  item: any | null = null;
  items: any = []
  userProfile: any;

  isLoading: boolean = false;
  file: string | null = null;
  propertyKey: string | null = null;

  accountKey: string | null = null;
  account: any | null = null;
  accounts: any = []

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private printService: PrintService,
    private vf: ValidateForm, private logger: LogsService) {
    this.ngOnInit();
  }

  ngOnInit(): void {

    this.checkPrivileges();

    this.filterForm = this.fb.group({
      office: ['', Validators.required]
    });

    this.propertyCardForm = this.fb.group({
      category: ['', Validators.required],
      item: ['', Validators.required]
    });


    this.propertyOwnerForm = this.fb.group({
      item: ['', Validators.required]
    });

    this.loadUser()
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.checkPrivileges();
    });
  }

  private checkPrivileges(): void {
    this.store.loadPrivileges();
    this.canCreate = this.store.isAllowedAction('REPORTS', 'create');
    this.canRetrieve = this.store.isAllowedAction('REPORTS', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('REPORTS', 'update');
    this.canDelete = this.store.isAllowedAction('REPORTS', 'delete');
    this.canPost = this.store.isAllowedAction('REPORTS', 'post');
    this.canUnpost = this.store.isAllowedAction('REPORTS', 'unpost');

  }


  loadUser() {
    this.store.getUserProfile()
      .subscribe({
        next: (res) => {
          this.userProfile = res;
          this.logger.printLogs('i', 'Load User Profile from Store Service', this.userProfile);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Account from Store Service', err);
        }
      });
  }

  getAllOffice(module: string) {
    this.api.getAllOffices(module)
      .subscribe({
        next: (res) => {
          this.offices = res;
          this.logger.printLogs('e', `List of Offices under module ${module}`, res);

        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching User Groups', err);
        }
      });
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

  resetForms() {

    this.filterForm = this.fb.group({
      office: ['', Validators.required]
    });

    this.propertyCardForm = this.fb.group({
      category: ['', Validators.required],
      item: ['', Validators.required]
    });


    this.propertyOwnerForm = this.fb.group({
      item: ['', Validators.required]
    });
    this.propertyKey = '';
    this.propertyCards = [];

    this.accountKey = '';
    this.accounts = [];
  }



  onViewReport(reportName: string) {
    this.resetForms();

    this.logger.printLogs('i', 'Run Report', reportName);
    switch (reportName) {
      case "propertyLogs":

        this.openModal(this.PropertyCardModal);

        break;

      case "propertyLogsOwner":

        this.openModal(this.PropertyCardOwnerModal);

        break;

      case "propertyOwner":

        this.openModal(this.PropertyOwnerModal);

        break;

      default:


        this.logger.printLogs('i', 'Allow Report Retrieve all Office', this.canRetrieve);
        this.logger.printLogs('i', 'Run Report', reportName);
        this.file = reportName;

        if (this.canRetrieve) {
          // this.getAllOffice(reportName);

          this.api.getAllOffices(reportName).subscribe({
            next: (res) => {
              this.offices = res; // Update the offices property
              this.logger.printLogs('i', `List of Offices under report ${reportName}`, res);


              if (this.offices.length > 0) {
                // Open the modal after successfully fetching offices
                this.openModal(this.filterModal);
              } else {
                Swal.fire('INFORMATION!', `No ${reportName} list Found!`, 'info');
              }
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Offices', err);
              // Optionally, show an error message to the user
            }
          });
        } else {
          this.office = `${this.userProfile.branch}-${this.userProfile.department}-${this.userProfile.section}`;
          this.logger.printLogs('i', `User Offices : `, this.office);
          this.onPrint()
        }

    }

  }

  objectKeys(obj: { [key: string]: any }): string[] {
    return Object.keys(obj);
  }


  onPrint() {
    if (this.file) {
      // if (this.canRetrieve && !this.filterForm.valid) {
      //   this.validateFormFields(this.filterForm);
      //   Swal.fire('INFORMATION!', 'Choose an Office First.', 'info');
      //   return
      // }
      this.office = this.filterForm.value['office'];;

      this.api.getAllItemByOffice(this.file, this.office!).subscribe({
        next: (res) => {
          this.items = res; // Update the offices property
          this.logger.printLogs('i', `List of All ${this.file} Items under Offices under ${this.office}`, res);

          if (this.items.length < 1) {
            Swal.fire('INFORMATION!', 'Sorry! No item can Generate.', 'info');
            return;
          }


          // Ensure par.parItems is an array or default to an empty array
          const list = Array.isArray(this.items) ? this.items : [];

          const isPARNo = list.some((item: any) => item.parNo);
          const isREPARNo = list.some((item: any) => item.reparNo);
          const isPRSNo = list.some((item: any) => item.prsNo);
          const isICSNo = list.some((item: any) => item.icsNo);
          const isITRNo = list.some((item: any) => item.itrNo);
          const isRRSEPNo = list.some((item: any) => item.rrsepNo);
          const showTransferTypeColumn = list.some((item: any) => item.transferType);
          const showrReturnTypeColumn = list.some((item: any) => item.returnType);
          const showApprovedColumn = list.some((item: any) => item.approved);

          // Create the table rows dynamically
          // const rows = list.map((item: any, index: number) => `
          //     <tr ${item.parino ? `class="${item.parino} item-row"` : ''}>
          //       <td>${index + 1}</td>
          //       <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
          //       <td>${item.description || 'N/A'}</td>
          //       <td>${item.serialNo || 'N/A'}</td>
          //       <!-- <td>${item.propertyNo || 'N/A'}</td>
          //       <td>${item.qty || '1'}</td> -->
          //       <td>${item.unit || 'pcs'}</td>
          //       <td>
          //       ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          //       </td>
          //       ${showTransferTypeColumn ? `<td>${item.transferType ? item.transferType : 'N/A'}</td>` : ''}
          //       <td>${item.issuedBy || 'N/A'}</td>
          //       <td>${item.receivedBy || 'N/A'}</td>
          //       ${showApprovedColumn ? `<td>${item.approved ? item.approvedBy : 'N/A'}</td>` : ''}
          //       <td>${item.createdBy || 'N/A'}</td>
          //     </tr>`).join('');                             
          let identifier = null;

          let refHeader = "REF. NO."; // Default value

          if (list.some((item: any) => item.parNo) && this.file == 'PAR') {
            refHeader = "PAR NO.";
          } else if (list.some((item: any) => item.reparNo) && this.file == 'PTR') {
            refHeader = "PTR NO.";
          } else if (list.some((item: any) => item.prsNo) && this.file == 'PRS') {
            refHeader = "PRS NO.";
          } else if (list.some((item: any) => item.icsNo) && this.file == 'ICS') {
            refHeader = "ICS NO.";
          } else if (list.some((item: any) => item.itrNo) && this.file == 'ITR') {
            refHeader = "ITR NO.";
          } else if (list.some((item: any) => item.rrsepNo) && this.file == 'RRSEP') {
            refHeader = "RRSEP NO.";
          }
          const rows = list.map((item: any, index: number) => {
            // Determine the first non-null/no empty value among the possible identifiers
            identifier =
              item.prsNo ||
              item.reparNo ||
              item.parNo ||
              item.rrsepNo ||
              item.itrNo ||
              item.icsNo ||
              null;

            return `
              <tr class="report-row ${item.parino ? item.parino : item.icsItemNo}">
                <td>${index + 1}</td>
                <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                ${identifier != null ? `<td>${identifier}</td>` : ''}
                <td>${item.description || 'N/A'}</td>
                <td>${item.serialNo || 'N/A'}</td>
                <td>${item.propertyNo || 'N/A'}</td>
                <!-- <td>${item.qty || 1}</td>
                <td>${item.unit || 'pcs'}</td> -->
                <td>${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                ${showTransferTypeColumn ? `<td>${(item.transferType == 'Others' ? item.transferOthersType : item.transferType) || 'N/A'}</td>` : ''}
                ${showTransferTypeColumn ? `<td>${item.transferReason || 'N/A'}</td>` : ''}
                ${showrReturnTypeColumn ? `<td>${(item.returnType == 'Others' ? item.returnOthersType : item.returnType) || 'N/A'}</td>` : ''} 
                <!-- 
                ${showTransferTypeColumn ? `<td class="text-center">${item.reparNo || item.itrNo || '-'}</td>` : ''}
                ${showrReturnTypeColumn ? `<td class="text-center">${item.prsNo || item.rrsepNo || '-'}</td>` : ''} 
                -->
                <td>${item.issuedBy || 'N/A'}</td>
                <td>${item.receivedBy || 'N/A'}</td>
                ${showApprovedColumn ? `<td>${item.approved ? item.approvedBy : 'N/A'}</td>` : ''}
                <td>${item.createdBy || 'N/A'}</td>
              </tr>`;
          }).join('');

          // Generate the full report content
          const reportContent = `

                <div class="row mb-3">
                  <div class="col text-center">
                    <h5>${this.office}</h5>
                  </div>
                </div>

                    <!-- Table with List of Items -->
                      <table class="table table-bordered table-striped">
                          <thead>
                              <tr class="report-row">
                                  <th>#</th>
                                  <th>DATE ACQUIRED</th>
                                  ${identifier != null ? `<th>${refHeader}</th>` : ''}
                                  <th>DESCRIPTION</th>
                                  <th>SERIAL NO.</th>
                                  <th>PROPERTY NO.</th>
                                  <!-- <th>QTY</th>
                                  <th>UNIT</th> -->
                                  <th>AMMOUNT</th>
                                  ${showTransferTypeColumn ? '<th>TRANSFER TYPE</th>' : ''}
                                  ${showTransferTypeColumn ? '<th>TRANSFER REASON</th>' : ''}
                                  ${showrReturnTypeColumn ? '<th>RETURN TYPE</th>' : ''}
                                  <!-- 
                                  ${showTransferTypeColumn ? '<th>TRANSFER NO.</th>' : ''}
                                  ${showApprovedColumn ? '<th>APPROVED BY</th>' : ''}
                                   -->
                                  <!--
                                   <th>ISSUED BY</th>
                                  -->
                                  <th>${showrReturnTypeColumn ? 'RETURNED BY' : 'ISSUED BY'}</th>
                                  <th>RECEIVED BY</th>
                                  ${showApprovedColumn ? '<th>APPROVED BY</th>' : ''}
                                  <th>CREATED BY</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${rows}
                          </tbody>
                      </table>`;

          // Print the report
          this.printService.printReport(this.file ? `${this.file}` : '', reportContent);
          //PRINT
        },
        error: (err: any) => {
          this.logger.printLogs('e', `Error Fetching ${this.file} under Offices ${this.office}`, err);
          // Optionally, show an error message to the user
        }
      });

    }

  }

  onPrintPropertyLogs(type: string) {
    let title = 'Property Logs';
    let rows;
    let reportContent;

    switch (type) {
      case 'item':
        this.logger.printLogs('i', `PRINT ${type}`, this.propertyCards);



        break;

      default:
        ''
    }

    rows = this.propertyCards.map((item: any, index: number) => {

      return type == 'item' ?
        `<tr class="report-row ${item.pcNo}">
          <td>${this.formatDateTime(item.date_Created)}</td>
          <td>${item.ref || 'N/A'}</td>
          <td>${(item.ref == 'OPR' || item.ref == 'OPTR' || item.ref == 'OPRR' ?
          'OPR-000' + item.refNoFrom : item.refNoFrom) || 'N/A'}</td>
          <td>${((item.ref == 'OPR' || item.ref == 'OPTR') && item.refNoTo ?
          'OPR-000' + item.refNoTo : item.refNoTo) || '-'}</td>
          <td>${item.issued || 'N/A'}</td>
          <td>${item.received || 'N/A'}</td>
          <td>${item.approved || '-'}</td>
          <td>${item.created || 'N/A'}</td>
        </tr>`
        :
        `<tr>
          <td>${this.formatDateTime(item.date_Created)}</td>
          <td>${item.description}</td>
          <td>${item.ref}</td>
          <td>${item.ref == 'OPR' || item.ref == 'OPTR' || item.ref == 'OPRR' ?
          'OPR-000' + item.refNoFrom : item.refNoFrom}</td>
          <td>${((item.ref == 'OPR' || item.ref == 'OPTR') && item.refNoTo ?
          'OPR-000' + item.refNoTo : item.refNoTo) || "-"}</td>
          <td>${item.issued}</td>
          <td>${item.received}</td>
          <td>${item.approved || "-"}</td>
          <td>${item.created}</td>
        </rt>`
        ;
    }).join('');

    if (rows == null || rows == '') {
      Swal.fire('INFORMATION!', 'No Data to print!', 'info');
      return;
    }

    reportContent = `
    <div class="row mb-3">
      <div class="col">
        <h5>${type == 'item' ? this.item.description : this.account.receivedBy + " (" + this.account.received + ")"}</h5>
      </div>
    </div>
    
      <!-- Table with List of Items -->
          <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Date Created</th>
                  ${type == 'account' ? '<th>Description</th>' : ''}
                  <th>Transaction</th>
                  <th>REF. No. From</th>
                  <th>REF. No. To</th>
                  <th>Issued By</th>
                  <th>Recieved By</th>
                  <th>Approved By</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
          </table>`


    this.printService.printReport(title, reportContent);

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
  // Helper function to format the date
  public formatDateTime(date: Date | string | null): string | null {
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

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      // Convert 24-hour format to 12-hour format
      hours = hours % 12 || 12;

      return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
    } else {
      // Handle invalid date
      this.logger.printLogs('w', 'Invalid Date Format', [date]);
      return null;
    }
  }




  onAutoSuggestProperty() {
    this.itemID = null;
    if (!this.propertyCardForm.value['category']) {
      Swal.fire('INFORMATION!', 'Select Category first.', 'info');
      this.propertyKey = null
    } else {
      if (this.propertyCardForm.value['item'] == "") {
        this.items = [];
      } else {
        this.activeInput = 'card';
        if (this.propertyKey !== null) {
          this.api.searchPropertyCard(this.propertyCardForm.value['category'], this.propertyKey)
            .subscribe({
              next: (res) => {
                this.items = res;
                // this.items = res.slice(0, 20);
              },
              error: (err: any) => {
                this.logger.printLogs('e', 'Error Fetching Property Items', err);
                this.items = [];
              }
            });
        }
      }
    }
  }

  onCategoryChange(event: Event) {
    this.category = (event.target as HTMLSelectElement).value;
    this.logger.printLogs('i', 'Selected Category', this.category);
    this.logger.printLogs('i', 'Selected Category', this.propertyCardForm.value['category']);
  }

  selectedItem(item: any): void {

    this.itemID = item.itemID;
    this.item = item;
    this.logger.printLogs('i', 'Selected to Property', item);

    this.propertyCardForm.patchValue({
      item: item.description  // Patch the selected property description to the form
    });

    this.activeInput = null;
    this.items = [];  // Clear the suggestion list after selection
  }

  onAutoSuggestPropertyCardOwner() {
    this.accounts = null;
    if (this.propertyOwnerForm.value['item'] == "") {
      this.accounts = [];
    } else {
      if (this.accountKey !== null) {
        this.api.searchPropertyCardOwner(this.accountKey)
          .subscribe({
            next: (res) => {
              this.accounts = res;
              // this.items = res.slice(0, 20);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Property Card by Owners', err);
              this.accounts = [];
            }
          });
      }
    }
  }

  onAutoSuggestPropertyOwner() {
    this.account = null;
    if (this.propertyOwnerForm.value['item'] == "") {
      this.accounts = [];
    } else {
      if (this.accountKey !== null) {
        this.api.searchPropertyOwner(this.accountKey)
          .subscribe({
            next: (res) => {
              this.accounts = res;
              // this.items = res.slice(0, 20);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Property Owners', err);
              this.accounts = [];
            }
          });
      }
    }
  }

  onAutoSuggestAccount() {
    this.itemID = null;
    if (this.propertyOwnerForm.value['item'] == "") {
      this.items = [];
    } else {
      if (this.accountKey !== null) {
        this.api.searchPropertyOwner(this.accountKey)
          .subscribe({
            next: (res) => {
              this.accounts = res;
              // this.items = res.slice(0, 20);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Property Owners', err);
              this.accounts = [];
            }
          });
      }
    }
  }
  selectedAccount(account: any): void {

    this.account = account;
    this.logger.printLogs('i', 'Selected to Account', account);

    this.propertyOwnerForm.patchValue({
      item: account.accountID + " (" + account.accountName + ")"  // Patch the selected property description to the form
    });

    this.accounts = [];  // Clear the suggestion list after selection
  }

  selectedCardAccount(account: any): void {

    this.logger.printLogs('i', 'Selected to Account', account);

    const receivedBy = account.items.length > 0 ? account.items[0].receivedBy : 'Unknown';

    if (account.items.length > 0) {
      this.account = account.items[0];

      this.propertyOwnerForm.patchValue({
        item: this.account.receivedBy + " (" + this.account.received + ")"  // Patch the selected property description to the form
      });

      this.accounts = [];  // Clear the suggestion list after selection

    }
  }

  onViewPropertyCard() {
    if (!this.propertyCardForm.valid) {
      this.vf.validateFormFields(this.propertyCardForm);
      Swal.fire('Warning!', 'Required filter must be fill!', 'warning');
      return;
    }

    if (this.propertyKey !== null) {

      const key = (this.item.propertyNo !== null && this.item.propertyNo.toString().toLowerCase() !== "n/a")
        ? this.item.propertyNo
        : this.item.qrCode;

      this.api.retreivePropertyCard(this.propertyCardForm.value['category'], key)
        .subscribe({
          next: (res) => {
            this.isLoading = true;

            // Add a delay before setting isLoading to false
            setTimeout(() => {
              this.isLoading = false;
              this.propertyCards = res;
              this.logger.printLogs('i', 'Fetching Property Items', this.propertyCards);
            }, 2000); // 2-second delay (adjust as needed)
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching Property Items', err);
            this.items = [];
          }
        });

    }
  }

  onViewPropertyCardByOwners() {
    if (!this.propertyOwnerForm.valid) {
      this.vf.validateFormFields(this.propertyOwnerForm);
      Swal.fire('Warning!', 'Required filter must be fill!', 'warning');
      return;
    }

    if (this.accountKey !== null) {

      this.api.retreivePropertyCardOwners(this.account.receivedBy)
        .subscribe({
          next: (res) => {
            this.isLoading = true;

            // Add a delay before setting isLoading to false
            setTimeout(() => {
              this.isLoading = false;
              this.propertyCards = res;
              this.logger.printLogs('i', 'Fetching Property Logs by Owners', this.propertyCards);
            }, 2000); // 2-second delay (adjust as needed)
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching Property Logs by Owners', err);
            this.items = [];
          }
        });

    }
  }

  onViewPropertyOwner() {
    if (!this.propertyOwnerForm.valid) {
      this.vf.validateFormFields(this.propertyOwnerForm);
      Swal.fire('Warning!', 'Please select an account first.', 'warning');
      return;
    }

    if (this.accountKey !== null) {

      this.api.retreivePropertyOwner(this.account.accountID)
        .subscribe({
          next: (res) => {
            this.isLoading = true;

            // Add a delay before setting isLoading to false
            setTimeout(() => {
              this.isLoading = false;
              this.propertyCards = res;
              this.logger.printLogs('i', 'Fetching Property Items by Owner', this.propertyCards);
            }, 2000); // 2-second delay (adjust as needed)
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching Property Items', err);
            this.items = [];
          }
        });

    }

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


}
