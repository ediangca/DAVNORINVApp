import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { StoreService } from '../../services/store.service';
import { PrintService } from '../../services/print.service';
import { LogsService } from '../../services/logs.service';


import Swal from 'sweetalert2';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

  reportsMap: { [key: string]: string } = {
    PAR: 'Property Acknowledgement Receipt',
    PTR: 'Property Transfer Receipt',
    PRS: 'Property Return Slip',
    ICS: 'Inventory Custodian Slip',
    ITR: 'Inventory Transfer Record',
    RRSEP: 'Receipt Return Semi-Expandable Property',
    SOPA5: 'Summary of Property Above 50k',
    SOPB5: 'Summary of Property Below 50k',
  };



  filterForm!: FormGroup;
  offices: any = [];
  office: string | null = null;
  items: any = []
  userProfile: any;

  isLoading: boolean = true;
  file: string | null = null;

  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private printService: PrintService,
    private logger: LogsService) {
    this.ngOnInit();
  }

  ngOnInit(): void {

    this.checkPrivileges();

    this.filterForm = this.fb.group({
      office: ['', Validators.required]
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
    this.canCreate = this.store.isAllowedAction('REPORT', 'create');
    this.canRetrieve = this.store.isAllowedAction('REPORT', 'retrieve');
    this.canUpdate = this.store.isAllowedAction('REPORT', 'update');
    this.canDelete = this.store.isAllowedAction('REPORT', 'delete');
    this.canPost = this.store.isAllowedAction('REPORT', 'post');
    this.canUnpost = this.store.isAllowedAction('REPORT', 'unpost');

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

  onViewReport(reportName: string) {


    this.logger.printLogs('i', 'Allow Report Retrieve all Office', this.canRetrieve);
    this.logger.printLogs('i', 'Run Report', reportName);
    this.file = reportName;

    if (this.canRetrieve) {
      // this.getAllOffice(reportName);

      this.api.getAllOffices(reportName).subscribe({
        next: (res) => {
          this.offices = res; // Update the offices property
          this.logger.printLogs('i', `List of Offices under module ${reportName}`, res);

          // Open the modal after successfully fetching offices
          this.openModal(this.filterModal);
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

  objectKeys(obj: { [key: string]: any }): string[] {
    return Object.keys(obj);
  }


  onPrint() {
    if (this.file) {
  
      
      if (!this.canRetrieve && !this.filterForm.valid) {
        this.validateFormFields(this.filterForm);
      }

      
      this.api.getAllItemByOffice(this.file, this.office!).subscribe({
        next: (res) => {
          this.items = res; // Update the offices property
          this.logger.printLogs('i', `List of All ${this.file} Items under Offices under ${this.office}`, res);

          if(this.items.length < 1){
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
                                  <th>ISSUED BY</th>
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
          this.printService.printReport('', reportContent);
          //PRINT
        },
        error: (err: any) => {
          this.logger.printLogs('e', `Error Fetching PAR Items under Offices ${this.office}`, err);
          // Optionally, show an error message to the user
        }
      });

    }

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
