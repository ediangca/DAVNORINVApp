import { AfterViewInit, Component, OnChanges, OnInit, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import AOS from 'aos';
import { LogsService } from '../../services/logs.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})

export class WidgetComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('prev') prev!: ElementRef<HTMLButtonElement>;
  @ViewChild('next') next!: ElementRef<HTMLButtonElement>;
  @ViewChild('carouseltrack') track!: HTMLElement;

  cards!: HTMLElement[];
  currentIndex = 0;

  census: any | null = null;
  activities: any = [];
  totalItemsByOffice: any = [];

  constructor(private api: ApiService, private logger: LogsService) {
    this.ngOnInit()
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.getTotalParCencus();
  }

  ngOnInit(): void {
    // Fetch data from API 
    this.getTotalParCencus();
    this.getActivityLogs();
    this.getTotalAbove50ItemsByOffice();
    window.addEventListener('resize', () => this.updateCarousel());
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
    //   console.log('Previous button clicked');
    //   this.moveToPrev(); // Call your custom method here
    // });
    // this.nextBtn.addEventListener('click', () => this.moveToNext());
    // this.next.nativeElement.addEventListener('click', () => {
    //   console.log('Next button clicked');
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
      console.log('Previous button clicked');
      this.moveToPrev(); // Call your custom method here
    });


    // this.nextBtn.removeEventListener('click', () => this.moveToNext());
    this.next.nativeElement.addEventListener('click', () => {
      console.log('Next button clicked');
      this.moveToNext(); // Call your custom method here
    });
    window.removeEventListener('resize', () => this.updateCarousel());
  }

  getTotalParCencus() {
    this.api.getCencus().subscribe({
      next: (res) => {
        console.log('Cencus : ', res);
        this.census = res[0];
      },
      error: (err: any) => {
        console.log('Error Fetching User Groups:', err);
      },
    });
  }

  getActivityLogs() {
    this.api.getActivityLogs().subscribe({
      next: (res) => {
        this.activities = res.slice(0, 10);
        console.log('ActivityLog : ', this.activities);
      },
      error: (err: any) => {
        console.log('Error Fetching Activity Log:', err);
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
        
        this.totalItemsByOffice = this.totalItemsByOffice.slice(0, 5);

        console.log('TotalAbove50ItemsByOffice : ', this.totalItemsByOffice);
      },
      error: (err: any) => {
        console.error('Error Fetching Activity Log:', err);
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

}
