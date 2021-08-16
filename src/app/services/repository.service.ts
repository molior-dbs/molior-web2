import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult} from '../lib/table.datasource';
import {ProjectVersion} from '../services/project.service';


export interface RepoDependentProjectVersions {
    total_result_count: number;
    results: ProjectVersion[];
}

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
        if (params.get('filter_name')) {
            p.q = params.get('filter_name');
        }
        if (params.get('filter_url')) {
            p.filter_url = params.get('filter_url');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
    }

    find(url, excludeProjectversionID = -1) {
        const p: any = {filter_url: url, exclude_projectversion_id: excludeProjectversionID.toString()};
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

    remove(projectversion, id: number) {
        return this.http.delete(`${apiURL()}/api2/project/${projectversion.project_name}/${projectversion.name}/repository/${id}`);
    }

    delete_repo(id: number) {
        return this.http.delete(`${apiURL()}/api2/repository/${id}`);
    }

    edit(projectversion, id: number, architectures: string[]) {
        return this.http.put(`${apiURL()}/api2/project/${projectversion.project_name}/${projectversion.name}/repository/${id}`,
                             {architectures}
                            );
    }

    editUrl(id: number, url: string) {
        return this.http.put(`${apiURL()}/api2/repository/${id}`, {url});
    }

    get_projectversion_repo(name: string, version: string, repoId: number) {
        return this.http.get<Repository>(`${apiURL()}/api2/project/${name}/${version}/repository/${repoId}`);
    }

    addHook(pv: any, repoid: number, url: string, skipssl: boolean, method: string, hooktype: string, body: string) {
        return this.http.post(`${apiURL()}/api2/project/${pv.project_name}/${pv.name}/repository/${repoid}/hook`,
            { url, skipssl: skipssl ? 'true' : 'false', method, hooktype, body });
    }

    editHook(pv: any, repoid: number, id: number, url: string, skipssl: boolean, method: string,
             hooktype: string, body: string, enabled: boolean) {
        return this.http.put(`${apiURL()}/api2/project/${pv.project_name}/${pv.name}/repository/${repoid}/hook/${id}`,
            { url, skipssl: skipssl ? 'true' : 'false' , method, hooktype, body, enabled: enabled ? 'true' : 'false' });
    }

    removeHook(pv: any, repoid: number, id: number) {
        return this.http.delete(`${apiURL()}/api2/project/${pv.project_name}/${pv.name}/repository/${repoid}/hook/${id}`);
    }

    trigger(repoUrl: string, gitref: string, targets: string[] = [], forceCI: boolean = true) {
        return this.http.post(`${apiURL()}/api/build`, {repository: repoUrl, git_ref: gitref, forceCI, targets});
    }

    mergeDuplicate(id: number, duplicate: number) {
        return this.http.put(`${apiURL()}/api2/repository/${id}/merge`, {duplicate});
    }

    getRepoDependentProjectVersions(id: number, unlocked: boolean = false) {
        const params: any = {};
        if (unlocked) {
            params.unlocked = 'true';
        }
        return this.http.get<RepoDependentProjectVersions>(`/api2/repository/${id}/dependents`, {params});
    }
}
