import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { JwtHelperService } from '@auth0/angular-jwt'
import { environment } from '../../environment/environment';
import { LogsService } from './logs.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl: string = environment.apiUrl;
  private userPayload: any;

  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient, private router: Router, private logger: LogsService) {
    // this.userPayload = this.decodedToken();
  }


  register(userAccount: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}UserAccount/Create/`, userAccount)
      .pipe(
        catchError(this.handleError)
      );
  }


  login(userAccount: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Auth/`, userAccount)
      .pipe(
        catchError(this.handleError)
      );
  }




  private handleError(err: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (err.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${err.error.message}`;
    } else {
      // Backend error
      if (err.error && err.error.message) {
        errorMessage = err.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
    }
    return throwError(errorMessage);
  }


  logout() {

    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.exit();
      }
    });
  }

  exit() {
    localStorage.clear();
    this.router.navigate(['login']);
  }

  storeLocal(result: any) {
    this.logger.printLogs('i', 'Token', `result:  ${result}`);
    localStorage.setItem('token', result.token)
    // localStorage.setItem('userID', result.userID)
    // localStorage.setItem('UGID', result.ugid)
  }

  getToken() {
    return localStorage.getItem('token');
  }
  getuserID() {
    return localStorage.getItem('userID');
  }
  getUGID() {
    return localStorage.getItem('UGID');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  decodedToken() {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return this.jwtHelper.decodeToken(token);
    }
    return null;
  }


  getRoleFromToken() {
    if (this.userPayload) {
      return this.userPayload.role;
    }
  }
  /*
  getUsernameFromToken(){
    if(this.userPayload){
      return this.userPayload.unique_name;
    }
  }
  */

  getUsernameFromToken(): Observable<string | null> {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      this.userPayload = decodedToken;
      // this.logger.printLogs('i', "Decoded Token: ", decodedToken);
      return of(decodedToken?.unique_name || null); // Adjust according to your token's structure
    } else {
      return of(null);
    }
  }



}
