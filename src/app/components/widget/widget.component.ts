import { AfterViewInit, Component, OnChanges, OnInit, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateForm';
import { ApiService } from '../../services/api.service';
import AOS from 'aos';
import { LogsService } from '../../services/logs.service';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';

import { StoreService } from '../../services/store.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { delay, finalize, map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})

export class WidgetComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('prev') prev!: ElementRef<HTMLButtonElement>;
  @ViewChild('next') next!: ElementRef<HTMLButtonElement>;
  @ViewChild('carouseltrack') track!: HTMLElement;
  @ViewChild('AddEditModalForm') AddEditModal!: ElementRef;

  cards!: HTMLElement[];
  currentIndex = 0;
  today: Date = new Date();

  census: any | null = null;
  activities: any = [];
  totalItemsByOffice: any = [];

  userAccount: any;
  username: string = "";
  role: string = "";

  usernameFromToken: string = 'User Account';
  roleNoFromToken: string = "Role";

  isLoading = false;
  // Pagination
  Math = Math;
  pageNumber = 1;
  pageSize = 2;
  totalItems = 0;

  announcements: any = [];
  announcement!: any;
  announcementForm!: FormGroup;

  searchKey: string = '';
  isEditMode: boolean = false;
  generatedId: string | null | undefined;
  currentEditId: string | null | undefined;


  constructor(private fb: FormBuilder, private api: ApiService,
    public vf: ValidateForm, private logger: LogsService,
    private route: ActivatedRoute, private auth: AuthService,
    private store: StoreService) {
    this.ngOnInit()
    // this.today = new Date().toISOString().split('T')[0];
    // this.getUserProfile();
  }

  ngOnInit(): void {
    this.announcementForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
    this.getUserProfile()
    // Fetch data from API 
    window.addEventListener('resize', () => this.updateCarousel());
    this.getAllAnnouncement();

    const modal = document.getElementById('AddEditModalForm');
    modal?.addEventListener('hidden.bs.modal', () => this.closeModal(this.AddEditModal));
  }

  getAllAnnouncement() {
    this.isLoading = true;
    this.api.getPaginatedAnnouncements(this.pageNumber, this.pageSize)
      .pipe(
        delay(2000),
        map((res) => {
          this.logger.printLogs('i', 'List of Originated Announcements', res.items);
          this.totalItems = res.totalCount;
          return res.items;
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (filtered) => {
          this.announcements = filtered;
          this.logger.printLogs('i', 'List of Announcements', this.announcements);
        },
        error: (err: any) => {
          this.logger.printLogs('e', 'Error Fetching Announcements', err);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getTotalParCencus();
  }


  public getUserProfile() {

    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.logger.printLogs('i', 'Retrieve Role', [this.roleNoFromToken]);
    this.route.data.subscribe(data => {
      this.logger.printLogs('i', 'Retrieve Username', [data['username']]);
      this.usernameFromToken = data['username'];
      if (!this.usernameFromToken) {
        this.logger.printLogs('w', 'Not Found Username', ['No username available.']);
      }
    });

    this.logger.printLogs('i', 'Retrieve Role -------------', this.roleNoFromToken);

    // Get Decoded role from token
    this.store.getUserAccount()
      .subscribe(res => {
        this.userAccount = res;

        this.getTotalParCencus();
        this.getActivityLogs();
        this.getTotalAbove50ItemsByOffice();
        this.logger.printLogs('i', 'Retrieve UserAccount -------------', this.userAccount);
      });


  }

  ngAfterViewInit(): void {
    AOS.init();

    // Query DOM elements after view initialization
    // this.prev = document.getElementById("prev") as ElementRef<HTMLButtonElement>;
    // this.next = document.getElementById("next") as ElementRef<HTMLButtonElement>;
    this.track = document.getElementById("carouseltrack") as HTMLElement;
    this.cards = Array.from(this.track.children) as HTMLElement[];

    // Add event listeners
    // this.prevBtn.addEventListener('click', () => this.moveToPrev());
    this.prev.nativeElement.addEventListener('click', () => this.moveToPrev());
    this.next.nativeElement.addEventListener('click', () => this.moveToNext());
    // this.prev.nativeElement.addEventListener('click', () => {
    //   this.moveToPrev(); // Call your custom method here
    // });
    // this.nextBtn.addEventListener('click', () => this.moveToNext());
    // this.next.nativeElement.addEventListener('click', () => {
    //   this.moveToNext(); // Call your custom method here
    // });

    // Add resize event listener
    window.addEventListener('resize', () => this.updateCarousel());

    // Initialize AOS
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    // this.prevBtn.removeEventListener('click', () => this.moveToPrev()); 


    this.prev.nativeElement.addEventListener('click', () => {
      this.logger.printLogs('i', 'Carousel', 'Previous button clicked');
      this.moveToPrev(); // Call your custom method here
    });


    // this.nextBtn.removeEventListener('click', () => this.moveToNext());
    this.next.nativeElement.addEventListener('click', () => {
      this.logger.printLogs('i', 'Carousel', 'Next button clicked');
      this.moveToNext(); // Call your custom method here
    });
    window.removeEventListener('resize', () => this.updateCarousel());
  }

  getTotalParCencus() {
    if (this.userAccount == null) {
      return
    }
    if (this.roleNoFromToken == 'System Administrator') {
      this.api.getCencus().subscribe({
        next: (res) => {
          this.logger.printLogs('i', 'Cencus ......... : ', res);
          this.census = res[0];
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Fetching Cencus Denied', err);
        },
      });
      return
    }

    this.api.getCencusByID(this.userAccount.userID).subscribe({
      next: (res) => {
        this.logger.printLogs('i', 'Cencus >>>>>>>>> : ', res);
        this.census = res;
      },
      error: (err: any) => {
        this.logger.printLogs('w', 'Fetching Cencus Denied', err);
      },
    });
  }

  getActivityLogs() {
    if (this.userAccount == null) {
      return
    }
    if (this.roleNoFromToken == 'System Administrator') {
      this.api.getActivityLogs().subscribe({
        next: (res) => {
          this.activities = res.slice(0, 5);
          this.logger.printLogs('i', 'ActivityLog ......... : ', this.activities);
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Error Fetching Activity Log:', err);
        },
      });
      return
    }

    this.api.getActivityLogsByID(this.userAccount.userID).subscribe({
      next: (res) => {
        this.logger.printLogs('i', 'ActivityLog >>>>>>>>> : ', res);
        this.activities = res.slice(0, 5);
        this.logger.printLogs('i', 'ActivityLog : ', this.activities);
      },
      error: (err: any) => {
        this.logger.printLogs('w', 'Error Fetching Activity Log:', err);
      },
    });
  }


  getTotalAbove50ItemsByOffice() {
    this.api.getTotalAbove50ItemsByOffice().subscribe({
      next: (res) => {
        // Calculate total of all totalEntries
        const grandTotal = res.reduce((sum: number, item: any) => sum + item.totalEntries, 0);

        // Map the response to include percentage for each office
        this.totalItemsByOffice = res.map((item: any) => ({
          ...item,
          percentage: grandTotal > 0 ? ((item.totalEntries / grandTotal) * 100).toFixed(2) : 0, // Calculate percentage
        }));

        this.totalItemsByOffice = this.totalItemsByOffice.slice(0, 10);

        this.logger.printLogs('i', 'TotalAbove50ItemsByOffice : ', this.totalItemsByOffice);
      },
      error: (err: any) => {
        this.logger.printLogs('w', 'Fetching TotalAbove50ItemsByOffice Denied', err);
      },
    });
  }

  updateCarousel() {
    // Get the width of a single card, including margin (adjust the 20 if your margin is different)
    const cardWidth = this.cards[0].offsetWidth + 30;

    // Calculate the total width of all cards
    const totalWidth = this.cards.length * this.cards[0].offsetWidth;

    // Get the width of the carousel container (visible area)
    const containerWidth = this.track.offsetWidth;

    // Calculate the maximum index that allows the last card to fit within the visible area
    const maxIndex = Math.max(0, Math.ceil((totalWidth - containerWidth) / cardWidth));

    // Ensure currentIndex does not exceed maxIndex to prevent empty space
    this.currentIndex = Math.min(this.currentIndex, maxIndex);

    // Apply the transformation to slide the cards
    this.track.style.transform = `translateX(-${this.currentIndex * cardWidth}px)`;
  }

  moveToNext() {
    // Move to the next card if not at the end
    const cardWidth = this.cards[0].offsetWidth + 30;
    const totalWidth = this.cards.length * cardWidth;
    const containerWidth = this.track.offsetWidth;
    const maxIndex = Math.max(0, Math.ceil((totalWidth - containerWidth) / cardWidth));

    if (this.currentIndex < maxIndex) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  moveToPrev() {
    // Move to the previous card if not at the start
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  changePage(page: number) {
    if (page < 1 || page > Math.ceil(this.totalItems / this.pageSize)) return;
    this.pageNumber = page;
    this.getAllAnnouncement();
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

  public formatTime(date: Date | string | null): string | null {
    if (!date) return null;

    // If the date is a string, convert it to a Date object
    if (typeof date === 'string') {
      date = new Date(date);
    }

    // Ensure it's a valid Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
      return `${formattedHours}:${minutes} ${period}`;
    } else {
      // Handle invalid date
      this.logger.printLogs('w', 'Invalid Date Format', [date]);
      return null;
    }
  }

  public AddNewAnnouncement() {
    // alert("Add New Announcement");
    this.isEditMode = false;
    this.currentEditId = null;
    this.announcementForm.reset(
      {
        type: '',
        description: ''
      });

    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
    modal.show();
  }

  public onEditAnnouncement(a: any) {
    // if (a.postFlag) {
    //   Swal.fire('Information!', 'Cannot edit posted PAR.', 'warning');
    //   return;
    // }

    this.isEditMode = true;
    this.announcement = a;
    this.currentEditId = a.aid;

    this.logger.printLogs('i', 'Restoring ANNOUNCEMENT', a);

    this.announcementForm.patchValue({
      title: a.aid,
      description: a.content
    });

    const modal = new bootstrap.Modal(this.AddEditModal.nativeElement);
    modal.show();
  }


  public onDeleteAnnouncement(a: any) {
    if (a.postFlag) {
      Swal.fire('Information!', 'Cannot delete posted Announcement.', 'warning');
      return;
    }

    let aid = a.aid;
    Swal.fire({
      title: 'Remove AID #' + (aid + '-' + a.title) + "",
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteAnnouncement(aid)
          .subscribe({
            next: (res) => {
              this.getAllAnnouncement();
              Swal.fire('Deleted', res.message, 'success');
              this.api.showToast(res.message, 'Deleted!', 'success');
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error on Deleting Announcement', err);
              Swal.fire('Denied', err, 'warning');
            }
          });
      }
    });
  }
  closeModal(modalElement: ElementRef) {
    const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
    if (modal) {
      modal.hide();
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentEditId = null;
    this.announcementForm.reset(
      {
        type: '',
        description: ''
      });
    this.getAllAnnouncement();
  }


  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchAnnouncement();
    } else {
      this.onSearchAnnouncement();
    }
  }

  onSearchAnnouncement() {
    if (!this.searchKey) {
      this.getAllAnnouncement(); // Call existing function to populate all PARs when no search key is entered
    } else {
      if (this.searchKey.trim()) {
        this.isLoading = true; // Start spinner
        this.api.searchAnnouncement(this.searchKey.trim()) // Trim search key to avoid leading/trailing spaces
          .pipe(
            map((res) => {
              this.logger.printLogs('i', 'SEARCH Announcement', res);
              return res
            }),
            finalize(() => this.isLoading = false) // Ensure spinner stops
          )
          .subscribe({
            next: (filtered) => {
              this.announcements = filtered; // Assign the processed result to the component variable
              this.logger.printLogs('i', 'SEARCH Announcement', this.announcements);
            },
            error: (err: any) => {
              this.logger.printLogs('e', 'Error Fetching Announcement on Search', err);
            }
          });
      }
    }
  }

  onSubmit() {
    if (this.announcementForm.invalid) {
      this.logger.printLogs('w', 'Invalid Form Submission', 'Please fill in all required fields.');
      this.vf.validateFormFields(this.announcementForm);
      return;
    }

    this.announcement = {
      title: this.announcementForm.value['title'],
      content: this.announcementForm.value['description'],
      userID: this.userAccount.userID,
    }
    this.logger.printLogs('i', 'Announcement Form Data', this.announcement);

    if (this.isEditMode && this.currentEditId) {
      // Update existing announcement
      this.api.updateAnnouncement(this.currentEditId, this.announcement)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('w', 'Success Updating Announcement', res.message);
            // Swal.fire('Updated!', res.message, 'success');
            this.api.showToast(res.message, 'Updated!', 'success');
            this.resetForm();
          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Problem Updating Announcement', err);
            // Swal.fire('Updating Denied!', err, 'warning');
          }
        });
    } else {
      // Create new announcement
      this.api.createAnnouncement(this.announcement)
        .subscribe({
          next: (res) => {
            this.logger.printLogs('w', 'Success Creating Announcement', res.message);
            // Swal.fire('Created!', res.message, 'success');
            this.api.showToast(res.message, 'Created!', 'success');
            this.resetForm();
          },
          error: (err: any) => {
            this.logger.printLogs('w', 'Problem Creating Announcement', err);
            // Swal.fire('Creation Denied!', err, 'warning');
          }
        });
    }
  }

}
