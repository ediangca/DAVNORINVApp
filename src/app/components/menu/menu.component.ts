import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, NavigationEnd, ActivatedRouteSnapshot, ActivatedRoute } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { filter, map } from 'rxjs';

declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule, CommonModule, DashboardComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements AfterViewInit {


  public title: string = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dashboard:DashboardComponent) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      map(route => route.snapshot.data['title'])
    ).subscribe(title => {
      this.title = title;
    });

    // let debounceTimer;
    // const debounceDelay = 100; // milliseconds

    // clearTimeout(debounceTimer);
    // debounceTimer = setTimeout(() => {
    //   const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    //   const tooltipList = Array.from(tooltipTriggerList).map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    // }, debounceDelay);

    // window.addEventListener('load', () => {
    //   const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    //   const tooltipList = Array.from(tooltipTriggerList).map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    // });

  }

  ngOnInit(): void {
    window.addEventListener('load', () => {
      this.initializeTooltips();
    });
  }

  ngAfterViewInit(): void {
    window.addEventListener('load', () => {
      this.initializeTooltips();
    });

  }

  private initializeTooltips() {
    requestAnimationFrame(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    });
  }

  toggleSidebar(minimizeSidebar : boolean) {
    this.dashboard.toggleSidebar(minimizeSidebar);
  }


  navigateTo(route: string) {
    this.router.navigate([`/dashboard/${route}`]);
  }

  toggleDropdown() {

    // console.log("click master-list!");
    const dropdown = document.getElementById('master-menu');
    const navDropdown = document.getElementById('masterlist-link')!;
    if (dropdown) {
      // Check if the 'sidebar-mini' class exists
      if (dropdown.classList.contains('show')) {

        // console.log("Remove show class.");
        dropdown.classList.remove('show');
        // dropdown.classList.add('collapse');

        navDropdown.classList.remove('active');
        // navDropdown.classList.add('collapsed');

        // this.minimizeSidebar();
      } else {
        // console.log("Add show class.");
        dropdown.classList.add('show');

        // navDropdown.classList.remove('collapsed');
        navDropdown.classList.add('active');
      }
    }
  }

}
