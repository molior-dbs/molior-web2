import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';

export interface Node {
  name: string;
  arch: string;
  state: string;
  load: [number, number, number];
  uptime_seconds: number;
  cpu_cores: number;
  ram_used: number;
  ram_total: number;
  disk_used: number;
  disk_total: number;
  id: string; // machine_id, id needed to update table datasource
  ip: string;
  client_ver: string;
  sourcename: string;
  sourceversion: string;
  sourcearch: string;
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
        const p: any = {};
        if (params.get('filter')) {
            p.q = params.get('filter');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
    }

    get(machineID: string) {
        return this.http.get<Node>(`${apiURL()}/api/node/${machineID}`);
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

export function getUptime(node: Node): string {
    const d = Math.floor(node.uptime_seconds / 3600.0 / 24.0);
    let h = -1.0;
    if (d > 0) {
        h = Math.floor((node.uptime_seconds % (d * 24.0 * 3600.0)) / 3600.0);
    } else {
        h = Math.floor(node.uptime_seconds / 3600.0);
    }
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

export function getMemory(node: Node): string {
    return String((node.ram_used / 1024.0 / 1024.0 / 1024.0).toFixed(2)) + ' / ' +
           String((node.ram_total / 1024.0 / 1024.0 / 1024.0).toFixed(2)); // GB
}

export function getDisk(node: Node): string {
    return String((node.disk_used / 1024.0 / 1024.0 / 1024.0).toFixed(2)) + ' / ' +
           String((node.disk_total / 1024.0 / 1024.0 / 1024.0).toFixed(2)); // GB
}

export function memoryAlmostFull(node: Node): boolean {
    if (node && node.ram_used / node.ram_total > 0.9) {
        return true;
    }
    return false;
}

export function getMemoryUsagePerc(node: Node): number {
    return node.ram_used / node.ram_total * 100.0;
}

export function diskAlmostFull(node: Node): boolean {
    if (node && node.disk_used / node.disk_total > 0.9) {
        return true;
    }
    return false;
}

export function getDiskUsagePerc(node: Node): number {
    return node.disk_used / node.disk_total * 100.0;
}
