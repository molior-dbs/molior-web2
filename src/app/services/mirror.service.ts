import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AbstractControl} from '@angular/forms';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';

export interface Mirror {
    id: number;
    name: string;
    version: string;
    url: string;
    basemirror_id: number;
    basemirror_url: string;
    basemirror_name: string;
    distribution: string;
    components: string;
    is_basemirror: boolean;
    architectures: string[];
    is_locked: boolean;
    with_sources: boolean;
    with_installer: boolean;
    project_id: number;
    state: string;
    apt_url: string;
    mirrorkeyurl: string;
    mirrorkeyids: string;
    mirrorkeyserver: string;
}

export class MirrorDataSource extends TableDataSource<Mirror> {
    constructor(service: TableService<Mirror>) {
        super('mirrors', service);
    }
}

@Injectable()
export class MirrorService extends TableService<Mirror> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('q', params.get('filter_name'))
                .set('q_basemirror', params.get('filter_basemirror'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(name: string, version: string) {
        return this.http.get<Mirror>(`${apiURL()}/api/mirror/${name}/${version}`);
    }

    getMirrors(url: string = '') {
        let p = {};
        if (url) {
            p = new HttpParams().set('url', url);
        }
        return this.http.get(`${apiURL()}/api/mirrors`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<Mirror>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
            );
    }

    getBaseMirrors(search: string = '') {
        const p: any = {basemirror: 'true'};
        if (search) {
            p.q = search;
        }
        return this.http.get(`${apiURL()}/api/mirrors`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<Mirror>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
            );
    }

    create(mirrorname: string,
           mirrorversion: string,
           mirrortype: string,
           basemirror: string,
           external: boolean,
           mirrorurl: string,
           mirrordist: string,
           mirrorcomponents: string,
           architectures: string[],
           mirrorsrc: boolean,
           mirrorinst: boolean,
           mirrorkeytype: string,
           mirrorkeyurl: string,
           mirrorkeyids: string,
           mirrorkeyserver: string
          ) {
        return this.http.post(`${apiURL()}/api2/mirror`,
                                      {mirrorname: mirrorname.trim(),
                                       mirrorversion: mirrorversion.trim(),
                                       mirrortype,
                                       basemirror,
                                       external,
                                       mirrorurl: mirrorurl.trim(),
                                       mirrordist: mirrordist.trim(),
                                       mirrorcomponents: mirrorcomponents.trim(),
                                       architectures,
                                       mirrorsrc,
                                       mirrorinst,
                                       mirrorkeytype,
                                       mirrorkeyurl: mirrorkeyurl.trim(),
                                       mirrorkeyids: mirrorkeyids.trim(),
                                       mirrorkeyserver: mirrorkeyserver.trim()
                                      });
    }

    edit(id: number,
         mirrorname: string,
         mirrorversion: string,
         mirrortype: string,
         basemirror: string,
         external_repo: boolean,
         mirrorurl: string,
         mirrordist: string,
         mirrorcomponents: string,
         architectures: string[],
         mirrorsrc: boolean,
         mirrorinst: boolean,
         mirrorkeytype: string,
         mirrorkeyurl: string,
         mirrorkeyids: string,
         mirrorkeyserver: string
        ) {
        return this.http.put(`${apiURL()}/api2/mirror/${mirrorname.trim()}/${mirrorversion.trim()}`,
                                      {mirrortype,
                                       basemirror,
                                       external_repo,
                                       mirrorurl: mirrorurl.trim(),
                                       mirrordist: mirrordist.trim(),
                                       mirrorcomponents: mirrorcomponents.trim(),
                                       architectures,
                                       mirrorsrc,
                                       mirrorinst,
                                       mirrorkeytype,
                                       mirrorkeyurl: mirrorkeyurl.trim(),
                                       mirrorkeyids: mirrorkeyids.trim(),
                                       mirrorkeyserver: mirrorkeyserver.trim()
                                      });
    }

    delete(id: number) {
        return this.http.delete(`${apiURL()}/api/mirror/${id}`);
    }

    update(id: number) {
        return this.http.post(`${apiURL()}/api/mirror/${id}/update`, null).subscribe();
    }
}

export function BaseMirrorValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== undefined && this.basemirrors && !this.basemirrors.hasOwnProperty(control.value)) {
        return { invalidValue: true };
    }
    return null;
}

