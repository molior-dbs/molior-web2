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

export function getLoadColor(load: number) {
    let color = 'blue';
    if (load < 1.0) {
        color = `hsl(${ 128 - load * 64 }, 100%, 34%)`;
    } else if (load < 3.0) {
        color = `hsl(${ 64 - (load - 1.0) * 16 }, 100%, 34%)`;
    } else {
        color = `hsl(${ 32 - (load - 3.0) * 4 }, 100%, 34%)`;
    }
    return color;
}

export function getUptime(node) {
    const d = Math.floor(node.uptime_seconds / 3600.0 / 24.0);
    const h = Math.floor((node.uptime_seconds % (3600.0 * 24.0 * d)) / 3600.0);
    const m = Math.floor((node.uptime_seconds % 3600.0) / 60.0);
    if (d > 0) {
        const hrs = `${h}`.padStart(2, '0');
        const mins = `${m}`.padStart(2, '0');
        return `${d}d ${hrs}h ${mins}m`;
    } else if (h > 0) {
        const mins = `${m}`.padStart(2, '0');
        return `${h}h ${mins}m`;
    }
    return `${m}m`;
}
