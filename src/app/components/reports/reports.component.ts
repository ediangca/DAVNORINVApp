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
    ICS: 'Inventory Custodian Slip',
    PTR: 'Property Transfer Receipt',
    ITR: 'Inventory Transfer Record',
    PRS: 'Property Return Slip',
    RRSEP: 'Receipt Return Semi-Expandable Property'
  };



  filterForm!: FormGroup;
  offices: any = [];
  items: any = []

  isLoading: boolean = true;
  file: string | null = null;


  constructor(private fb: FormBuilder, private api: ApiService, private store: StoreService,
    private printService: PrintService, private logger: LogsService) {
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
        this.api.getAllPARItemByOffice(office).subscribe({
          next: (res) => {
            this.items = res; // Update the offices property
            this.logger.printLogs('i', `List of All ${this.file} Items under Offices under${office}`, res);


            //PRINT
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching Offices', err);
            // Optionally, show an error message to the user
          }
        });
      } else {
        this.validateFormFields(this.filterForm);
      }

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
