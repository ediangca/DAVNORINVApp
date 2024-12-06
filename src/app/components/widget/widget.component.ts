import { AfterViewInit, Component, OnChanges, OnInit, SimpleChanges, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import AOS from 'aos';

@Component({
  selector: 'app-widget',
  standalone: true,
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})

export class WidgetComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  census: any | null = null;
  prevBtn!: HTMLButtonElement;
  nextBtn!: HTMLButtonElement;
  track!: HTMLElement;
  cards!: HTMLElement[];
  currentIndex = 0;


  constructor(private api: ApiService) {

  }
  ngOnChanges(changes: SimpleChanges): void {
    this.getTotalParCencus();
  }

  ngOnInit(): void {
    // Fetch data from API
    this.getTotalParCencus();
  }

  ngAfterViewInit(): void {
    // Query DOM elements after view initialization
    this.prevBtn = document.getElementById("prev") as HTMLButtonElement;
    this.nextBtn = document.getElementById("next") as HTMLButtonElement;
    this.track = document.getElementById("carousel-track") as HTMLElement;
    this.cards = Array.from(this.track.children) as HTMLElement[];

    // Add event listeners
    this.prevBtn.addEventListener('click', () => this.moveToPrev());
    this.nextBtn.addEventListener('click', () => this.moveToNext());

    // Add resize event listener
    window.addEventListener('resize', () => this.updateCarousel());

    // Initialize AOS
    AOS.init();
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    this.prevBtn.removeEventListener('click', () => this.moveToPrev());
    this.nextBtn.removeEventListener('click', () => this.moveToNext());
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

}
