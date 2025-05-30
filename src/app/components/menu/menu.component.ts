
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, NavigationEnd, ActivatedRouteSnapshot, ActivatedRoute } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { filter, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { LogsService } from '../../services/logs.service';
import { post } from 'jquery';

declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements AfterViewInit {


  public title: string = '';
  userAccount: any | null = null;
  privileges: any[] = [];

  constructor(private router: Router, private activatedRoute: ActivatedRoute,
    private dashboard: DashboardComponent,
    private store: StoreService, private api: ApiService,
    private logger: LogsService
  ) {
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

  toggleSidebar(minimizeSidebar: boolean) {
    this.dashboard.toggleSidebar(minimizeSidebar);
  }


  navigateTo(route: string) {
    this.router.navigate([`/dashboard/${route}`]);
  }

  toggleDropdown(dropdownMenu: string) {

    let dropdownId: string;
    const dropdown = document.getElementById(dropdownMenu);
    switch (dropdownMenu) {
      case 'master-menu':
        dropdownId = 'masterlist-link';
        break;
      case 'issue-menu':
        dropdownId = 'issue-link';
        break;
      case 'transfer-menu':
        dropdownId = 'transfer-link';
        break;
      case 'return-menu':
        dropdownId = 'return-link';
        break;
      default:
        dropdownId = 'default-link'; // Optional fallback
    }
    const navDropdown = document.getElementById(dropdownId)!;
    if (dropdown) {
      // Check if the 'sidebar-mini' class exists
      if (dropdown.classList.contains('show')) {

        dropdown.classList.remove('show');
        // dropdown.classList.add('collapse');

        navDropdown.classList.remove('active');
        // navDropdown.classList.add('collapsed');

        // this.minimizeSidebar();
      } else {
        dropdown.classList.add('show');

        // navDropdown.classList.remove('collapsed');
        navDropdown.classList.add('active');
      }
    }
  }


  loadPrivileges() {
    this.store.getUserAccount()
      .subscribe(res => {
        this.userAccount = res;

        this.logger.printLogs('i', 'User Account >>>', this.userAccount);

        if (this.userAccount) {
          this.api.retrievePrivilegByUG(this.userAccount.ugid).subscribe({
            next: (res: any) => {
              // Load and normalize privileges
              this.privileges = res.map((privilege: any) => ({
                moduleName: privilege.moduleName,
                isActive: privilege.isActive, // Assuming `isActive` indicates if the user has access
                c: privilege.c, // Assuming `c` indicates if the user has access to create
                r: privilege.r, // Assuming `r` indicates if the user has access to retrieve
                u: privilege.u, // Assuming `u` indicates if the user has access to update
                d: privilege.d, // Assuming `d` indicates if the user has access to delete
                post: privilege.post, // Assuming `post` indicates if the user has access to post
                unpost: privilege.unpost, // Assuming `unpost` indicates if the user has access to unpost
              }));
              this.store.setPrivilege(this.privileges);
              this.logger.printLogs('i', 'Retrieved Privileges from Menu', this.privileges);
            },
            error: (err: any) => {
              this.logger.printLogs('w', 'Error Retrieving Privileges', err);
            }
          });

        }
      });
  }

  isModuleActive(moduleName: string): boolean {
    return this.store.isModuleActive(moduleName);
  }

}

