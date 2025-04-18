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
    title = (title === "par" || title === "ics" || title === "opr") ? 'standard' : title;

    if (title === "standard") {
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
              <p class="mb-0">Date: </p>
            </div>
          </div>`;

      // <p class="mb-0">Date: <strong>${new Date().toDateString()}</strong></p>
    } else if (title === "ptr" || title === "itr" || title === "optr") {
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
            <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date:</p>
          </div>
          <div class="col-4 border py-2">
            <p class="mb-0">Position: <strong>${this.receivedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.receivedByProfile?.branch || ''} - ${this.receivedByProfile?.department || ''}</strong></p> 
            <p class="mb-0">Date: </p>
          </div>
        </div>`;
    } else if (title === "prs") {
      this.footer = `
        <div class="row mt-3">
          <div class="col-6 border">
            <p class="mb-5">I HEREBY CERTIFY that I have this <br> RETURNED to <strong> ${this.receivedByProfile?.fullName || ''} </strong>,
            <em>Provincial General Services Officer</em>, <br> the items/articles described above.</p>
            <p class="text-center fs-6 fw-bold m-0">${this.issuedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>
          <div class="col-6 border">
            <p class="mb-5">I HEREBY CERTIFY that I have this <br> RECEIVED from <strong> ${this.issuedByProfile?.fullName || ''} </strong>,
            <em>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</em>  <br> the items/articles described above. </p>
            <p class="text-center fs-6 fw-bold m-0">${this.receivedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>
          <!--
          <div class="col-6 border py-2">
            <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date:</p>
          </div>
          <div class="col-6 border py-2">
            <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date: </p>
          </div>
          -->
        </div>`;
    } else if (title === "rrsep") {
      this.footer = `
        <div class="row mt-3">
          <div class="col-6 border">
            <p class="mb-5 fw-bold">Return By:</p>
            <p class="text-center fs-6 fw-bold m-0">${this.issuedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>
          <div class="col-6 border">
            <p class="mb-5 fw-bold">Received By:</p>
            <p class="text-center fs-6 fw-bold m-0">${this.receivedByProfile?.fullName || ''}</p>
            <p class="text-center border-top">Signature over Printed Name of End User</p>
          </div>

          <div class="col-6 border py-2">
            <p class="mb-0">Position: <strong>${this.issuedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.issuedByProfile?.branch || ''} - ${this.issuedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date:</p>
          </div>
          <div class="col-6 border py-2">
            <p class="mb-0">Position: <strong>${this.receivedByProfile?.position || ''}</strong></p>
            <p class="mb-0 py-2">Office: <strong>${this.receivedByProfile?.branch || ''} - ${this.receivedByProfile?.department || ''}</strong></p>
            <p class="mb-0">Date: </p>
          </div>

        </div>`;
    } else {
      this.footer = ``;
    }
  }


  printReport(title: string, reportContent: string): void {

    let titleContent = '<hr>';
    // Create an iframe element
    const iframe = document.createElement('iframe');

    // Style the iframe to be invisible
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    // Append the iframe to the body
    document.body.appendChild(iframe);

    if (!(title == '')) {
      titleContent = `<div class="row mb-3">
            <div class="col text-center">
              <h5>${this.getTitleDetail(title) || ''}</h5>
            </div>
          </div>`
    }
    this.setFooter(title);


    // Access the iframe's document
    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    iframeDoc!.open();

    // const bootstrapLink = iframeDoc!.createElement("link");
    // bootstrapLink.rel = "stylesheet";
    // bootstrapLink.href = "https://davnorsystems.gov.ph/DDNAEINV/assets/bootstrap/dist/css/bootstrap.min.css";
    // bootstrapLink.type = "text/css";
    // bootstrapLink.onload = () => this.logger.printLogs('i', "Bootstrap loaded!");
    // iframeDoc!.head.appendChild(bootstrapLink);


    iframeDoc!.write(`
    <html>
      <head>
        <title>${title} Report</title>
        <link href="https://davnorsystems.gov.ph/DDNAEINV/assets/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          @media print {
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
            }
            .item-row > th, .item-row > td {
              font-size: 11px;
            }
            .report-row > th {
              font-size: 10px;
            }
            .report-row  > td {
              font-size: 8px;
            }
            p {
              font-size: 11px;
            }
            .watermark {
              position: absolute;
              top: 30%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 8rem;
              color: rgba(0, 0, 0, 0.1);
              z-index: 9999;
              pointer-events: none;
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
            <img src="https://davnorsystems.gov.ph/DDNAEINV/assets/images/logo/ddn-logo.gif" alt="DDNLogo Left" style="height: 80px;">
            <div>
              <h6 style="text-align: center; flex-grow: 1;">
                Republic of the Philippines <br>
                Provincial Government of Davao del Norte <br>
                Government Center, Mankilam, Tagum City
              </h6>
            </div>
            <img src="https://davnorsystems.gov.ph/DDNAEINV/assets/images/logo/logo-lg.png" alt="Logo Right" style="height: 80px;">
            <!-- <img src="https://davnorsystems.gov.ph/DDNAEINV/assets/images/logo/logo-lg1.png" alt="Logo Right" style="height: 80px;"> -->
          </div>
         
          <hr>
          ${titleContent}
          ${reportContent}

            ${this.footer}

            <div class="row">
              <div class="col">
                <hr>
                <p>&copy; ${new Date().getFullYear()} Provincial Government of Davao del Norte. All rights reserved.</p>
              </div>
            </div>


        </div>
      </body>
    </html>
  `);

    // Close the document stream
    iframeDoc!.close();
    // Trigger the print
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 500);

    // Clean up the iframe after printing
    iframe.contentWindow!.onafterprint = () => document.body.removeChild(iframe);


    // const printWindow = window.open('', '_blank');
    // this.setFooter(title);
    // if (printWindow) {
    //   printWindow.document.write(`
    //     <html>
    //     <head>
    //       <title>${title} Report</title>

    //       <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    //         <style>
    //           @media print {
    //             .footer {
    //               position: fixed;
    //               bottom: 0;
    //               left: 0;
    //               right: 0;
    //             }
    //             .item-row > th, .item-row > td{
    //               font-size: 12px;
    //             }
    //             p{
    //               font-size: 12px;
    //             }

    //             .watermark {
    //               position: absolute;
    //               top: 30%;
    //               left: 50%;
    //               transform: translate(-50%, -50%);
    //               font-size: 8rem;
    //               color: rgba(0, 0, 0, 0.1); /* Adjust color and opacity for watermark effect */
    //               z-index: 9999; /* Ensure watermark is behind other content */
    //               pointer-events: none; /* Prevent any interaction with the watermark */
    //               font-weight: bold;
    //               user-select: none;
    //               transform: rotate(-45deg) translate(-50%, -50%);
    //             }
    //           }
    //         </style>
    //       </head>
    //     <body>
    //       <div class="container-fluid">

    //         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    //           <img src="../../../assets/images/logo/ddn-logo.gif" alt="DDNLogo Left" style="height: 80px;">
    //           <div>
    //             <h6 style="text-align: center; flex-grow: 1;">Republic of the Philippines <br>
    //             Provincial Goverment of Davao del Norte <br>
    //             Goverment Center, Mankilam, Tagum City</h6>
    //           </div>
    //           <img src="../../../assets/images/logo/logo-lg.png" alt="Logo Left" style="height: 80px;">
    //         </div>

    //         <div class="row mb-3">
    //           <div class="col text-center">
    //             <h5>${this.getTitleDetail(title)}</h5>
    //           </div>
    //         </div>

    //           ${reportContent}


    //         <!-- Footer -->
    //         <div class="footer p-2">
    //             ${this.footer}

    //             <!-- Signature Section -->
    //             <hr>
    //             <p>&copy; ${new Date().getFullYear()} Provincial Government of
    //                 Davao
    //                 del Norte. All rights reserved.</p>
    //         </div>
    //       </div>
    //     </body>
    //     </html>
    //   `);
    //   printWindow.document.close();
    //   printWindow.focus();
    //   printWindow.print();
    //   printWindow.onafterprint = () => printWindow.close();
    //   printWindow.onclose = () => {
    //     this.receivedByProfile = [];
    //     this.issuedByProfile = [];
    //   }
    //   this.receivedByProfile = [];
    //   this.issuedByProfile = [];
    // }
  }


  getTitleDetail(title: string): String | null {

    switch (title.toLowerCase()) {
      case 'par':
        return 'PROPERTY ACKNOWLEDGEMENT RECEIPT'
      case 'ics':
        return 'INVENTORY CUSTODIAN SLIP'
      case 'opr':
        return 'OTHER PROPERTY RECEIPT'
      case 'ptr':
        return 'PROPERTY TRANSFER RECEIPT'
      case 'itr':
        return 'INVENTORY TRANFER REPORT'
      case 'optr':
        return 'OTHER PROPERTY TRANSFER REPORT'
      case 'prs':
        return 'PROPERTY RETURN SLIP'
      case 'rrsep':
        return 'RECEIPT RETURN SEMI-EXPANDABLE PROPERTY'
      case 'oprr':
        return 'OTHER PROPERTY RETURN REPORT'

      // Reports
      case 'spar':
        return 'SUMMARY OF PROPERTY ACKNOWLEDGEMENT RECEIPT'
      case 'sics':
        return 'SUMMARY OF INVENTORY CUSTODIAN SLIP'
      case 'sopr':
        return 'SUMMARY OF OTHER PROPERTY RECEIPT'
      case 'sptr':
        return 'SUMMARY OF PROPERTY TRANSFER RECEIPT'
      case 'sitr':
        return 'SUMMARY OF INVENTORY TRANFER REPORT'
      case 'soptr':
        return 'SUMMARY OF OTHER PROPERTY TRANSFER REPORT'
      case 'sprs':
        return 'SUMMARY OF PROPERTY RETURN SLIP'
      case 'srrsep':
        return 'SUMMARY OF RECEIPT RETURN SEMI-EXPANDABLE PROPERTY'
      case 'soprr':
        return 'SUMMARY OF OTHER PROPERTY RETURN REPORT'



      default:
        return title
    }
  }
}

