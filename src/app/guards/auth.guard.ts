import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../services/api.service';

/*
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);

  if (authService.isAuthenticated()) {


    return true;
  } else {
    router.navigate(['login']);
    toast.danger("Please login first!", "Error!!!", 5000);
    return false;
  }
};
*/


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);
  const toastr = inject(ToastrService);
  const api = inject(ApiService);


  return authService.getUsernameFromToken().pipe(
    map(username => {
      if (username) {
        // User is authenticated and has a username
        // console.log("username", username);
        return true;
      } else {
        // User is not authenticated
        router.navigate(['login']);
        api.showToast(`Hi, Welcome to AEINV App, Please login your Account!`, "Greetings!", "info");
        return false;
      }
    }),
    catchError(() => {
      // Handle any errors that occur during the authentication check
      router.navigate(['login']);
      api.showToast(`An error occurred while checking authentication!`, "Error", "warning");
      // toast.danger("An error occurred while checking authentication!", "Error!!!", 5000);
      return of(false);
    })
  );
};
