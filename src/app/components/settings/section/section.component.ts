import { Component, OnInit } from '@angular/core';
import { GlobalComponent } from '../global/global.component';

@Component({
  selector: 'app-section',
  standalone: true,
  imports: [],
  templateUrl: './section.component.html',
  styleUrl: './section.component.css'
})
export class SectionComponent implements OnInit {

  constructor(private global: GlobalComponent) {
  }


  ngOnInit(): void {
    // this.global.setTitle("SECTION");
  }

}
