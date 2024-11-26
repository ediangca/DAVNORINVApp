import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { catchError, Observable, throwError } from 'rxjs';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';


export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);

  const myToken = authService.getToken();



  if (myToken) {
    // console.log("Token: ", myToken);
    req = req.clone({
      setHeaders: {
        // Authorization: `Charrot ${myToken}`
        Authorization: `Bearer ${myToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((err: any) => {

      let messages: any | null = null;

      console.log("Error Status: " + err.status);
      if (err instanceof HttpErrorResponse) {
        console.log("Pipe Error Status: " + err.status);
        console.log(err);
        if (err.status == 0) {
          toast.warning("Failed to establish connection!", "Error!", 5000);
          // authService.exit();
        } else if (err.status == 400) {
          // Handle validation errors
          const validationErrors = err.error?.errors;
          if (validationErrors) {
            for (const key in validationErrors) {
              if (validationErrors.hasOwnProperty(key)) {
                messages = validationErrors[key];
                messages.forEach((message: string) => {
                  toast.warning(message, "Validation Error!", 5000);
                });
              }
            }
          }
        } else if (err.status === 401) {
          toast.warning("Token is Expired!, Please login again! " + err.status, "Warning!", 5000);
          authService.exit();
        }
      }
      return throwError(() => new Error(messages! || err?.message || err.error?.message || "Something went wrong."));
    })
  );
};

/*
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: NgToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const myToken = this.authService.getToken();

    if (myToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${myToken}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.toast.warning("Token is Expired! Please log in again!", "Warning!", 5000);
          this.authService.logout();
          this.router.navigate(['login']);
        }
        return throwError(() => new Error(err.error?.message || "Something went wrong."));
      })
    );
  }
}
*/
