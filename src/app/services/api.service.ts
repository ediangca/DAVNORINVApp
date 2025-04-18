import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { Item } from '../models/Item';
import { ICSItem } from '../models/ICSItem';
import { OPRItem } from '../models/OPRItem';
import { ToastrService } from 'ngx-toastr';
import { NgToastService } from 'ng-angular-popup';
import { LogsService } from './logs.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {


  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router,
    private toast: NgToastService, private toastr: ToastrService,
    private logger: LogsService) { }


  showToast(msg: string, title: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const options = {
      enableHtml: true,
      progressBar: true,
      timeOut: 2000,
      closeButton: true,
    };

    // this.toastr[type](msg, title, options);
    // this.toast[type](msg, title, { timeOut: 3000 }); // Correct way to pass options
    if (type === 'error') {
      this.toast.danger(msg, title, 3000); // Use `danger()` for error to match the service
    } else {
      this.toast[type](msg, title, 3000); // Dynamic method call for success, info, and warning
    }

  }

  /*----------------------- Cencus -----------------------*/

  //Cencus List
  getCencus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Cencus/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Cencus List
  getActivityLogs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Cencus/ActivityLog`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //TotalAbove50ItemsByOffice List
  getTotalAbove50ItemsByOffice(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Cencus/TotalAbove50ItemsByOffice`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- COMPANY/BRANCH -----------------------*/
  // Branch List
  getCompanies(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Branch/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchCompanies(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Branch/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }
  searchCompanyTypes(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Branch/SearchByType?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createCompany(company: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Branch/Create/`, company)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveCompany(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Branch/UserGroup/` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateCompany(id: number, company: any): Observable<any> {
    this.logger.printLogs('i', "Update Company: ", company);
    return this.http.put<any>(`${this.apiUrl}Branch/Update?id=` + id, company)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}Branch/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- DEPARTMENT -----------------------*/
  // Department List
  getDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Department/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Get Departments By BranchID
  getDepartmentsByCompanyID(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Department/getDepartmentsByCompanyID?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createDepartment(department: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Department/Create/`, department)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateDepartment(id: number, department: any): Observable<any> {
    this.logger.printLogs('i', "Update Company: ", department);
    return this.http.put<any>(`${this.apiUrl}Department/Update?id=` + id, department)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}Department/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }



  /*----------------------- SECTIONS -----------------------*/
  // Department List
  getSections(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Section/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Get Sections By DepID
  getSectionsByDepID(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Section/getSectionsByDepID?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createSection(department: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Section/Create/`, department)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateSection(id: number, department: any): Observable<any> {
    this.logger.printLogs('i', "Update Company: ", department);
    return this.http.put<any>(`${this.apiUrl}Section/Update?id=` + id, department)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteSection(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}Section/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- ITEM GROUPS -----------------------*/
  // User Group List
  getAllItemGroups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ItemGroup/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchItemGroups(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ItemGroup/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createItemGroup(userGroup: any): Observable<any> {
    this.logger.printLogs('i', "Create UserGroup: ", userGroup);
    return this.http.post<any>(`${this.apiUrl}ItemGroup/Create/`, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveItemGroup(id: number): Observable<any> {
    this.logger.printLogs('i', "Retrieve Item Group: ", id);
    return this.http.get<any>(`${this.apiUrl}ItemGroup/` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateItemGroup(id: number, userGroup: any): Observable<any> {
    this.logger.printLogs('i', "Update Item Group: ", userGroup);
    return this.http.put<any>(`${this.apiUrl}ItemGroup/Update?id=` + id, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteItemGroup(id: number): Observable<any> {
    this.logger.printLogs('i', "Delete UserGroup: ", id);
    return this.http.delete<any>(`${this.apiUrl}ItemGroup/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- USER GROUPS -----------------------*/

  // User Group List
  getAllUserGroups(roleNoFromToken: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserGroup/?role=${roleNoFromToken}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchUserGroups(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserGroup/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createUserGroup(userGroup: any): Observable<any> {
    this.logger.printLogs('i', "Create UserGroup: ", userGroup);
    return this.http.post<any>(`${this.apiUrl}UserGroup/Create/`, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveUserGroup(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserAccount/UserGroup/` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateUserGroup(id: number, userGroup: any): Observable<any> {
    this.logger.printLogs('i', "Update UserGroup: ", userGroup);
    return this.http.put<any>(`${this.apiUrl}UserGroup/Update?id=` + id, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteUserGroup(id: number): Observable<any> {
    this.logger.printLogs('i', "Delete UserGroup: ", id);
    return this.http.delete<any>(`${this.apiUrl}UserGroup/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- USER ACCOUNTS -----------------------*/

  // User Account List
  getAllUserAccounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserAccount/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchUserAccounts(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserAccount/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get Account ID by userename
  getAccIDByUsername(userame: string): Observable<any> {
    // this.logger.printLogs('i', "Fetching Account...");;
    //https://localhost:7289/api/UserAccount/GetAccountbyUsername?key=admin
    return this.http.get<any>(`${this.apiUrl}UserAccount/GetAccountbyUsername?username=` + userame)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveUserAccount(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserAccount/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserAccount(id: number, userAccount: any): Observable<any> {
    // this.logger.printLogs('i', "Update Account: ", userAccount);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update?id=` + id, userAccount)
      .pipe(
        catchError(this.handleError)
      );
  }

  ForgetPassword(id: string, Details: any): Observable<any> {
    this.logger.printLogs('i', "ForgetPassword Password: ", id);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update/ForgetPassword?id=` + id, Details)
      .pipe(
        catchError(this.handleError)
      );
  }

  UpdatePassword(id: string, Details: any): Observable<any> {
    this.logger.printLogs('i', "Update Password: ", id);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update/Password?id=` + id, Details)
      .pipe(
        catchError(this.handleError)
      );
  }



  deleteUserAccount(id: number): Observable<any> {
    // this.logger.printLogs('i', "Delete UserAccount: ", id);
    return this.http.delete<any>(`${this.apiUrl}UserAccount/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  verifyUserAccount(id: string): Observable<any> {
    // this.logger.printLogs('i', "Delete UserAccount: ", id);
    return this.http.put<any>(`${this.apiUrl}UserAccount/leave/Verification?id=` + id, id)
      .pipe(
        catchError(this.handleError)
      );
  }
  // isAuthenticated(): boolean {
  //   return !!localStorage.getItem('token');
  // }

  onActiveStatus(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}UserAccount/status/Update?id=` + id, id)
      .pipe(
        catchError(this.handleError)
      );
  }

  
  onLeave(id: string, leave: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}UserAccount/leave/Update?id=` + id, leave)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveLeave(userID: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}UserAccount/leave/${userID}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- POSITION -----------------------*/


  // Positions List
  getAllPositions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Position/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchPositions(key: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Position/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createPosition(position: any): Observable<any> {
    this.logger.printLogs('i', "Create Position: ", position);
    return this.http.post<any>(`${this.apiUrl}Position/Create/`, position)
      .pipe(
        catchError(this.handleError)
      );
  }

  updatePosition(id: number, positionName: any): Observable<any> {
    this.logger.printLogs('i', "Update Position: ", positionName);
    return this.http.put<any>(`${this.apiUrl}Position/Update?id=` + id, positionName)
      .pipe(
        catchError(this.handleError)
      );
  }

  deletePosition(id: number): Observable<any> {
    // this.logger.printLogs('i', "Delete UserAccount: ", id);
    return this.http.delete<any>(`${this.apiUrl}Position/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- PROFILE -----------------------*/
  //Profile List
  getAllProfile(): Observable<any> {
    // this.logger.printLogs('i', "Get User Profile: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Profile by userID
  getProfile(userID: string): Observable<any> {
    // this.logger.printLogs('i', "Get User Profile: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/UserID/` + userID)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Profile by userID
  getProfileByUserID(userID: string): Observable<any> {
    // this.logger.printLogs('i', "Get User Profile by userID: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/SearchByUserID?UserID=` + userID)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchProfile(key: string): Observable<any> {
    this.logger.printLogs('i', "Search User Profile by key: ", key);
    return this.http.get<any>(`${this.apiUrl}UserProfile/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createProfile(userProfile: any): Observable<any> {
    this.logger.printLogs('i', "Create User Profile: ", userProfile);
    return this.http.post<any>(`${this.apiUrl}UserProfile/${userProfile.userID ? 'Create/' : 'Create/GenratedAccount/'} `, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create/GenratedAccount
  createProfileGenAccount(userProfile: any): Observable<any> {
    this.logger.printLogs('i', "Create User Profile: ", userProfile);
    return this.http.post<any>(`${this.apiUrl}UserProfile/Create/GenratedAccount/`, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateProfile(id: number, userProfile: any): Observable<any> {
    this.logger.printLogs('i', "Update User Profile: ", userProfile);
    return this.http.put<any>(`${this.apiUrl}UserProfile/Update?id=` + id, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteProfile(id: number): Observable<any> {
    this.logger.printLogs('i', "Delete User Profile: ", id);
    return this.http.delete<any>(`${this.apiUrl}UserProfile/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }



  /*----------------------- ITEMS -----------------------*/
  //Item List
  getAllItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Item/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/Item/generateID/
  getGenID(type: string): Observable<any> {
    this.logger.printLogs('i', "Generate ID for item type: ", type);
    return this.http.get<any>(`${this.apiUrl}Item/generateID/${type}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Seach
  searchItem(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search Item by key: ", key);
    return this.http.get<any>(`${this.apiUrl}Item/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchItemByDescription(key: string): Observable<any> {
    this.logger.printLogs('i', "Search Item by Description: ", key);
    // https://localhost:7289/api/Item/Description?description=laptop
    return this.http.get<any>(`${this.apiUrl}Item/Description?description=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }


  //Create
  createItem(item: any): Observable<any> {
    this.logger.printLogs('i', "Create Item: ", item);
    return this.http.post<any>(`${this.apiUrl}Item/Create/`, item)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveItem(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Item/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  //Update
  updateItem(id: string, item: any): Observable<any> {
    this.logger.printLogs('i', "Update Item: ", item);
    return this.http.put<any>(`${this.apiUrl}Item/Update?id=` + id, item)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteItem(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete Item: ", id);
    return this.http.delete<any>(`${this.apiUrl}Item/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- PARS -----------------------*/
  //PAR List
  getAllPAR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PAR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchPAR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PAR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}PAR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }
  isPARExist(parNo: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}PAR/PARNo?key=` + parNo).pipe(
      catchError(this.handleError)
    );
  }
  //Create
  // createPAR(PAR: any): Observable<any> {
  //   this.logger.printLogs('i', "Create PAR: ", PAR);
  //   return this.http.post<any>(`${this.apiUrl}PAR/Create/`, PAR)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  //Create
  createPAR(details: any, items: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      parItems: items
    };

    this.logger.printLogs('i', "Create PAR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}PAR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePAR(parNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve PAR No.: ", parNo);
    return this.http.get<any>(`${this.apiUrl}PAR/` + parNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  // updatePAR(id: string, PAR: any): Observable<any> {
  //   this.logger.printLogs('i', "Update PAR: ", PAR);
  //   return this.http.put<any>(`${this.apiUrl}PAR/Update?id=` + id, PAR)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  updatePAR(parNo: string, par: any, items: Item[]): Observable<any> {
    this.logger.printLogs('i', "Update PAR Details: ", par);
    const requestPayload = {
      details: par,
      parItems: items
    };
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    // https://localhost:7289/api/PAR/Update?id=123
    return this.http.put<any>(`${this.apiUrl}PAR/Update?id=` + parNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deletePAR(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete PAR: ", id);
    return this.http.delete<any>(`${this.apiUrl}PAR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/PAR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postPAR(parNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update PAR No. >>> : ", parNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}PAR/Post?id=${parNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- REPARS -----------------------*/
  //REPAR List
  getAllREPAR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}REPAR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchREPAR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PAR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}REPAR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createREPAR(details: any, updatedItems: Item[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create REPAR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}REPAR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createREPTR(details: any, updatedItems: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create PTR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}REPAR/Transfer/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveREPAR(reparNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve REPAR No.: ", reparNo);
    return this.http.get<Item[]>(`${this.apiUrl}REPAR/` + reparNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateREPAR(details: any, updatedItems: Item[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update REPAR: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}REPAR/Update?id=` + details.reparNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteREPAR(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete REPAR: ", id);
    return this.http.delete<any>(`${this.apiUrl}REPAR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/REPAR/Post?id=PAR012312412-0001&postVal=true
  //Update Post Flag
  postREPAR(reparNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update REPAR No. >>> : ", reparNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}REPAR/Post?id=${reparNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- PAR ITEMS -----------------------*/
  //PARITEM List By PAR No.
  getAllPARItem(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PARITEM/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //PARITEM Active List 
  getAllPostedPARItem(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PARITEM/posted/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //PARITEM Active List By Key
  searchAllPostedPARItem(key: string): Observable<any> {
    // 'https://localhost:7289/api/PARITEM/Active/Search?key=123123
    return this.http.get<any>(`${this.apiUrl}PARITEM/posted/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //PARITEM List By PAR No.
  getAllPARItemByPARNo(parNo: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PARITEM/Search?key=` + parNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createPARItem(parItems: Item[]): Observable<any> {
    this.logger.printLogs('i', "Create PAR Item: ", parItems);
    return this.http.post<any>(`${this.apiUrl}PARITEM/Create/`, parItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePARItem(parINo: number): Observable<Item[]> {
    this.logger.printLogs('i', "Retrieve PAR Item PARINO.: ", parINo);
    return this.http.get<Item[]>(`${this.apiUrl}PARITEM/` + parINo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By PAR No.
  retrievePARItemByParNo(parNo: string): Observable<Item[]> {
    this.logger.printLogs('i', "Retrieve PAR Item by PAR No.: ", parNo);
    return this.http.get<Item[]>(`${this.apiUrl}PARITEM/PARNO/` + parNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By PAR No.
  retrievePARItemByPTRNo(ptrNo: string): Observable<Item[]> {
    this.logger.printLogs('i', "Retrieve PAR Item by PTR No.: ", ptrNo);

    return this.http.get<Item[]>(`${this.apiUrl}PARITEM/PTRNO/` + ptrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By QR Code
  retrievePARITEMByQRCode(qrcode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PARITEM/QRCode/${qrcode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updatePARItem(parNo: string, updatedItems: Item[]): Observable<any> {
    this.logger.printLogs('i', "Update PAR No. >>> : ", parNo);
    this.logger.printLogs('i', "Update PAR Item >>> : ", updatedItems);
    return this.http.put<any>(`${this.apiUrl}PARITEM/Update?parNo=` + parNo, updatedItems)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanUniquePARItem(key: string,): Observable<any> {
    this.logger.printLogs('i', "Update PAR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}PARITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanExistingUniquePARItem(parINo: number, key: string): Observable<any> {
    this.logger.printLogs('i', "Update PAR Item No. >>> : ", parINo);
    this.logger.printLogs('i', "Update PAR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}PARITEM/ScanExistingUnique?parino=${parINo}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }



  /*----------------------- ICS  -----------------------*/

  //ICS List
  getAllICS(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ICS/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchICS(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PAR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}ICS/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createICS(details: any, icsItems: ICSItem[]): Observable<any> {
    const requestPayload = {
      details: details,
      icsItems: icsItems
    };

    this.logger.printLogs('i', "Create ICS Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}ICS/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveICS(icsNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve ICS No.: ", icsNo);
    return this.http.get<any>(`${this.apiUrl}ICS/` + icsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  isICSExist(icsNo: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}ICS/ICSNo?key=` + icsNo).pipe(
      catchError(this.handleError)
    );
  }

  //Update
  // updateICS(id: string, ICS: any): Observable<any> {
  //   this.logger.printLogs('i', "Update ICS: ", ICS);
  //   return this.http.put<any>(`${this.apiUrl}ICS/Update?id=` + id, ICS)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  updateICS(icsNo: string, ics: any, items: ICSItem[]): Observable<any> {
    this.logger.printLogs('i', "Update ICS Details: ", ics);
    const requestPayload = {
      details: ics,
      icsItems: items
    };
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    // https://localhost:7289/api/ICS/Update?id=123
    return this.http.put<any>(`${this.apiUrl}ICS/Update?id=` + icsNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteICS(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete ICS: ", id);
    return this.http.delete<any>(`${this.apiUrl}ICS/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/PAR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postICS(icsNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update ICS No. >>> : ", icsNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}ICS/Post?id=${icsNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- ICS ITEMS -----------------------*/

  //ICSITEM List By ICS No.
  getAllICSItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ICSItem`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //ICSITEM List all Posted Item.
  getAllPostedICSItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ICSItem/posted`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //PARITEM Active List By Key
  searchAllPostedICSItem(key: string): Observable<any> {
    // 'https://localhost:7289/api/ICSItem/posted/Search?key=123123
    return this.http.get<any>(`${this.apiUrl}ICSItem/posted/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //ICSITEM List By ICS No.
  getAllICSItem(icsNo: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ICSItem/Search?key=` + icsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create ICS Item
  createICStem(icsItems: ICSItem[]): Observable<any> {
    this.logger.printLogs('i', "Create ICS Item: ", icsItems);
    return this.http.post<any>(`${this.apiUrl}ICSItem/Create/`, icsItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By ICS No.
  retrieveICSItemByICSNo(icsNo: string): Observable<ICSItem[]> {
    this.logger.printLogs('i', "Retrieve ICS Item by ICS No.: ", icsNo);

    return this.http.get<ICSItem[]>(`${this.apiUrl}ICSITEM/ICSNO/` + icsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By ICS No.
  retrieveICSItemByITRNo(itrNo: string): Observable<ICSItem[]> {
    this.logger.printLogs('i', "Retrieve ICS Item by ITR No.: ", itrNo);

    return this.http.get<ICSItem[]>(`${this.apiUrl}ICSITEM/ITRNO/` + itrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By QR Code
  retrieveicsITEMByQRCode(qrcode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ICSITEM/QRCode/${qrcode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  scanUniqueICSItem(key: string,): Observable<any> {
    this.logger.printLogs('i', "Update ICS Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}ICSITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  scanExistingUniqueICSItem(icsItemNo: number, key: string): Observable<any> {
    this.logger.printLogs('i', "Update ICS Item No. >>> : ", icsItemNo);
    this.logger.printLogs('i', "Update ICS Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}ICSItem/ScanExistingUnique?icsItemNo=${icsItemNo}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  //Update
  updateICSItem(icsNo: string, icsItems: ICSItem[]): Observable<any> {
    this.logger.printLogs('i', "Update ICS No. >>> : ", icsNo);
    this.logger.printLogs('i', "Update ICS Item >>> : ", icsItems);
    return this.http.put<any>(`${this.apiUrl}ICSItem/Update?icsNo=` + icsNo, icsItems)
      .pipe(
        catchError(this.handleError)
      );
  }



  /*----------------------- ITR -----------------------*/

  //ITR List
  getAllITR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ITR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchITR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search ITR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}ITR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Create
  createITR(details: any, updatedItems: ICSItem[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create ITR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}ITR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveITR(itrNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve ITR No.: ", itrNo);
    return this.http.get<ICSItem[]>(`${this.apiUrl}ITR/` + itrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateITR(details: any, updatedItems: ICSItem[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update ITR: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}ITR/Update?id=` + details.itrNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteITR(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete ITR: ", id);
    return this.http.delete<any>(`${this.apiUrl}ITR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postITR(itrNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update ITR No. >>> : ", itrNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}ITR/Post?id=${itrNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createREITR(details: any, updatedItems: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create ITR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}ITR/Transfer/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- PRS -----------------------*/
  //PRS List
  getAllPRS(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}PRS/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchPRS(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PRS by key: ", key);
    return this.http.get<any>(`${this.apiUrl}PRS/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createPRS(details: any, updatedItems: Item[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create PRS Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}PRS/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePRS(prsNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve PRS No.: ", prsNo);
    return this.http.get<Item[]>(`${this.apiUrl}PRS/` + prsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updatePRS(details: any, updatedItems: Item[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update PRS: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}PRS/Update?id=` + details.prsNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deletePRS(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete PRS: ", id);
    return this.http.delete<any>(`${this.apiUrl}PRS/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postPRS(prsNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update PRS No. >>> : ", prsNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}PRS/Post?id=${prsNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- RRSEP -----------------------*/
  getAllRRSEP(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}RRSEP/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  searchRRSEP(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PRS by key: ", key);
    return this.http.get<any>(`${this.apiUrl}RRSEP/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  createRRSEP(details: any, updatedItems: ICSItem[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create RRSEP Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}RRSEP/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveRRSEP(rrsepNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve RRSEP No.: ", rrsepNo);
    return this.http.get<Item[]>(`${this.apiUrl}RRSEP/` + rrsepNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateRRSEP(details: any, updatedItems: ICSItem[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update RRSEP: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}RRSEP/Update?id=` + details.rrsepNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteRRSEP(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete RRSEP: ", id);
    return this.http.delete<any>(`${this.apiUrl}RRSEP/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postPRRSEP(rrsepNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update RRSEP No. >>> : ", rrsepNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}RRSEP/Post?id=${rrsepNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- OPR -----------------------*/
  //OPR List
  getAllOPR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchOPR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search OPR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}OPR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createOPR(details: any, updatedItems: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      oprItems: updatedItems
    };
    this.logger.printLogs('i', "Create OPR: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}OPR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Create
  // createOPR(OPR: any): Observable<any> {
  //   this.logger.printLogs('i', "Create OPR: ", OPR);
  //   return this.http.post<any>(`${this.apiUrl}OPR/Create/`, OPR)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  //Retrieve
  retrieveOPR(oprNo: number): Observable<any> {
    this.logger.printLogs('i', "Retrieve OPR No.: ", oprNo);
    return this.http.get<any>(`${this.apiUrl}OPR/` + oprNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  // updateOPR(id: number, OPR: any): Observable<any> {
  //   this.logger.printLogs('i', "Update OPR: ", OPR);
  //   return this.http.put<any>(`${this.apiUrl}OPR/Update?id=` + id, OPR)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  updateOPR(oprNo: number, par: any, items: OPRItem[]): Observable<any> {
    this.logger.printLogs('i', "Update OPR Details: ", par);
    const requestPayload = {
      details: par,
      oprItems: items
    };
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    // https://localhost:7289/api/OPR/Update?id=123
    return this.http.put<any>(`${this.apiUrl}OPR/Update?id=` + oprNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteOPR(id: number): Observable<any> {
    this.logger.printLogs('i', "Delete OPR: ", id);
    return this.http.delete<any>(`${this.apiUrl}OPR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/OPR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postOPR(oprNo: number, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update OPR No. >>> : ", oprNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}OPR/Post?id=${oprNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- OPTR -----------------------*/
  //OPTR List
  getAllOPTR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPTR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchOPTR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search PAR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}OPTR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createOPTR(details: any, updatedItems: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create OPTR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}OPTR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createREOPTR(details: any, updatedItems: any[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create OPTR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}OPTR/Transfer/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPTR(optrNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve OPTR No.: ", optrNo);
    return this.http.get<any[]>(`${this.apiUrl}OPTR/` + optrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateOPTR(details: any, updatedItems: any[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update OPTR: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}OPTR/Update?id=` + details.optrNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteOPTR(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete OPTR: ", id);
    return this.http.delete<any>(`${this.apiUrl}OPTR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/REPAR/Post?id=PAR012312412-0001&postVal=true
  //Update Post Flag
  postOPTR(optr: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update OPTR No. >>> : ", optr);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}OPTR/Post?id=${optr}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- OPRR -----------------------*/
  //OPRR List
  getAllOPRR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPRR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchOPRR(key: string): Observable<any> {
    // this.logger.printLogs('i', "Search OPRR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}OPRR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createOPRR(details: any, updatedItems: Item[]): Observable<any> {
    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };

    this.logger.printLogs('i', "Create OPRR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}OPRR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPRR(oprrNo: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve OPRR No.: ", oprrNo);
    return this.http.get<Item[]>(`${this.apiUrl}OPRR/` + oprrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateOPRR(details: any, updatedItems: Item[]): Observable<any> {

    const requestPayload = {
      details: details,
      updatedItems: updatedItems
    };
    this.logger.printLogs('i', "Update OPRR: ", details);
    this.logger.printLogs('i', "Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}OPRR/Update?id=` + details.oprrNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteOPRR(id: string): Observable<any> {
    this.logger.printLogs('i', "Delete OPRR: ", id);
    return this.http.delete<any>(`${this.apiUrl}OPRR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postOPRR(oprrNo: string, postVal: boolean): Observable<any> {
    this.logger.printLogs('i', "Update OPRR No. >>> : ", oprrNo);
    this.logger.printLogs('i', "Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}OPRR/Post?id=${oprrNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- OPR ITEMS -----------------------*/
  //OPRITEM List By PAR No.
  getAllOPRItem(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPRITEM/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //OPRITEM Active List 
  getAllPostedOPRItem(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPRITEM/posted/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //OPRITEM Active List By Key
  searchAllPostedOPRItem(key: string): Observable<any> {
    // 'https://localhost:7289/api/OPRITEM/Active/Search?key=123123
    return this.http.get<any>(`${this.apiUrl}OPRITEM/posted/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //OPRITEM List By OPR No.
  getAllOPRItemByOPRNo(oprNo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPRITEM/Search?key=` + oprNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createOPRItem(oprItems: OPRItem[]): Observable<any> {
    this.logger.printLogs('i', "Create PAR Item: ", oprItems);
    return this.http.post<any>(`${this.apiUrl}OPRITEM/Create/`, oprItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPRItem(oprINo: number): Observable<any[]> {
    this.logger.printLogs('i', "Retrieve PAR Item OPRINO.: ", oprINo);
    return this.http.get<Item[]>(`${this.apiUrl}OPRITEM/` + oprINo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By OPR No.
  retrieveOPRItemByOPRNo(oprNo: number): Observable<Item[]> {
    this.logger.printLogs('i', "Retrieve OPR Item by OPR No.: ", oprNo);
    return this.http.get<any[]>(`${this.apiUrl}OPRITEM/OPRNO/` + oprNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By OPTR No.
  retrieveOPRItemByOPTRNo(optrNo: string): Observable<Item[]> {
    this.logger.printLogs('i', "Retrieve OPR Item by OPTRNO No.: ", optrNo);
    return this.http.get<any[]>(`${this.apiUrl}OPRITEM/OPTRNO/` + optrNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By QR Code
  retrieveOPRITEMByQRCode(qrcode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPRITEM/QRCode/${qrcode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateOPRItem(oprNo: number, updatedItems: any[]): Observable<any> {
    this.logger.printLogs('i', "Update OPR No. >>> : ", oprNo);
    this.logger.printLogs('i', "Update OPR Item >>> : ", updatedItems);
    return this.http.put<any>(`${this.apiUrl}OPRITEM/Update?oprNo=` + oprNo, updatedItems)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanUniqueOPRItem(key: string,): Observable<any> {
    this.logger.printLogs('i', "Update OPR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}OPRITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanExistingUniqueOPRItem(oprINo: number, key: string): Observable<any> {
    this.logger.printLogs('i', "Update OPR Item No. >>> : ", oprINo);
    this.logger.printLogs('i', "Update OPR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}OPRITEM/ScanExistingUnique?oprINo=${oprINo}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- Privilege -----------------------*/

  retrievePrivilegByUG(ugid: any) {
    this.logger.printLogs('i', "Retrieve Privilege By UGID.: ", ugid);
    return this.http.get<any[]>(`${this.apiUrl}Privilege/UGID/` + ugid)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveModules() {
    return this.http.get<any[]>(`${this.apiUrl}Privilege/Modules/`)
      .pipe(
        catchError(this.handleError)
      );
  }


  // Create Privilege API
  createPrivilege(privileges: any[]): Observable<any> {
    this.logger.printLogs('i', 'Create Privilege: ', privileges);
    return this.http.post<any>(`${this.apiUrl}Privilege/Create/`, privileges).pipe(
      catchError(this.handleError) // Proper error handling
    );
  }

  // Update Privilege API
  updatePrivilege(ugid: number, privileges: any[]): Observable<any> {
    this.logger.printLogs('i', 'Update Privilege: ', privileges);

    return this.http.put<any>(`${this.apiUrl}Privilege/Update?ugid=${ugid}`, privileges).pipe(
      catchError(this.handleError) // Proper error handling
    );


  }

  /*----------------------- Reports -----------------------*/


  //https://localhost:7289/api/Report/Offices?module={?}
  getAllOffices(module: string): Observable<any> {
    this.logger.printLogs('i', "Retrieve all Office under module : ", module);
    return this.http.get<any>(`${this.apiUrl}Report/Offices?module=` + module)
      .pipe(
        catchError(this.handleError)
      );
  }


  //https://localhost:7289/api/Report/{Module}?office={?}
  getAllItemByOffice(module: string, office: string): Observable<any> {
    this.logger.printLogs('i', "Run Report: ", `${this.apiUrl}Report/${module.toUpperCase()}?office=` + office);
    return this.http.get<any>(`${this.apiUrl}Report/${module.toUpperCase()}?office=` + office)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveITEMByQRCode(qrcode: string): Observable<any> {
    this.logger.printLogs('i', "Scan Item: ", `${this.apiUrl}Report/GetItemsByQRCode?qrcode=` + qrcode);
    return this.http.get<any>(`${this.apiUrl}Report/GetItemsByQRCode?qrcode=` + qrcode)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- PROPERTY CARD -----------------------*/

  //Search Property from Property Card
  searchPropertyCard(category: string, key: string): Observable<any> {
    this.logger.printLogs('i', "Search: ", `Category -> ${category} itemID -> ${key}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/PropertyCardList?category=${category}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search Property from Property Card by Owner
  searchPropertyCardOwner(key: string): Observable<any> {
    this.logger.printLogs('i', "Search: ", `Property Owner -> ${key}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/PropertyCardOwnerList?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search by Owner
  searchPropertyOwner(key: string): Observable<any> {
    this.logger.printLogs('i', "Search: ", `Property Owner -> ${key}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/PropertyOwnerList?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  retreivePropertyCard(category: string, key: string): Observable<any> {
    this.logger.printLogs('i', "Search Property Card: ", `Category -> ${category} itemID -> ${key}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/SearchByCategoryAndID?category=${category}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  //Search
  retreivePropertyCardOwners(accountID: string): Observable<any> {
    this.logger.printLogs('i', "Search Property Card Owners: ", `accountID-> ${accountID}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/SearchByLogAccount?accountID=${accountID}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  

  //Search
  retreivePropertyOwner(accountID: string): Observable<any> {
    this.logger.printLogs('i', "Search Property Owners: ", `accountID -> ${accountID}`);
    return this.http.get<any>(`${this.apiUrl}PropertyCard/SearchByAccount?accountID=${accountID}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- ERROR HANDLING -----------------------*/

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    return throwError(errorMessage);
  }

}
