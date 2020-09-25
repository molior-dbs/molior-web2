import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {TableService, TableDataSource, MoliorResult } from '../lib/table.datasource';

export interface Project {
    id: number;
    name: string;
    description: string;
}

export interface ProjectVersion {
    id: number;
    name: string;
    is_locked: boolean;
    project_name: string;
    apt_url: string;
    architectures: string[];
    basemirror: string;
    is_mirror: boolean;
}

export class ProjectDataSource extends TableDataSource<Project> {
    constructor(service: TableService<Project>) {
        super('projects', service);
    }
}

@Injectable()
export class ProjectService extends TableService<Project> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('q', params.get('filter_name'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(name: string) {
        return this.http.get<Project>(`${apiURL()}/api2/project/${name}`);
    }

    create(name: string, description: string) {
        console.log('creating project:', name);
        return this.http.post<Project>(`${apiURL()}/api/projects`, {name, description}).subscribe();
    }

    edit(id: number, description: string) {
        console.log('editing project:', id);
        return this.http.put<Project>(`${apiURL()}/api/project/${id}`, {description}).subscribe();
    }
}

export class ProjectVersionDataSource extends TableDataSource<ProjectVersion> {
    constructor(service: TableService<ProjectVersion>) {
        super('projectversions', service);
    }
}

@Injectable()
export class ProjectVersionService extends TableService<ProjectVersion> {
    constructor(protected http: HttpClient) {
        super(http);
    }

    getAPIParams(params) {
        return new HttpParams()
                .set('q', params.get('filter_name'))
                .set('page', params.get('page').toString())
                .set('page_size', params.get('pagesize').toString());
    }

    get(name: string, version: string) {
        return this.http.get<ProjectVersion>(`${apiURL()}/api2/project/${name}/${version}`);
    }

    create(project: string, version: string, description: string, basemirror: string, architectures: string[]) {
        console.log(`creating projectversion: ${project}/${version} on ${basemirror} for ${architectures}`);
        return this.http.post<Project>(`${apiURL()}/api2/project/${project}/versions`,
            { name: version, description, basemirror, architectures }).subscribe();
    }

    getDependencies(p: ProjectVersion) {
        const h = new HttpParams().set('candidates', 'true');
        return this.http.get(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependencies`,
                             { params: h }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<ProjectVersion>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
        );
    }

    addDependency(p: ProjectVersion, dependency: string) {
        return this.http.post(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependencies`, { dependency });
    }

    removeDependency(p: ProjectVersion, dependency: string) {
        return this.http.delete(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependency/${dependency}`);
    }

    get_apt_sources(name: string, version: string) {
        return this.http.get<string>(`${apiURL()}/api/projectsources/${name}/${version}`);
    }

    clone(p: ProjectVersion, name: string) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/clone`, { name });
    }

    lock(p: ProjectVersion) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/lock`, {});
    }

    overlay(p: ProjectVersion, name: string) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/overlay`, { name });
    }

    snapshot(p: ProjectVersion, name: string) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/snapshot`, { name });
    }
}


