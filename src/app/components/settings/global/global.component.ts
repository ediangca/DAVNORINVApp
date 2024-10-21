import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { DashboardComponent } from '../../dashboard/dashboard.component';

@Component({
  selector: 'app-global',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './global.component.html',
  styleUrl: './global.component.css'
})
export class GlobalComponent implements OnInit {
  /**
   *
   */

  @ViewChild('navbarCollapse') navbarCollapse!: ElementRef;

  toggleMenu: boolean = false;

  private title: string = "ITEM CATEGORY"

  constructor(
    private route: ActivatedRoute,
    private router: Router, private dashboard: DashboardComponent) {
  }

  ngOnInit(): void {

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root)
    ).subscribe(r => {
      const t: string = this.getT(r);

      // console.log("GLOBAL SETTINGS - ", t);
      this.title = t;  // Or false, based on your requirement
    });
  }

  toggleNavbar() {
    this.toggleMenu = !this.toggleMenu;
  }

  private getT(route: ActivatedRouteSnapshot): string {
    let title = route.data['title'];
    if (route.firstChild) {
      title = this.getT(route.firstChild) || title;
    }
    return title || 'ITEM CATEGORY'; // Default title if none found
  }

  getTitle() {
    return this.title;
  }



}

