import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
export class ReportsComponent implements OnInit {

  @ViewChild('FilterBranch') filterModal!: ElementRef;

  reportsMap: { [key: string]: string } = {
    PAR: 'Property Acknowledgement Receipt',
    PTR: 'Property Transfer Receipt',
    PRS: 'Property Return Slip',
    ICS: 'Inventory Custodian Slip',
    ITR: 'Inventory Transfer Record',
    RRSEP: 'Receipt Return Semi-Expandable Property'
  };



  filterForm!: FormGroup;
  offices: any = [];
  items: any = []

  isLoading: boolean = true;
  file: string | null = null;


  constructor(private fb: FormBuilder, private api: ApiService,
    private store: StoreService, private printService: PrintService,
    private logger: LogsService) {
    this.ngOnInit();
  }


  ngOnInit(): void {

    this.filterForm = this.fb.group({
      office: ['', Validators.required]
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
    this.logger.printLogs('i', 'Run Report', reportName);
    this.file = reportName;
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

  }

  objectKeys(obj: { [key: string]: any }): string[] {
    return Object.keys(obj);
  }


  onPrint() {
    if (this.file) {
      if (this.filterForm.valid) {
        let office = this.filterForm.value['office'];
        let withaApprovedBy = '';

        this.api.getAllItemByOffice(this.file, office).subscribe({
          next: (res) => {
            this.items = res; // Update the offices property
            this.logger.printLogs('i', `List of All ${this.file} Items under Offices under${office}`, res);


            // Ensure par.parItems is an array or default to an empty array
            const list = Array.isArray(this.items) ? this.items : [];

            const showApprovedColumn = list.some((item: any) => item.approved);

            // Create the table rows dynamically
            const rows = list.map((item: any, index: number) => `
                <tr ${item.parino ? `class="${item.parino} item-row"` : ''}>
                  <td>${index + 1}</td>
                  <td>${this.formatDate(item.date_Acquired) || 'N/A'}</td>
                  <td>${item.description || 'N/A'}</td>
                  <td>${item.serialNo || 'N/A'}</td>
                  <!-- <td>${item.propertyNo || 'N/A'}</td>
                  <td>${item.qty || '1'}</td> -->
                  <td>${item.unit || 'pcs'}</td>
                  <td>
                  ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>${item.issuedBy || 'N/A'}</td>
                  <td>${item.receivedBy || 'N/A'}</td>
                  ${showApprovedColumn ? `<td>${item.approved ? item.approvedBy : 'N/A'}</td>` : ''}
                  <td>${item.createdBy || 'N/A'}</td>
                </tr>`).join('');


            // Generate the full report content
            const reportContent = `

                  <div class="row mb-3">
                    <div class="col text-center">
                      <h5>${office}</h5>
                    </div>
                  </div>

                      <!-- Table with List of Items -->
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr class="item-row">
                                    <th>#</th>
                                    <th>DATE ACQUIRED</th>
                                    <th>DESCRIPTION</th>
                                    <th>SERIAL NO.</th>
                                    <th>PROPERTY NO.</th>
                                    <!-- <th>QTY</th>
                                    <th>UNIT</th> -->
                                    <th>AMMOUNT</th>
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
            this.logger.printLogs('e', `Error Fetching PAR Items under Offices ${office}`, err);
            // Optionally, show an error message to the user
          }
        });
      } else {
        this.validateFormFields(this.filterForm);
      }

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
