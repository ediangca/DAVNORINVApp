import { AfterViewInit, ElementRef, Component, HostListener, OnInit, Renderer2, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { StoreService } from '../../services/store.service';
import { AppComponent } from '../../app.component';
import { WidgetComponent } from '../widget/widget.component';

import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';

import AOS from 'aos';
declare var bootstrap: any;
import { ProfileComponent } from '../userprofile/profile.component';
import { LOAD_WASM, NgxScannerQrcodeComponent, NgxScannerQrcodeModule, NgxScannerQrcodeService, ScannerQRCodeConfig, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import Swal from 'sweetalert2';

import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, ReactiveFormsModule, HttpClientModule, MenuComponent, WidgetComponent, NgxScannerQrcodeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('QRScannerForm', { static: false }) QRScannerModal!: ElementRef;
  @ViewChild('scannerAction') scannerAction!: NgxScannerQrcodeComponent;
  @ViewChild('itemDetailsModalForm') itemDetailsModal!: ElementRef;

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#front_and_back_camera
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth,  // Use dynamic width, it adjusts to the device size
        height: window.innerHeight, // Set dynamic height as well
        facingMode: 'environment',  // Prefer the back camera for scanning
      },
    },
    fps: 10, // Adjust frame rate if needed
    isBeep: true, // Disable beep for testing
    canvasStyles: [
      { /* layer */
        lineWidth: 3,               // Increase line width to improve visibility on canvas
        fillStyle: 'rgba(0, 149, 6, 0.5)',  // Apply semi-transparent background for the layer
        strokeStyle: '#009506',
        globalCompositeOperation: 'source-over', // Make sure layers do not overwrite each other
      },
      { /* text */
        font: '24px Arial, sans-serif',  // Increase font size for better readability
        fillStyle: '#ff0000',             // Keep bright color for contrast
        strokeStyle: '#ffffff',         // White stroke for contrast on dark background
        lineWidth: 2,                   // Increase stroke width around the text for visibility
        textAlign: 'center',            // Center the text if needed
        textBaseline: 'middle',         // Align text to the middle of the canvas
      },
    ],
  };

  fn: string = 'start';
  onItemFound: boolean = false;
  item: any | null | undefined;
  itemKeys: string[] = [];

  accID: string | undefined;

  usernameFromToken: string = 'User Account';
  roleNoFromToken: string = "Role";

  username: string = "";
  role: string = "";

  userAccount: any;
  userProfile: any;

  fullname: string = "Account";

  pageTitle: string = "Dashboard";
  pageDesc: string = "";
  curYear: number = new Date().getFullYear();
  header: boolean | null = false;
  windowWidth: number = 0;

  isMinimizeSideBar = false;
  isOpen = false;

  prevBtn!: HTMLButtonElement;
  nextBtn!: HTMLButtonElement;
  track!: HTMLElement;
  cards!: HTMLElement[];
  currentIndex = 0;

  qrCode = ''
  currentDevice = 'environment'; // Back camera

  notifications = [
    {
      title: 'Welcome Greetings',
      time: '2024-03-01 09:30',
      message: 'Introducing the app titled \'DDNAEINV - Asset and Equipment Inventory\''
    },
    {
      title: 'System Update',
      time: '2024-06-01 09:30',
      message: 'The system will undergo maintenance at 10:00 PM tonight.'
    },
    {
      title: 'New Message',
      time: '2024-06-01 08:15',
      message: 'You have received a new message from the admin.'
    },
    {
      title: 'Inventory Alert',
      time: '2024-05-31 17:45',
      message: 'A new item has been added to your inventory.'
    },
    {
      title: 'Password Expiry',
      time: '2024-05-30 12:00',
      message: 'Your password will expire in 5 days. Please update it soon.'
    },
    {
      title: 'Approval Needed',
      time: '2024-05-29 16:20',
      message: 'A request is pending your approval.'
    },
    {
      title: 'Backup Completed',
      time: '2024-05-28 22:10',
      message: 'The scheduled backup was completed successfully.'
    },
    {
      title: 'Login Alert',
      time: '2024-05-28 07:55',
      message: 'A new login to your account was detected.'
    },
    {
      title: 'Policy Update',
      time: '2024-05-27 14:30',
      message: 'The privacy policy has been updated. Please review the changes.'
    },
    {
      title: 'Low Stock Warning',
      time: '2024-05-26 11:40',
      message: 'Some items in your inventory are running low.'
    },
    {
      title: 'Event Reminder',
      time: '2024-05-25 09:00',
      message: 'Don\'t forget the team meeting scheduled for tomorrow.'
    }
  ];

  constructor(
    public ac: AppComponent, private titleService: Title,
    private route: ActivatedRoute, private router: Router,
    private api: ApiService, private auth: AuthService,
    public store: StoreService, private logger: LogsService,
    private cdr: ChangeDetectorRef, private scannerService: NgxScannerQrcodeService
  ) {
    this.ngOnInit();
  }

  ngOnInit() {
    LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe();
    // this.setupSidebarToggle();
    this.getUserProfile();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root)
    ).subscribe(route => {
      const title: string = this.getTitle(route);
      this.logger.printLogs('i', 'Title', [title]);
      this.header = title.toLowerCase() === "dashboard";
      this.toggleHeaderAndWidgetDisplay(this.header);
      this.setTitle(title);


      this.setTitle(title);  // Or false, based on your requirement
    });
    this.setupModalClose();
    this.logger.printLogs('i', 'Hide Header and Widget:', [this.header]);


    // LOAD_WASM('assets/ngx-scanner-qrcode/wasm/ngx-scanner-qrcode.wasm').subscribe();
  }

  ngAfterViewInit(): void {
    AOS.init();
  }

  openModal(modalElement: ElementRef) {
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement, { backdrop: 'static' });
      modal.show();

    }
  }

  setupModalClose() {

    const QRScannerModal = document.getElementById('QRScannerForm')!;
    if (QRScannerModal) {

      QRScannerModal.addEventListener('hidden.bs.modal', () => {
        this.onCloseQRScanning(this.scannerAction)
      });
    }
  }

  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }

  toggleHeaderAndWidgetDisplay(show: boolean) {
    const items = document.querySelectorAll('.header, .widget');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = show ? 'block' : 'none';
    });
  }

  toggleAccordion() {
    this.isOpen = !this.isOpen; // Toggle the accordion state
  }

  private getTitle(route: ActivatedRouteSnapshot): string {
    let title = route.data['title'];
    if (route.firstChild) {
      title = this.getTitle(route.firstChild) || title;
    }
    return title || 'HOME'; // Default title if none found
  }

  setTitle(pageTitle: string) {

    switch (pageTitle) {
      case 'PAR':
        this.pageDesc = '(Property Acknowledgment Receipt)';
        break;
      case 'ICS':
        this.pageDesc = '(Inventory Custodian Slip)';
        break;
      case 'OPR':
        this.pageDesc = '(Other Property Receipt)';
        break;
      case 'PTR':
        this.pageDesc = '(Property Transfer Receipt)';
        break;
      case 'ITR':
        this.pageDesc = '(Inventory Transfer Report)';
        break;
      case 'OPTR':
        this.pageDesc = '(Other Property Transfer Report)';
        break;
      case 'PRS':
        this.pageDesc = '(Property Return Slip)';
        break;
      case 'RRSEP':
        this.pageDesc = '(Receipt Return Semi-Expandable Property)';
        break;
      case 'OPRR':
        this.pageDesc = '(Other Property Return Report)';
        break;
      default:
        this.pageDesc = ''; // Optional fallback
    }

    this.pageTitle = pageTitle


    this.titleService.setTitle(`${this.ac.appName}  -  ${pageTitle} ${this.pageDesc} `);
  }

  getPageTitle() {
    return this.pageTitle;
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const target = event.target as Window;
    this.windowWidth = target.innerWidth;
  }

  getUserProfile() {
    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.logger.printLogs('i', 'Retrieve Role', [this.roleNoFromToken]);
    this.route.data.subscribe(data => {
      this.logger.printLogs('i', 'Retrieve Username', [data['username']]);
      this.usernameFromToken = data['username'];
      if (!this.usernameFromToken) {
        this.logger.printLogs('w', 'Not Found Username', ['No username available.']);
      }
    });

    // Get Decoded unique_name from token

    this.store.getFullnameForStore()
      .subscribe(res => {
        this.username = res || this.usernameFromToken;
      });

    // Get Decoded role from token
    this.store.getRoleFromStore()
      .subscribe(res => {
        this.role = res || this.roleNoFromToken;
      });

    this.logger.printLogs('i', 'Retrieve Role', [this.roleNoFromToken]);
    if (this.username)
      //Populate all Users
      this.api.getAccIDByUsername(this.username)
        .subscribe({
          next: (res: any) => {
            this.userAccount = res[0];
            this.logger.printLogs('i', 'Account', this.userAccount);

            this.store.setUserAccount(this.userAccount);
            this.accID = this.userAccount.userID;

            this.api.getProfileByUserID(this.accID!)
              .subscribe({
                next: (res) => {
                  if (!res[0]) {
                    this.logger.printLogs('w', 'No Profile found', ['Profile Not Setup']);
                    // this.router.navigate(['dashboard/profile']);
                    this.router.navigate(['dashboard/profile'], {
                      queryParams: { showProfileForm: true }
                    });
                    return
                  }

                  this.userProfile = res[0];
                  this.logger.printLogs('i', 'Profile', this.userProfile);

                  this.store.setUserProfile(this.userProfile);
                  this.fullname = this.userProfile.fullName || this.username;

                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Fetching Profile', err);
                }
              });
          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Fetching Account ID Denied', err);
          }
        });

  }


  toggleSidebarItems() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-mini');
      this.isMinimizeSideBar = sidebar.classList.contains('sidebar-mini');
      this.logger.printLogs("i", "Minimize Sidebar : ", this.isMinimizeSideBar);
    }
  }

  public toggleSidebar(isMinimizeSideBar: boolean) {
    if (window.innerWidth <= 768) {
      this.isMinimizeSideBar = isMinimizeSideBar;
    }
  }

  expandSidebar() {
    const items = document.querySelectorAll('.item-name, .default-icon, .logo-title');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'inline';
    });
    const miniIcons = document.querySelectorAll('.mini-icon');
    miniIcons.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'none';
    });
  }

  minimizeSidebar() {
    const items = document.querySelectorAll('.item-name, .default-icon, .logo-title');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'none';
    });
    const miniIcons = document.querySelectorAll('.mini-icon');
    miniIcons.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'inline';
    });
  }

  logout() {
    this.store.clearStore();
    this.auth.logout();
  }

  onCloseQRScanning(scannerAction: any) {
    // Close the modal
    this.closeModal(this.QRScannerModal!);
    this.fn = 'stop';
    scannerAction.stop();
    scannerAction.isStart = false;
    scannerAction.isLoading = false;

  }


  // Handle start/stop of QR scanning
  public handle(scannerAction: any, fn: string, purpose: string): void {
    this.scannerAction = scannerAction;

    this.fn = fn;

    this.logger.printLogs('i', 'Scanner', `fn : ${fn}`)

    this.onScanQR(); // Show the scanner modal

    // Function to select a device, preferring the back camera
    const playDeviceFacingBack = (devices: any[]) => {
      const device = devices.find(f => /back|rear|environment/gi.test(f.label));
      scannerAction.playDevice(device ? device.deviceId : devices[0].deviceId);
    };

    // Start or stop the scanning action
    if (fn === 'start') {
      scannerAction[fn](playDeviceFacingBack).subscribe(
        (r: any) => this.logger.printLogs('i', `SCANNING START ${fn}`, r),
        alert
      );
      this.cdr.detectChanges();     // Trigger change detection to update button state
    } else {
      scannerAction[fn]().subscribe((r: any) => this.logger.printLogs('i', fn, r), alert);
      this.cdr.detectChanges();     // Trigger change detection to update button state
    }
  }


  onScanQR() {

    const QRmodal = new bootstrap.Modal(this.QRScannerModal.nativeElement);
    QRmodal.show();


    this.qrCode = ''; // Clear previous scans
    this.onItemFound = false;

    // Wait for modal to open before starting scanner
    setTimeout(() => {
      const modal = document.getElementById('QRScannerForm');
      if (modal) {
        modal.setAttribute('aria-hidden', 'false'); // Make sure modal is visible
      }
    }, 300);


  }
  // Event handler when QR code is scanned
  public onEvent(event: ScannerQRCodeResult[], action?: any): void {

    this.onItemFound = false;
    if (event && event.length) {
      if (event) {
        action.pause(); // Pause scanning if needed

        this.logger.printLogs('i', 'QR value', event[0].value);
        this.logger.printLogs('i', 'Scanned Data:', event); // Handle scanned results here

        this.qrCode = event[0].value
        this.validateQR(this.qrCode);

      }

    }
  }

  // public onScanSuccess(event: ScannerQRCodeResult[]): void {
  //   if (event.length > 0) {
  //     this.logger.printLogs('i', 'Scanned QR Code:', event[0].value); // Access the scanned result
  //   }
  // }
  public onScanSuccess(event: any): void {
    this.logger.printLogs('i', 'Scan Event Data:', event);
  }
  // get itemKeys(): string[] {
  //   return this.item ? Object.keys(this.item) : [];
  // }

  resumeScanning(scannerAction: any): void {
    // Add any conditions or user prompts if needed before resuming

    scannerAction.play().subscribe(
      (r: any) => this.logger.printLogs('i', 'Resuming Scan:', r),
      (error: any) => this.logger.printLogs('w', 'Resuming Scan Denied', error)
    );
  }

  // onEnter(event: KeyboardEvent): void {
  //   const inputValue = (event.target as HTMLInputElement).value; // Get the input value
  //   this.logger.printLogs('i', 'Enter key pressed. Value:', inputValue);

  //   // Add your logic here
  //   if (inputValue.trim() !== '') {
  //     // Perform the search or any action
  //       this.validateQR(inputValue)
  //   }
  // }
  onEnter(): void {
    this.logger.printLogs('i', 'Enter key pressed. QR Value:', this.qrCode);

    // Add your logic here
    if (this.qrCode.trim() !== '') {
      // Example: Perform a search action
      this.logger.printLogs('i', 'Performing search for:', this.qrCode);
      this.validateQR(this.qrCode)
    }
  }



  validateQR(qr: string): void {
    this.api.retrieveITEMByQRCode(qr)
      .subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Retrieve ITEMS', res);
          this.item = res[0];
          this.itemKeys = Object.keys(this.item || {});

          //PROMT THE MODAL TO ASK TO VIEW
          if (!res[0]) {
            Swal.fire('Property not Found', `QR Code ${qr} not found`, 'info');
            this.qrCode = ''
            return
          }

          Swal.fire({
            title: 'PROPERTY FOUND',
            text: 'Do you want to view the Property?',
            icon: 'question',
            showCancelButton: true, // Show cancel button
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            allowEscapeKey: true, // Enable close on escape
            allowOutsideClick: true, // Enable close by clicking outside
          }).then((result) => {
            if (result.isConfirmed) {
              // Notify Angular of the changes
              this.cdr.detectChanges();

              // Delay before opening the modal
              setTimeout(() => this.openModal(this.itemDetailsModal), 200);
            }
          });

          this.qrCode = ''


        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Problem with Retreiving ITEM', err);
          Swal.fire('Item not Found', `QR Code ${qr} not found`, 'info');
        }
      });
  }

  openNotification(notif: any) {
    Swal.fire({
      title: notif.title,
      html: `<small>${notif.time}</small><br>${notif.message}`,
      icon: 'info',
      confirmButtonText: 'Close'
    });
    
  }
  seeMoreNotifications() {
    Swal.fire({
      title: 'Notifications',
      html: '<div style="text-align:left;max-height:300px;overflow:auto;">' +
        this.notifications.map(n =>
          `<b>${n.title}</b><br><small>${n.time}</small><br>${n.message}<hr>`
        ).join('') +
        '</div>',
      width: 500,
      confirmButtonText: 'Close'
    });
  }
}



