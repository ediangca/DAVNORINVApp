import { Component, OnInit } from '@angular/core';
import { GlobalComponent } from '../global/global.component';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [],
  templateUrl: './department.component.html',
  styleUrl: './department.component.css'
})
export class DepartmentComponent implements OnInit {

  constructor(private global: GlobalComponent) {
  }


  ngOnInit(): void {
    // this.global.setTitle("DEPARTMENT");
  }
}
