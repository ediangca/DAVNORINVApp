import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private fullname$ =  new BehaviorSubject<string>("");
  private role$ = new BehaviorSubject<string>("");

  private userAccount$ = new BehaviorSubject<any>(null);
  private userProfile$ = new BehaviorSubject<any>(null);

  constructor() { }


  public getRoleFromStore(){
    return this.role$.asObservable();
  }
  public setRoleFromStore(role: string){
    return this.role$.next(role);
  }
  public getFullnameForStore(){
    return this.fullname$.asObservable();
  }
  public setFullnameForStore(fullname: string){
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

  public clearStore(){
    this.fullname$ =  new BehaviorSubject<string>("");
    this.role$ = new BehaviorSubject<string>("");
    this.userAccount$ = new BehaviorSubject<any>(null);
    this.userProfile$ = new BehaviorSubject<any>(null);
  }
}
