import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';

export class User {
    id: number;
    username: string;
    isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject: BehaviorSubject<User>;
    public currentUser: Observable<User>;
    private headers = { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })};

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User {
       return this.currentUserSubject.value;
    }

    login(username, password) {
       return this.http.post<any>(`${apiURL()}/api/login`, {username, password},
       {...this.headers, observe: 'response', withCredentials: true })
       .pipe(map((res: HttpResponse<object>) => {
           const user = new User();
           user.username = username;
           localStorage.setItem('currentUser', JSON.stringify(user));
           this.currentUserSubject.next(user);
           return user;
       }));
    }

    logout() {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
        this.http.post(`${apiURL()}/api/logout`, '', {withCredentials: true}).subscribe();
    }
}
