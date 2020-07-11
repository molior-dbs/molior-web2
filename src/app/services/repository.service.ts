import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';

export interface Repository {
    id: number;
    name: string;
    statue: string;
    url: string;
}

export class RepositoryDataSource extends TableDataSource<Repository> {
    constructor(service: TableService<Repository>) {
        super('repository', service);
    }
}

@Injectable()
export class RepositoryService extends TableService<Repository> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('filter_url', params.get('filter_url'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    find(url, excludeProjectversionID = -1) {
        const p = new HttpParams().set('url', url).set('exclude_projectversion_id', excludeProjectversionID.toString());
        return this.http.get(`${apiURL()}/api2/repositories`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<Repository>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
            );
    }

    add(projectversion, url, architectures) {
        return this.http.post(`${apiURL()}/api2/project/${projectversion.project_name}/${projectversion.name}/repositories`,
            { url, architectures });
    }

    reclone(id: number) {
        return this.http.post(`${apiURL()}/api/repositories/${id}/clone`, null);
    }

    build(id: number) {
        return this.http.post(`${apiURL()}/api/repositories/${id}/build`, null);
    }

    delete(id: number, ProjectversionID: number) {
        return this.http.delete(`${apiURL()}/api/projectversions/${ProjectversionID}/repositories/${id}`);
    }

    edit(projectversion, id: number, url: string, architectures: string[]) {
        return this.http.put(`${apiURL()}/api2/project/${projectversion.project_name}/${projectversion.name}/repository/${id}`,
                             {url, architectures}
                            );
    }
}
