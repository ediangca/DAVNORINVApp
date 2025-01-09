import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { StoreService } from '../../../services/store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
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

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: StoreService,
    private dashboard: DashboardComponent) {

    this.ngOnInit();
  }

  ngOnInit(): void {
    // Check each module's activation status in sequence

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root)
    ).subscribe(r => {
      const t: string = this.getT(r);

      // console.log("GLOBAL SETTINGS - ", t);
      this.title = t;  // Or false, based on your requirement
    });

    setTimeout(() => {
      this.route.url.subscribe(() => {
        const firstActiveModule = this.findFirstActiveModule();
        if (firstActiveModule) {
          this.isLoading = false;
          this.router.navigate([firstActiveModule == 'ITEM CATEGORY' ? 'itemcategory' : firstActiveModule.toLowerCase()], { relativeTo: this.route });
        }
      });
    }, 3000);
  }

  findFirstActiveModule(): string | null {
    const modules = ['ITEM CATEGORY', 'COMPANY', 'POSITION', 'USER GROUPS'];
    let loadmodule = '';
    for (const module of modules) {
      if (this.isModuleActive(module)) {
        switch (module) {
          case 'ITEM CATEGORY':
            loadmodule = 'itemcategory';
            break;
          case 'USER GROUPS':
            loadmodule = 'usergroup';
            break;
          default:
            loadmodule = module;
        }
        return loadmodule.toLowerCase();

      }
    }
    return null; // No active module found
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

  isModuleActive(moduleName: string): boolean {
    return this.store.isModuleActive(moduleName);
  }


}

