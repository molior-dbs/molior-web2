import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';
import {WebsocketService, UpdateEvent} from './websocket';

export interface Build {
    id: number;
    can_rebuild: boolean;
    buildstate: string;
    buildtype: string;
    startstamp: string;
    endstamp: string;
    version: string;
    sourcename: string;
    maintainer: string;
    maintainer_email: string;
    git_ref: string;
    branch: string;
    sourcerepository_id: number;
    project: {id: number; name: string;
              version: {id: number; name: string; is_locked: boolean}};
    buildvariant: {name: string;
                   architecture: {id: number; name: string};
                   base_mirror: {id: number; name: string; version: string}
                  };
    progress: number;
}

export class BuildDataSource extends TableDataSource<Build> {
    timer;
    constructor(service: TableService<Build>) {
        super('builds', service);
        this.timer = null;
    }

    dataHook(builds) {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(this.updateRuntimes.bind(this), 1000, builds);
        return builds;
    }

    updateRuntimes(builds) {
        // console.log('updating runtimes');
        let found = false;
        builds.forEach(build => {
            if (build.buildstate !== 'new' &&
                build.buildstate !== 'build_failed' &&
                build.buildstate !== 'publish_failed' &&
                build.buildstate !== 'successful' &&
                build.buildstate !== 'already_exists' &&
                build.buildstate !== 'nothing_done') {
                if (build.startstamp !== '') {
                    found = true;
                    const interval = (new Date().getTime() - new Date(build.startstamp).getTime()) / 1000.0;
                    const mins = Math.floor(interval / 60.0);
                    let secs = `${Math.floor(interval % 60.0)}`;
                    if (mins > 0) {
                        secs = secs.padStart(2, '0');
                        build.runtime = `${mins}'${secs}''`;
                    } else {
                        build.runtime = `${secs}''`;
                    }
                }
            }
        });
        if (found) {
            this.timer = setTimeout(this.updateRuntimes.bind(this), 1000, builds);
        }
    }
}

export function buildicon(buildstate) {
    switch (buildstate) {
        case 'new':
            return 'schedule';
        case 'successful':
        case 'already_exists':
        case 'nothing_done':
            return 'done';
        case 'scheduled':
            return 'schedule';
        case 'build_failed':
            return 'clear';
        case 'building':
            return 'sync';
        case 'publishing':
            return 'publish';
        case 'needs_publish':
            return 'call_merge';
        case 'publish_failed':
            return 'publish';
        case 'needs_build':
            return 'more_horiz';
    }
}

@Injectable()
export class BuildService extends TableService<Build> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('version', params.get('filter_name'))
                .set('maintainer', params.get('filter_maintainer'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(id: number) {
        return this.http.get<Build>(`${apiURL()}/api/builds/${id}`);
    }

    getlog(id: number) {
        return this.http.get<any>(`${apiURL()}/buildout/${id}/build.log`,
                                     { responseType: 'text' as 'json' }).pipe(
                                         map(res => res.split('\n')));  // FIXME: ignore last \n
    }

    rebuild(id: number) {
        console.log(`rebuilding build ${id}`);
        return this.http.delete(`${apiURL()}/api/builds/${id}`).subscribe();
    }
}

