import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';

export interface Repository {
    id: number;
    name: string;
    state: string;
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
        const p: any = {};
        if (params.get('filter_url')) { p.filter_url = params.get('filter_url'); }
        if (params.get('filter_name')) { p.filter_name = params.get('filter_name'); }
        if (params.get('page')) { p.page = params.get('page'); }
        if (params.get('pagesize')) { p.page_size = params.get('pagesize'); }
        return p;
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

    get_projectversion_repo(name: string, version: string, repoID: number) {
        return this.http.get<Repository>(`${apiURL()}/api2/project/${name}/${version}/repository/${repoID}`);
    }

    addHook(pv: any, repo: Repository, url: string) {
        return this.http.post(`${apiURL()}/api2/project/${pv.project_name}/${pv.name}/repository/${repo.id}/hook`,
            { url });
    }

    cibuild(url: string, gitref: string) {
        return this.http.post(`${apiURL()}/api/build`, {repository: url, git_ref: gitref});
    }

    mergeDuplicate(id: number, duplicate: number) {
        return this.http.put(`${apiURL()}/api2/repository/${id}/merge`, {duplicate});
    }
}
