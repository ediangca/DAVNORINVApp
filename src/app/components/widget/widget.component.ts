import { Component, OnInit } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [DashboardComponent],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})
export class WidgetComponent implements OnInit {
  totalPAR: number = 0;
  totalREPAR: number = 0;
  totalITR: number = 0;
  totalICS: number = 0;

  prevBtn!: HTMLButtonElement;
  nextBtn!: HTMLButtonElement;
  track!: HTMLElement;
  cards!: HTMLElement[];
  currentIndex = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Fetch data from API
    this.getTotalParCencus();

    // Query DOM elements after view initialization
    this.prevBtn = document.querySelector('.prev') as HTMLButtonElement;
    this.nextBtn = document.querySelector('.next') as HTMLButtonElement;
    this.track = document.querySelector('.carousel-track') as HTMLElement;
    this.cards = Array.from(this.track.children) as HTMLElement[];

    // Add event listeners
    this.nextBtn.addEventListener('click', () => this.moveToNext());
    this.prevBtn.addEventListener('click', () => this.moveToPrev());

    // Add resize event listener
    window.addEventListener('resize', () => this.updateCarousel());
  }

  getTotalParCencus() {
    this.api.getCencus().subscribe({
      next: (res) => {
        console.log('Cencus : ', res);
        this.totalPAR = res[0].totalPAR;
        this.totalREPAR = res[0].totalREPAR;
        this.totalITR = res[0].totalITR;
        this.totalICS = res[0].totalICS;
      },
      error: (err: any) => {
        console.log('Error Fetching User Groups:', err);
      },
    });
  }
  updateCarousel() {
    // Get the width of a single card, including margin (adjust the 20 if your margin is different)
    const cardWidth = this.cards[0].offsetWidth + 30;

    // Calculate the total width of all cards
    const totalWidth = this.cards.length * cardWidth;

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

}
