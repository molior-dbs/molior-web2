import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';

export interface Node {
  id: number;
  name: string;
  arch: string;
  state: string;
  load: [number, number, number];
  uptime_seconds: number;
}

export class NodeDataSource extends TableDataSource<Node> {
    constructor(service: TableService<Node>) {
        super('nodes', service);
    }
}

@Injectable()
export class NodeService extends TableService<Node> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('q', params.get('filter'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(name: string) {
        return this.http.get<Node>(`${apiURL()}/api/node/${name}`);
    }
}
