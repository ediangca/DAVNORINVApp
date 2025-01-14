import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { StoreService } from '../../services/store.service';
import { AppComponent } from '../../app.component';
import { WidgetComponent } from '../widget/widget.component';

import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';

import AOS from 'aos';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule, HttpClientModule, CommonModule, AppComponent, MenuComponent, WidgetComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit {


  accID: string | undefined;

  usernameFromToken: string = 'User Account';
  roleNoFromToken: string = "Role";

  username: string = "";
  role: string = "";

  userAccount: any;
  userProfile: any;

  fullname: string = "Account";

  pageTitle: string = "Dashboard";
  curYear: number = new Date().getFullYear();
  header: boolean | null = false;
  windowWidth: number = 0;

  isMinimizeSideBar = false;
  isOpen = false;

  prevBtn!: HTMLButtonElement;
  nextBtn!: HTMLButtonElement;
  track!: HTMLElement;
  cards!: HTMLElement[];
  currentIndex = 0;


  constructor(
    public ac: AppComponent,
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    public store: StoreService,
    private logger : LogsService
  ) {
    this.ngOnInit();
  }

  ngOnInit(): void {
    // this.setupSidebarToggle();
    this.getUserProfile();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root)
    ).subscribe(route => {
      const title: string = this.getTitle(route);
      this.logger.printLogs('i', 'Title', [title]);
      this.header = title.toLowerCase() === "dashboard";
      this.toggleHeaderAndWidgetDisplay(this.header);
      this.setTitle(title);


      this.setTitle(title);  // Or false, based on your requirement
    });
    this.logger.printLogs('i', 'Hide Header and Widget:', [this.header]);
  }

  ngAfterViewInit(): void {
    AOS.init();
  }

  toggleHeaderAndWidgetDisplay(show: boolean) {
    const items = document.querySelectorAll('.header, .widget');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = show ? 'block' : 'none';
    });
  }

  toggleAccordion() {
    this.isOpen = !this.isOpen; // Toggle the accordion state
  }

  private getTitle(route: ActivatedRouteSnapshot): string {
    let title = route.data['title'];
    if (route.firstChild) {
      title = this.getTitle(route.firstChild) || title;
    }
    return title || 'HOME'; // Default title if none found
  }

  setTitle(pageTitle: string) {
    this.titleService.setTitle(this.ac.appName + " - " + pageTitle);
  }

  getPageTitle() {
    return this.pageTitle;
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const target = event.target as Window;
    this.windowWidth = target.innerWidth;
  }

  getUserProfile() {
    this.roleNoFromToken = this.auth.getRoleFromToken();
    this.logger.printLogs('i', 'Retrieve Role', [this.roleNoFromToken]);
    this.route.data.subscribe(data => {
      this.logger.printLogs('i', 'Retrieve Username', [data['username']]);
      this.usernameFromToken = data['username'];
      if (!this.usernameFromToken) {
        this.logger.printLogs('w', 'Not Found Username', ['No username available.']);
      }
    });

    // Get Decoded unique_name from token

    this.store.getFullnameForStore()
      .subscribe(res => {
        this.username = res || this.usernameFromToken;
      });
      
    // Get Decoded role from token
    this.store.getRoleFromStore()
      .subscribe(res => {
        this.role = res || this.roleNoFromToken;
      });

    this.logger.printLogs('i', 'Retrieve Role', [this.roleNoFromToken]);
    if (this.username)
      //Populate all Users
      this.api.getAccIDByUsername(this.username)
        .subscribe({
          next: (res: any) => {
            this.userAccount = res[0];
            this.logger.printLogs('i', 'Account', this.userAccount);

            this.store.setUserAccount(this.userAccount);
            this.accID = this.userAccount.userID;

            this.api.getProfileByUserID(this.accID!)
              .subscribe({
                next: (res) => {
                  if (!res[0]) {
                    this.logger.printLogs('w', 'No Profile found', ['Profile Not Setup']);
                    // this.router.navigate(['dashboard/profile']);
                    this.router.navigate(['dashboard/profile'], {
                      queryParams: { showProfileForm: true }
                    });
                    return
                  }

                  this.userProfile = res[0];
                  this.logger.printLogs('i', 'Profile', this.userProfile);

                  this.store.setUserProfile(this.userProfile);
                  this.fullname = this.userProfile.fullName || this.username;

                },
                error: (err: any) => {
                  this.logger.printLogs('e', 'Error Fetching Profile', err);
                }
              });
          },
          error: (err: any) => {
            this.logger.printLogs('e', 'Error Fetching Account ID', err);
          }
        });

  }


  toggleSidebarItems() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-mini');
      this.isMinimizeSideBar = sidebar.classList.contains('sidebar-mini');
      this.logger.printLogs("i", "Minimize Sidebar : ", this.isMinimizeSideBar);
    }
  }

  public toggleSidebar(isMinimizeSideBar: boolean) {
    if (window.innerWidth <= 768) {
      this.isMinimizeSideBar = isMinimizeSideBar;
    }
  }

  expandSidebar() {
    const items = document.querySelectorAll('.item-name, .default-icon, .logo-title');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'inline';
    });
    const miniIcons = document.querySelectorAll('.mini-icon');
    miniIcons.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'none';
    });
  }

  minimizeSidebar() {
    const items = document.querySelectorAll('.item-name, .default-icon, .logo-title');
    items.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'none';
    });
    const miniIcons = document.querySelectorAll('.mini-icon');
    miniIcons.forEach(item => {
      const htmlElement = item as HTMLElement;
      htmlElement.style.display = 'inline';
    });
  }

  logout() {
    this.store.clearStore();
    this.auth.logout();
  }


}



