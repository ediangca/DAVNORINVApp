import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { Item } from '../models/Item';
import { ICSItem } from '../models/ICSItem';
import { OPRItem } from '../models/OPRItem';


@Injectable({
  providedIn: 'root'
})
export class ApiService {


  private apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) { }


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
    console.log("Update Company: ", company);
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
    console.log("Update Company: ", department);
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
    console.log("Update Company: ", department);
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
    console.log("Create UserGroup: ", userGroup);
    return this.http.post<any>(`${this.apiUrl}ItemGroup/Create/`, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveItemGroup(id: number): Observable<any> {
    console.log("Retrieve Item Group: ", id);
    return this.http.get<any>(`${this.apiUrl}ItemGroup/` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateItemGroup(id: number, userGroup: any): Observable<any> {
    console.log("Update Item Group: ", userGroup);
    return this.http.put<any>(`${this.apiUrl}ItemGroup/Update?id=` + id, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteItemGroup(id: number): Observable<any> {
    console.log("Delete UserGroup: ", id);
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
    console.log("Create UserGroup: ", userGroup);
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
    console.log("Update UserGroup: ", userGroup);
    return this.http.put<any>(`${this.apiUrl}UserGroup/Update?id=` + id, userGroup)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteUserGroup(id: number): Observable<any> {
    console.log("Delete UserGroup: ", id);
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
    // console.log("Fetching Account...");;
    //https://localhost:7289/api/UserAccount/GetAccountbyUsername?key=admin
    return this.http.get<any>(`${this.apiUrl}UserAccount/GetAccountbyUsername?username=` + userame)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserAccount(id: number, userAccount: any): Observable<any> {
    // console.log("Update Account: ", userAccount);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update?id=` + id, userAccount)
      .pipe(
        catchError(this.handleError)
      );
  }

  UpdatePassword(id: string, Details: any): Observable<any> {
    console.log("Update Password: ", id);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update/Password?id=` + id, Details)
      .pipe(
        catchError(this.handleError)
      );
  }


  deleteUserAccount(id: number): Observable<any> {
    // console.log("Delete UserAccount: ", id);
    return this.http.delete<any>(`${this.apiUrl}UserAccount/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  verifyUserAccount(id: number): Observable<any> {
    // console.log("Delete UserAccount: ", id);
    return this.http.put<any>(`${this.apiUrl}UserAccount/Update/Verification?id=` + id, id)
      .pipe(
        catchError(this.handleError)
      );
  }
  // isAuthenticated(): boolean {
  //   return !!localStorage.getItem('token');
  // }

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
    console.log("Create Position: ", position);
    return this.http.post<any>(`${this.apiUrl}Position/Create/`, position)
      .pipe(
        catchError(this.handleError)
      );
  }

  updatePosition(id: number, positionName: any): Observable<any> {
    console.log("Update Position: ", positionName);
    return this.http.put<any>(`${this.apiUrl}Position/Update?id=` + id, positionName)
      .pipe(
        catchError(this.handleError)
      );
  }

  deletePosition(id: number): Observable<any> {
    // console.log("Delete UserAccount: ", id);
    return this.http.delete<any>(`${this.apiUrl}Position/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }





  /*----------------------- PROFILE -----------------------*/
  //Profile List
  getAllProfile(): Observable<any> {
    // console.log("Get User Profile: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Profile by userID
  getProfile(userID: string): Observable<any> {
    // console.log("Get User Profile: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/UserID/` + userID)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Profile by userID
  getProfileByUserID(userID: string): Observable<any> {
    // console.log("Get User Profile by userID: ", userID);
    return this.http.get<any>(`${this.apiUrl}UserProfile/SearchByUserID?UserID=` + userID)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchProfile(key: string): Observable<any> {
    console.log("Search User Profile by key: ", key);
    return this.http.get<any>(`${this.apiUrl}UserProfile/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createProfile(userProfile: any): Observable<any> {
    console.log("Create User Profile: ", userProfile);
    return this.http.post<any>(`${this.apiUrl}UserProfile/${userProfile.userID ? 'Create/' : 'Create/GenratedAccount/'} `, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create/GenratedAccount
  createProfileGenAccount(userProfile: any): Observable<any> {
    console.log("Create User Profile: ", userProfile);
    return this.http.post<any>(`${this.apiUrl}UserProfile/Create/GenratedAccount/`, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateProfile(id: number, userProfile: any): Observable<any> {
    console.log("Update User Profile: ", userProfile);
    return this.http.put<any>(`${this.apiUrl}UserProfile/Update?id=` + id, userProfile)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteProfile(id: number): Observable<any> {
    console.log("Delete User Profile: ", id);
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
    console.log("Generate ID for item type: ", type);
    return this.http.get<any>(`${this.apiUrl}Item/generateID/${type}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Seach
  searchItem(key: string): Observable<any> {
    // console.log("Search Item by key: ", key);
    return this.http.get<any>(`${this.apiUrl}Item/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Search
  searchItemByDescription(key: string): Observable<any> {
    console.log("Search Item by Description: ", key);
    // https://localhost:7289/api/Item/Description?description=laptop
    return this.http.get<any>(`${this.apiUrl}Item/Description?description=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }


  //Create
  createItem(item: any): Observable<any> {
    console.log("Create Item: ", item);
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
    console.log("Update Item: ", item);
    return this.http.put<any>(`${this.apiUrl}Item/Update?id=` + id, item)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteItem(id: string): Observable<any> {
    console.log("Delete Item: ", id);
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
    // console.log("Search PAR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}PAR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createPAR(PAR: any): Observable<any> {
    console.log("Create PAR: ", PAR);
    return this.http.post<any>(`${this.apiUrl}PAR/Create/`, PAR)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePAR(parNo: string): Observable<any> {
    console.log("Retrieve PAR No.: ", parNo);
    return this.http.get<any>(`${this.apiUrl}PAR/` + parNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updatePAR(id: string, PAR: any): Observable<any> {
    console.log("Update PAR: ", PAR);
    return this.http.put<any>(`${this.apiUrl}PAR/Update?id=` + id, PAR)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deletePAR(id: string): Observable<any> {
    console.log("Delete PAR: ", id);
    return this.http.delete<any>(`${this.apiUrl}PAR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/PAR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postPAR(parNo: string, postVal: boolean): Observable<any> {
    console.log("Update PAR No. >>> : ", parNo);
    console.log("Update Post flag >>> : ", postVal);
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
    // console.log("Search PAR by key: ", key);
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

    console.log("Create REPAR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}REPAR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveREPAR(reparNo: string): Observable<any> {
    console.log("Retrieve REPAR No.: ", reparNo);
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
    console.log("Update REPAR: ", details);
    console.log("Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}REPAR/Update?id=` + details.reparNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteREPAR(id: string): Observable<any> {
    console.log("Delete REPAR: ", id);
    return this.http.delete<any>(`${this.apiUrl}REPAR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/REPAR/Post?id=PAR012312412-0001&postVal=true
  //Update Post Flag
  postREPAR(reparNo: string, postVal: boolean): Observable<any> {
    console.log("Update REPAR No. >>> : ", reparNo);
    console.log("Update Post flag >>> : ", postVal);
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
    console.log("Create PAR Item: ", parItems);
    return this.http.post<any>(`${this.apiUrl}PARITEM/Create/`, parItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePARItem(parINo: number): Observable<Item[]> {
    console.log("Retrieve PAR Item PARINO.: ", parINo);
    return this.http.get<Item[]>(`${this.apiUrl}PARITEM/` + parINo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By PAR No.
  retrievePARItemByParNo(parNo: string): Observable<Item[]> {
    console.log("Retrieve PAR Item by PAR No.: ", parNo);
    return this.http.get<Item[]>(`${this.apiUrl}PARITEM/PARNO/` + parNo)
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
    console.log("Update PAR No. >>> : ", parNo);
    console.log("Update PAR Item >>> : ", updatedItems);
    return this.http.put<any>(`${this.apiUrl}PARITEM/Update?parNo=` + parNo, updatedItems)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanUniquePARItem(key: string,): Observable<any> {
    console.log("Update PAR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}PARITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanExistingUniquePARItem(parINo: number, key: string): Observable<any> {
    console.log("Update PAR Item No. >>> : ", parINo);
    console.log("Update PAR Item Key >>> : ", key);
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
    // console.log("Search PAR by key: ", key);
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

    console.log("Create ICS Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}ICS/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveICS(icsNo: string): Observable<any> {
    console.log("Retrieve ICS No.: ", icsNo);
    return this.http.get<any>(`${this.apiUrl}ICS/` + icsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  // updateICS(id: string, ICS: any): Observable<any> {
  //   console.log("Update ICS: ", ICS);
  //   return this.http.put<any>(`${this.apiUrl}ICS/Update?id=` + id, ICS)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  updateICS(icsNo: string, ics: any, items: ICSItem[]): Observable<any> {
    console.log("Update ICS Details: ", ics);
    const requestPayload = {
      details: ics,
      icsItems: items
    };
    console.log("Update request Payload: ", requestPayload);
    // https://localhost:7289/api/ICS/Update?icsNo=123
    return this.http.put<any>(`${this.apiUrl}ICS/Update?icsNo=` + icsNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteICS(id: string): Observable<any> {
    console.log("Delete ICS: ", id);
    return this.http.delete<any>(`${this.apiUrl}ICS/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/PAR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postICS(icsNo: string, postVal: boolean): Observable<any> {
    console.log("Update ICS No. >>> : ", icsNo);
    console.log("Update Post flag >>> : ", postVal);
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
    console.log("Create ICS Item: ", icsItems);
    return this.http.post<any>(`${this.apiUrl}ICSItem/Create/`, icsItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By ICS No.
  retrieveICSItemByICSNo(icsNo: string): Observable<ICSItem[]> {
    console.log("Retrieve ICS Item by ICS No.: ", icsNo);

    return this.http.get<ICSItem[]>(`${this.apiUrl}ICSITEM/ICSNO/` + icsNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By ICS No.
  retrieveICSItemByITRNo(itrNo: string): Observable<ICSItem[]> {
    console.log("Retrieve ICS Item by ITR No.: ", itrNo);

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
    console.log("Update ICS Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}ICSITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  scanExistingUniqueICSItem(icsItemNo: number, key: string): Observable<any> {
    console.log("Update ICS Item No. >>> : ", icsItemNo);
    console.log("Update ICS Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}ICSItem/ScanExistingUnique?icsItemNo=${icsItemNo}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  //Update
  updateICSItem(icsNo: string, icsItems: ICSItem[]): Observable<any> {
    console.log("Update ICS No. >>> : ", icsNo);
    console.log("Update ICS Item >>> : ", icsItems);
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
    // console.log("Search ITR by key: ", key);
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

    console.log("Create ITR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}ITR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveITR(itrNo: string): Observable<any> {
    console.log("Retrieve ITR No.: ", itrNo);
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
    console.log("Update ITR: ", details);
    console.log("Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}ITR/Update?id=` + details.itrNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteITR(id: string): Observable<any> {
    console.log("Delete ITR: ", id);
    return this.http.delete<any>(`${this.apiUrl}ITR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postITR(itrNo: string, postVal: boolean): Observable<any> {
    console.log("Update ITR No. >>> : ", itrNo);
    console.log("Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}ITR/Post?id=${itrNo}`, postVal)
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
    // console.log("Search PRS by key: ", key);
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

    console.log("Create PRS Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}PRS/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrievePRS(prsNo: string): Observable<any> {
    console.log("Retrieve PRS No.: ", prsNo);
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
    console.log("Update PRS: ", details);
    console.log("Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}PRS/Update?id=` + details.prsNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deletePRS(id: string): Observable<any> {
    console.log("Delete PRS: ", id);
    return this.http.delete<any>(`${this.apiUrl}PRS/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postPRS(prsNo: string, postVal: boolean): Observable<any> {
    console.log("Update PRS No. >>> : ", prsNo);
    console.log("Update Post flag >>> : ", postVal);
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
    // console.log("Search PRS by key: ", key);
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

    console.log("Create RRSEP Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}RRSEP/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveRRSEP(rrsepNo: string): Observable<any> {
    console.log("Retrieve RRSEP No.: ", rrsepNo);
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
    console.log("Update RRSEP: ", details);
    console.log("Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}RRSEP/Update?id=` + details.rrsepNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteRRSEP(id: string): Observable<any> {
    console.log("Delete RRSEP: ", id);
    return this.http.delete<any>(`${this.apiUrl}RRSEP/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update Post Flag
  postPRRSEP(rrsepNo: string, postVal: boolean): Observable<any> {
    console.log("Update RRSEP No. >>> : ", rrsepNo);
    console.log("Update Post flag >>> : ", postVal);
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
    // console.log("Search OPR by key: ", key);
    return this.http.get<any>(`${this.apiUrl}OPR/Search?key=` + key)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Create
  createOPR(OPR: any): Observable<any> {
    console.log("Create OPR: ", OPR);
    return this.http.post<any>(`${this.apiUrl}OPR/Create/`, OPR)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPR(oprNo: number): Observable<any> {
    console.log("Retrieve OPR No.: ", oprNo);
    return this.http.get<any>(`${this.apiUrl}OPR/` + oprNo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Update
  updateOPR(id: number, OPR: any): Observable<any> {
    console.log("Update OPR: ", OPR);
    return this.http.put<any>(`${this.apiUrl}OPR/Update?id=` + id, OPR)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteOPR(id: number): Observable<any> {
    console.log("Delete OPR: ", id);
    return this.http.delete<any>(`${this.apiUrl}OPR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }

  // https://localhost:7289/api/OPR/Post?id=PAR012312412&postVal=true
  //Update Post Flag
  postOPR(oprNo: number, postVal: boolean): Observable<any> {
    console.log("Update OPR No. >>> : ", oprNo);
    console.log("Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}OPR/Post?id=${oprNo}`, postVal)
      .pipe(
        catchError(this.handleError)
      );
  }

  /*----------------------- OPTR -----------------------*/
  //REPAR List
  getAllOPTR(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}OPTR/`)
      .pipe(
        catchError(this.handleError)
      );
  }
  //Search
  searchOPTR(key: string): Observable<any> {
    // console.log("Search PAR by key: ", key);
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

    console.log("Create OPTR Payload: ", requestPayload);
    return this.http.post<any>(`${this.apiUrl}OPTR/Create/`, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPTR(optrNo: string): Observable<any> {
    console.log("Retrieve OPTR No.: ", optrNo);
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
    console.log("Update OPTR: ", details);
    console.log("Update request Payload: ", requestPayload);
    return this.http.put<any>(`${this.apiUrl}OPTR/Update?id=` + details.optrNo, requestPayload)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Delete
  deleteOPTR(id: string): Observable<any> {
    console.log("Delete OPTR: ", id);
    return this.http.delete<any>(`${this.apiUrl}OPTR/Delete?id=` + id)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/REPAR/Post?id=PAR012312412-0001&postVal=true
  //Update Post Flag
  postOPTR(reparNo: string, postVal: boolean): Observable<any> {
    console.log("Update REPAR No. >>> : ", reparNo);
    console.log("Update Post flag >>> : ", postVal);
    return this.http.put<any>(`${this.apiUrl}REPAR/Post?id=${reparNo}`, postVal)
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
    console.log("Create PAR Item: ", oprItems);
    return this.http.post<any>(`${this.apiUrl}OPRITEM/Create/`, oprItems)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve
  retrieveOPRItem(oprINo: number): Observable<any[]> {
    console.log("Retrieve PAR Item OPRINO.: ", oprINo);
    return this.http.get<Item[]>(`${this.apiUrl}OPRITEM/` + oprINo)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Retrieve By OPR No.
  retrieveOPRItemByOPRNo(oprNo: number): Observable<Item[]> {
    console.log("Retrieve OPR Item by OPR No.: ", oprNo);
    return this.http.get<Item[]>(`${this.apiUrl}OPRITEM/OPRNO/` + oprNo)
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
  updateOPRItem(oprNo: number, updatedItems: OPRItem[]): Observable<any> {
    console.log("Update OPR No. >>> : ", oprNo);
    console.log("Update OPR Item >>> : ", updatedItems);
    return this.http.put<any>(`${this.apiUrl}OPRITEM/Update?oprNo=` + oprNo, updatedItems)
      .pipe(
        catchError(this.handleError)
      );
  }


  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanUniqueOPRItem(key: string,): Observable<any> {
    console.log("Update OPR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}OPRITEM/ScanUnique?key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  // https://localhost:7289/api/PARITEM/Scan?parNo=PAR012312412&key=6742378-65432
  //Scan Key
  scanExistingUniqueOPRItem(oprINo: number, key: string): Observable<any> {
    console.log("Update OPR Item No. >>> : ", oprINo);
    console.log("Update OPR Item Key >>> : ", key);
    return this.http.get<any>(`${this.apiUrl}OPRITEM/ScanExistingUnique?oprINo=${oprINo}&key=${key}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  /*----------------------- Privilege -----------------------*/

  retrievePrivilegByUG(ugid: any) {
    console.log("Retrieve Privilege By UGID.: ", ugid);
    return this.http.get<any[]>(`${this.apiUrl}Privilege/UGID/` + ugid)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveModules() {
    console.log("Retrieve Modules");
    return this.http.get<any[]>(`${this.apiUrl}Privilege/Modules/`)
      .pipe(
        catchError(this.handleError)
      );
  }


  // Create Privilege API
  createPrivilege(privileges: any[]): Observable<any> {
    console.log('Create Privilege: ', privileges);
    return this.http.post<any>(`${this.apiUrl}Privilege/Create/`, privileges).pipe(
      catchError(this.handleError) // Proper error handling
    );
  }

  // Update Privilege API
  updatePrivilege(ugid: number, privileges: any[]): Observable<any> {
    console.log('Update Privilege: ', privileges);

    return this.http.put<any>(`${this.apiUrl}Privilege/Update?ugid=${ugid}`, privileges).pipe(
      catchError(this.handleError) // Proper error handling
    );


  }

  /*----------------------- Reports -----------------------*/


  //https://localhost:7289/api/Report/Offices?module={?}
  getAllOffices(module: string): Observable<any> {
    console.log("Retrieve all Office under module : ", module);
    return this.http.get<any>(`${this.apiUrl}Report/Offices?module=` + module)
      .pipe(
        catchError(this.handleError)
      );
  }


  //https://localhost:7289/api/Report/{Module}?office={?}
  getAllItemByOffice(module: string, office: string): Observable<any> {
    console.log("Run Report: ", `${this.apiUrl}Report/${module.toUpperCase()}?office=` + office);
    return this.http.get<any>(`${this.apiUrl}Report/${module.toUpperCase()}?office=` + office)
      .pipe(
        catchError(this.handleError)
      );
  }

  retrieveITEMByQRCode(qrcode: string): Observable<any> {
    console.log("Scan Item: ", `${this.apiUrl}Report/GetItemsByQRCode?qrcode=` + qrcode);
    return this.http.get<any>(`${this.apiUrl}Report/GetItemsByQRCode?qrcode=` + qrcode)
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
