import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';

export interface ServerInfo {
    'uptime_seconds': number;
    'load': number;
    'cpu_cores': number;
    'ram': number;
    'disk': any;
}


@Injectable()
export class ServerService {
    constructor(protected http: HttpClient) {
    }

    getInfo() {
        return this.http.get<ServerInfo>(`${apiURL()}/api/server`);
    }
}
