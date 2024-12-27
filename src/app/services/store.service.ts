import { Injectable } from '@angular/core';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { LogsService } from './logs.service';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  private fullname$ = new BehaviorSubject<string>("");
  private role$ = new BehaviorSubject<string>("");

  private userAccount$ = new BehaviorSubject<any>(null);
  private userProfile$ = new BehaviorSubject<any>(null);
  private privileges$ = new BehaviorSubject<any[]>([]);

  legend: string = `
    <div class='row'>
      <div class='col text-start'>
        <i class='fas fa-thumbtack text-secondary'></i> Post|Unpost Property <br>
        <i class='fas fa-edit text-secondary'></i> Edit Property<br>
        <i class='fas fa-copy text-secondary'></i> Copy Property<br>
        <i class='fas fa-eye text-secondary'></i> View Property<br>
        <i class='fas fa-trash text-secondary'></i> Delete Property<br>
        <i class='fas fa-print text-secondary'></i> Print Property<br>
        <i class='fas fa-share-from-square text-secondary'></i> Transfer Property
      </div>
    </div>`;

  constructor(private api: ApiService,  private logger: LogsService) { 
  }


  public getRoleFromStore() {
    return this.role$.asObservable();
  }
  public setRoleFromStore(role: string) {
    return this.role$.next(role);
  }
  public getFullnameForStore() {
    return this.fullname$.asObservable();
  }
  public setFullnameForStore(fullname: string) {
    return this.fullname$.next(fullname);
  }

  public setUserAccount(userAccount: any) {
    this.userAccount$.next(userAccount)
    this.loadPrivileges();
  }

  public setPrivilege(privileges: any[]) {
    this.privileges$.next(privileges)
  }

  public getPrivileges() {
    return this.privileges$.asObservable();
  }

  public getUserAccount() {
    return this.userAccount$.asObservable();
  }

  public setUserProfile(userProfile: any) {
    this.userProfile$.next(userProfile);
  }

  public getUserProfile() {
    return this.userProfile$.asObservable();
  }

  public clearStore() {
    this.fullname$ = new BehaviorSubject<string>("");
    this.role$ = new BehaviorSubject<string>("");
    this.userAccount$ = new BehaviorSubject<any>(null);
    this.userProfile$ = new BehaviorSubject<any>(null);
  }

  loadPrivileges(): void {
    this.getUserAccount()
      .pipe(
        switchMap((userAccount) =>
          userAccount 
            ? this.api.retrievePrivilegByUG(userAccount.ugid) 
            : of([]) // Return an empty array if `userAccount` is null
        )
      )
      .subscribe({
        next: (res: any) => {
          const privileges = res.map((privilege: any) => ({
            moduleName: privilege.moduleName,
            isActive: privilege.isActive,
            c: privilege.c,
            r: privilege.r,
            u: privilege.u,
            d: privilege.d,
            post: privilege.post,
            unpost: privilege.unpost,
          }));
          this.setPrivilege(privileges);
          this.logger.printLogs('i', 'Privileges Loaded', privileges);
        },
        error: (err: any) => {
          this.logger.printLogs('w', 'Error Retrieving Privileges', err);
        },
      });
  }
  

  isModuleActive(moduleName: string): boolean {
    const privileges = this.privileges$.getValue();
    return privileges.some(
      (privilege: any) =>
        privilege.moduleName === moduleName && privilege.isActive
    );
  }

  isAllowedAction(moduleName: string, action: string): boolean {
    // Retrieve the current privileges from the BehaviorSubject.
    const privileges = this.privileges$.getValue(); // This gets the latest value stored in the BehaviorSubject.
  
    if (!privileges || privileges.length === 0) {
      // If no privileges are loaded, return false (user does not have access).
      return false;
    }
  
    // Find the privilege entry for the given moduleName.
    const modulePrivilege = privileges.find(priv => priv.moduleName === moduleName);
  
    if (!modulePrivilege) {
      // If no privileges exist for the module, return false.
      return false;
    }
  
    // Check if the action is allowed for this module.
    switch (action.toLowerCase()) {
      case 'create': return modulePrivilege.c === true;
      case 'retrieve': return modulePrivilege.r === true;
      case 'update': return modulePrivilege.u === true;
      case 'delete': return modulePrivilege.d === true;
      case 'post': return modulePrivilege.post === true;
      case 'unpost': return modulePrivilege.unpost === true;
      default:
        // If an invalid action is passed, log a warning and return false.
        console.warn(`Invalid action '${action}' passed to isAllowedAction.`);
        return false;
    }
  }
  
}
