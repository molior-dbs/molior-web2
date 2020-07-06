import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';


export interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    password: string;
}

export class UserDataSource extends TableDataSource<User> {
    constructor(service: TableService<User>) {
        super('users', service);
    }
}

@Injectable()
export class UserService extends TableService<User> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('name', params.get('name'))
                .set('email', params.get('email'))
                .set('admin', params.get('admin'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(name: string) {
        return this.http.get<User>(`${apiURL()}/api2/user/${name}`);
    }

    create(name: string, email: string, isAdmin: boolean, password: string) {
        return this.http.post<any>(`${apiURL()}/api/users`, {name, email, is_admin: isAdmin, password});
    }

    edit(id: number, email: string, isAdmin: boolean, password: string) {
        return this.http.put<User>(`${apiURL()}/api/user/${id}`, {email, is_admin: isAdmin, password});
    }

    getAll() {
        return this.http.get<User[]>(`/users`);
    }

    delete(id: number) {
        return this.http.delete<User>(`${apiURL()}/api/user/${id}`).subscribe();
    }
}
