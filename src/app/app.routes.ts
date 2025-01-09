import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { ParComponent } from './components/par/par.component';
import { ReparComponent } from './components/repar/repar.component';
import { ItrComponent } from './components/itr/itr.component';
import { IcsComponent } from './components/ics/ics.component';
import { UseraccountsComponent } from './components/useraccounts/useraccounts.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ItemsComponent } from './components/items/items.component';
import { UserResolver } from './components/resolver/user.resolver';
import { ProfileComponent } from './components/profile/profile.component';
import { GlobalComponent } from './components/settings/global/global.component';
import { ItemgroupComponent } from './components/settings/itemgroup/itemgroup.component';
import { CompanyComponent } from './components/settings/company/company.component';
import { DepartmentComponent } from './components/settings/department/department.component';
import { SectionComponent } from './components/settings/section/section.component';
import { PositionsComponent } from './components/settings/positions/positions.component';
import { UsergroupComponent } from './components/settings/usergroup/usergroup.component';
import { RrspComponent } from './components/rrsp/rrsp.component';
import { PrsComponent } from './components/prs/prs.component';

//
  // { path: 'dashboard', component: DashboardComponent, resolve: { username: UserResolver }, canActivate: [authGuard], data: { title: 'Dashboard' } },

export const routes: Routes = [
  { path: 'register', component: RegisterComponent, data: { title: 'Register' } },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    resolve: { username: UserResolver },
    canActivate: [authGuard],
    data: { title: 'Dashboard' },
    children: [
      { path: 'items', component: ItemsComponent, data: { title: 'Items' } },
      { path: 'par', component: ParComponent, data: { title: 'PAR' } },
      { path: 'repar', component: ReparComponent, data: { title: 'PTR' } },
      { path: 'itr', component: ItrComponent, data: { title: 'ITR' } },
      { path: 'rrsp', component: RrspComponent, data: { title: 'RRSP' } },
      { path: 'prs', component: PrsComponent, data: { title: 'PRS' } },
      { path: 'ics', component: IcsComponent, data: { title: 'ICS' } },
      { path: 'global', component: GlobalComponent, data: { title: 'Global Settings' },
        children: [
          // { path: '', component: PlaceholderComponent, data: { title: 'Global Settings'} },
          { path: '', redirectTo: 'itemcategory', pathMatch: 'full' }, // Default route for global settings
          { path: 'itemcategory', component: ItemgroupComponent, data: { title: 'Item Group' } },
          { path: 'company', component: CompanyComponent, data: { title: 'Company' } },
          { path: 'department', component: DepartmentComponent, data: { title: 'Department' } },
          { path: 'section', component: SectionComponent, data: { title: 'Section' } },
          { path: 'position', component: PositionsComponent, data: { title: 'User Position' } },
          { path: 'usergroup', component: UsergroupComponent, data: { title: 'User Group' } },
        ]
      },
      { path: 'useraccounts', component: UseraccountsComponent, data: { title: 'User Account' } },
      { path: 'profile', component: ProfileComponent, data: { title: 'Profile' } },
      { path: 'reports', component: ReportsComponent, data: { title: 'Reports' } },
      // Add more child routes here
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },  // Default route
  { path: '**', redirectTo: '/login' }  // Wildcard route for a 404 page
];
