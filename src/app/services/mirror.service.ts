import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
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
        const p: any = {};
        if (params.get('filter_name')) {
            p.q = params.get('filter_name');
        }
        if (params.get('filter_basemirror')) {
            p.q_basemirror = params.get('filter_basemirror');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
    }

    get(name: string, version: string) {
        return this.http.get<Mirror>(`${apiURL()}/api2/mirror/${name}/${version}`);
    }

    getMirrors(url: string = '') {
        const p: any = {};
        if (url) {
            p.url = url;
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

    edit(mirrorname: string,
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
        return this.http.put(`${apiURL()}/api2/mirror/${mirrorname.trim()}/${mirrorversion.trim()}`,
                                      {mirrortype,
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

    delete(mirror: Mirror) {
        return this.http.delete(`${apiURL()}/api2/mirror/${mirror.name}/${mirror.version}`);
    }

    update(id: number) {
        return this.http.post(`${apiURL()}/api/mirror/${id}/update`, null);
    }
}

export function BaseMirrorValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== undefined && this.basemirrors && !this.basemirrors.hasOwnProperty(control.value)) {
        return { invalidValue: true };
    }
    return null;
}

