import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxScannerQrcodeComponent, NgxScannerQrcodeModule } from 'ngx-scanner-qrcode';
import { ApiService } from '../../services/api.service';
import { StoreService } from '../../services/store.service';
import ValidateForm from '../../helpers/validateForm';
import { AuthService } from '../../services/auth.service';
import { PrintService } from '../../services/print.service';
import { LogsService } from '../../services/logs.service';

@Component({
  selector: 'app-others',
  standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxScannerQrcodeModule],
  templateUrl: './others.component.html',
  styleUrl: './others.component.css'
})
export class OthersComponent implements OnInit {

  isLoading: boolean = true;
  others: any = [];

  searchKey = ''
  
  // Privilege Action Access
  canCreate: boolean = false;
  canRetrieve: boolean = false;
  canUpdate: boolean = false;
  canDelete: boolean = false;
  canPost: boolean = false;
  canUnpost: boolean = false;

  canPTR: boolean = false;

  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  fn: string = 'start';
  purpose: string = 'retreive';
 constructor(private fb: FormBuilder, private api: ApiService, private store: StoreService,
    private vf: ValidateForm, private auth: AuthService, private cdr: ChangeDetectorRef,
    private printService: PrintService, private logger: LogsService
  ) {
    this.ngOnInit();
  }

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }


onSearch() {
// throw new Error('Method not implemented.');
}
onAddOthers() {
// throw new Error('Method not implemented.');
}
onKeyUp($event: KeyboardEvent) {
// throw new Error('Method not implemented.');
}



// Handle start/stop of QR scanning
public handle(scannerAction: any, fn: string, purpose: string): void {
  this.scannerAction = scannerAction;
  this.fn = fn;
  this.purpose = purpose;

  // Show the scanner modal
  // this.onScanQR(); 

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

}
