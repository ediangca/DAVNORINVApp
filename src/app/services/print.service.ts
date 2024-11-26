import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { LogsService } from './logs.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrintService {


  logger: LogsService;


  approvedByProfile: any = [];
  receivedByProfile: any = [];
  issuedByProfile: any = [];
  footer: string = "";

  model: any;



  constructor(private api: ApiService) {
    this.logger = new LogsService();
  }

  setModel(model: any) {
    this.model = model;
    this.logger.printLogs('i', 'model => ', model);
  }

  setReceivedBy(accID: string): Observable<any> {
    this.logger.printLogs('i', 'Retrive Profile Received By ID', accID);
    return this.api.getProfileByUserID(accID).pipe(
      map((res) => {
        this.logger.printLogs('i', 'Retrive Profile Received', res);
        if (!res) {
          this.logger.printLogs('w', 'No Profile found', ['Profile Not Setup']);
          // Return an empty or default profile
          return null;
        }

        this.logger.printLogs('i', 'Profile Received By', res[0] || res);
        this.receivedByProfile = res[0];
        return this.receivedByProfile; // Return the profile
      }),
      catchError((err) => {
        this.logger.printLogs('e', 'Error Fetching Received Profile', err);
        return of(null); // Return a default observable if there's an error
      })
    );
  }


  setIssuedBy(accID: string): Observable<any> {
    this.logger.printLogs('i', 'Retrive Profile Issued By ID', accID);
    return this.api.getProfileByUserID(accID).pipe(
      map((res) => {
        this.logger.printLogs('i', 'Retrive Profile Issued', res);
        if (!res) {
          this.logger.printLogs('w', 'No Profile found', ['Profile Not Setup']);
          // Return an empty or default profile
          return null;
        }

        this.logger.printLogs('i', 'Profile Issued By', res[0] || res);
        this.issuedByProfile = res[0];
        return this.issuedByProfile; // Return the profile
      }),
      catchError((err) => {
        this.logger.printLogs('e', 'Error Fetching Issued Profile', err);
        return of(null); // Return a default observable if there's an error
      })
    );
  }


  setApprovedBy(accID: string): Observable<any> {
    this.logger.printLogs('i', 'Retrive Profile Approved By ID', accID);
    return this.api.getProfileByUserID(accID).pipe(
      map((res) => {
        this.logger.printLogs('i', 'Retrive Profile Issued', res);
        if (!res) {
          this.logger.printLogs('w', 'No Profile found', ['Profile Not Setup']);
          // Return an empty or default profile
          return null;
        }

        this.logger.printLogs('i', 'Profile Issued By', res[0] || res);
        this.approvedByProfile = res[0];
        return this.approvedByProfile; // Return the profile
      }),
      catchError((err) => {
        this.logger.printLogs('e', 'Error Fetching Issued Profile', err);
        return of(null); // Return a default observable if there's an error
      })
    );
  }


  setFooter(title: string) {
    // Normalize title
    title = title.toLocaleLowerCase();
    title = (title === "par" || title === "ics") ? 'par' : title;

    if (title === "par" || title === "ics") {
      this.footer = `
        <div class="row mt-3">
            <div class="col-12 border">
              <p class="fw-bold">Please note: COA circular no. 92-386 Section 149.
                 Measure of liability of the Persons Accountable for supplies or property.</p>
            </div>
            <div class="col-6 border">
              <p class="fw-bold mb-5">Received by:</p>
              <p class="text-center fs-6 fw-bold m-0">${this.receivedByProfile?.fullName || ''}</p>
              <p class="text-center border-top">Signature over Printed Name of End User</p>
            </div>
            <div class="col-6 border">
              <p class="fw-bold mb-5">Issued by:</p>
              <p class="text-center fs-6 fw-bold m-0">${this.issuedByProfile?.fullName || ''}</p>
              <p class="text-center border-top">Signature over Printed Name and/or Property Custodian</p>
            </div>
            <div class="col-6 border py-2">
              <p class="mb-0">Position: <strong>${this.receivedByProfile?.position || ''}</strong></p>
              <p class="mb-0 py-2">Office: <strong>${this.receivedByProfile?.branch || ''} - ${this.receivedByProfile?.department || ''}</strong></p>
              <p class="mb-0">Date:</p>
            </div>
            <div class="col-6 border py-2">
              <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
              <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
              <p class="mb-0">Date: <strong>${new Date().toDateString()}</strong></p>
            </div>
          </div>`;
    } else if (title === "ptr" || title === "itr") {
      this.footer = `
        <div class="row mt-3">
          <div class="col-2 border">
            <p class="fw-bold mb-3">Reason:</p>
          </div>
          <div class="col-10 border">
            <p class="m-0"><em> ${this.model ? this.model.reason : ''} </em></p>
          </div>
          <div class="col-4 border">
            <p class="fw-bold mb-5">Approved by:</p>
            <p class="text-center fs-6 fw-bold m-0">${this.approvedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>
          <div class="col-4 border">
            <p class="fw-bold mb-5">Issued by:</p>
            <p class="text-center fs-6 fw-bold m-0">${this.issuedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name and/or Property Custodian</p>
          </div>
          <div class="col-4 border">
            <p class="fw-bold  mb-5">Received by:</p>
            <p class="text-center fs-6 fw-bold m-0">${this.receivedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>
          <div class="col-4 border py-2">
            <p class="mb-0">Position: <strong>${this.approvedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.approvedByProfile?.branch || ''} - ${this.approvedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date:</p>
          </div>
          <div class="col-4 border py-2">
            <p class="mb-0">Position: <strong>${this.receivedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.receivedByProfile?.branch || ''} - ${this.receivedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date:</p>
          </div>
          <div class="col-4 border py-2">
            <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date: <strong>${new Date().toDateString()}</strong></p>
          </div>
        </div>`;
    } else {
      this.footer = ``;
    }
  }


  printReport(title: string, reportContent: string): void {
    const printWindow = window.open('', '_blank');
    this.setFooter(title);
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>${title} Report</title>

          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <style>
              @media print {
                .footer {
                  position: fixed;
                  bottom: 0;
                  left: 0;
                  right: 0;
                }
                .item-row > th, .item-row > td{
                  font-size: 12px;
                }
                p{
                  font-size: 12px;
                }

                .watermark {
                  position: absolute;
                  top: 30%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-size: 8rem;
                  color: rgba(0, 0, 0, 0.1); /* Adjust color and opacity for watermark effect */
                  z-index: 9999; /* Ensure watermark is behind other content */
                  pointer-events: none; /* Prevent any interaction with the watermark */
                  font-weight: bold;
                  user-select: none;
                  transform: rotate(-45deg) translate(-50%, -50%);
                }
              }
            </style>
          </head>
        <body>
          <div class="container-fluid">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <img src="../../../assets/images/logo/ddn-logo.gif" alt="DDNLogo Left" style="height: 80px;">
              <div>
                <h6 style="text-align: center; flex-grow: 1;">Republic of the Philippines <br>
                Provincial Goverment of Davao del Norte <br>
                Goverment Center, Mankilam, Tagum City</h6>
              </div>
              <img src="../../../assets/images/logo/logo-lg.png" alt="Logo Left" style="height: 80px;">
            </div>

            <div class="row mb-3">
              <div class="col text-center">
                <h5>${this.getTitleDetail(title)}</h5>
              </div>
            </div>

              ${reportContent}


            <!-- Footer -->
            <div class="footer p-2">
                ${this.footer}

                <!-- Signature Section -->
                <hr>
                <p>&copy; ${new Date().getFullYear()} Provincial Government of
                    Davao
                    del Norte. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
      printWindow.onclose = () => {
        this.receivedByProfile = [];
        this.issuedByProfile = [];
      }
      this.receivedByProfile = [];
      this.issuedByProfile = [];



    }
  }


  getTitleDetail(title: string): String {

    switch (title.toLowerCase()) {
      case 'par':
        return 'PROPERTY ACKNOWLEDGEMENT RECEIPT'
      case 'ics':
        return 'INVENTORY CUSTODIAN SLIP'
      case 're-':
        return 'PROPERTY TRANSFER RECEIPT'
      case 'itr':
        return 'INVENTORY TRANFER REPORT'
      case 'ptr':
        return 'PROPERTY TRANSFER REPORT'
      default:
        return 'TITLE'
    }
  }
}

