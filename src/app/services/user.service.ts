import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

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
        const p: any = {};
        if (params.get('name')) {
            p.name = params.get('name');
        }
        if (params.get('email')) {
            p.email = params.get('email');
        }
        if (params.get('admin')) {
            p.admin = params.get('admin');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
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
        return this.http.delete<User>(`${apiURL()}/api/user/${id}`);
    }

    getProjectRoleCandidates(projectname: string, search: string) {
        return this.http.get<User[]>(`${apiURL()}/api2/projectbase/${projectname}/permissions`, {params: {candidates: 'true', q: search}});
    }
}

export interface Token {
    id: number;
    token: string;
    description: string;
}

export class TokenDataSource extends TableDataSource<Token> {
    constructor(service: TableService<Token>) {
        super('tokens', service);
    }
}

@Injectable()
export class TokenService extends TableService<Token> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        const p: any = {};
        if (params.get('description')) {
            p.description = params.get('description');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
    }

    createToken(description: string) {
        return this.http.post(`${apiURL()}/api2/tokens`, {description});
    }

    deleteToken(id: number) {
        return this.http.request('delete', `${apiURL()}/api2/tokens`, {body: {id}});
    }

    getTokens(search: string = '', excludeProjectID: number = null) {
        const p: any = {};
        if (search) {
            p.description = search;
        }
        if (excludeProjectID) {
            p.exclude_project_id = excludeProjectID;
        }
        return this.http.get(`${apiURL()}/api2/tokens`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<Token>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
            );
    }
}

