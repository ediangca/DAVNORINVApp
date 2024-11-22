import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private fullname$ = new BehaviorSubject<string>("");
  private role$ = new BehaviorSubject<string>("");

  private userAccount$ = new BehaviorSubject<any>(null);
  private userProfile$ = new BehaviorSubject<any>(null);

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

  constructor() { }


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
}
