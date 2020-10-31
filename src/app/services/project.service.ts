import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
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
    description: string;
    dependency_policy: string;
    ci_builds_enabled: boolean;
}

export interface Permission {
    id: number;
    username: string;
    role: string;
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
        const p: any = {};
        if (params.get('filter_name')) {
            p.q = params.get('filter_name');
        }
        if (params.get('page')) {
            p.page = params.get('page');
        }
        if (params.get('pagesize')) {
            p.page_size = params.get('pagesize');
        }
        return p;
    }

    get(name: string) {
        return this.http.get<Project>(`${apiURL()}/api2/project/${name}`);
    }

    create(name: string, description: string) {
        console.log('creating project:', name);
        return this.http.post(`${apiURL()}/api/projects`, {name, description}).subscribe();
    }

    edit(id: number, description: string) {
        console.log('editing project:', id);
        return this.http.put(`${apiURL()}/api/project/${id}`, {description}).subscribe();
    }

    delete(name: string) {
        console.log('deleting project:', name);
        return this.http.delete(`${apiURL()}/api2/project/${name}`);
    }

    addPermission(name: string, username: string, role: string) {
        return this.http.post(`${apiURL()}/api2/project/${name}/permissions`, {username, role}).subscribe();
    }

    editPermission(name: string, username: string, role: string) {
        return this.http.put(`${apiURL()}/api2/project/${name}/permissions`, {username, role}).subscribe();
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
        const p: any = {};
        if (params.get('filter_name')) {
            p.q = params.get('filter_name');
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
        return this.http.get<ProjectVersion>(`${apiURL()}/api2/project/${name}/${version}`);
    }

    create(project: string, version: string, description: string, dependencylevel: string, basemirror: string, architectures: string[],
           cibuilds: boolean) {
        console.log(`creating projectversion: ${project}/${version} on ${basemirror} for ${architectures}`);
        return this.http.post<ProjectVersion>(`${apiURL()}/api2/project/${project}/versions`,
            { name: version, description, dependency_policy: dependencylevel, basemirror, architectures, cibuilds }).subscribe();
    }

    edit(project: string, version: string, description: string, dependencylevel: string, cibuilds: boolean) {
        console.log(`editing projectversion: ${project}/${version}`);
        return this.http.put<ProjectVersion>(`${apiURL()}/api2/project/${project}/${version}`,
            { description, dependency_policy: dependencylevel, cibuilds }).subscribe();
    }

    getDependencies(p: ProjectVersion) {
        const params: any = {candidates: true};
        return this.http.get(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependencies`,
                             {params}).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<ProjectVersion>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
        );
    }

    addDependency(p: ProjectVersion, dependency: string, useCIBuilds: boolean) {
        return this.http.post(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependencies`, { dependency,
                                                                                                     use_cibuilds: useCIBuilds });
    }

    removeDependency(p: ProjectVersion, dependency: string) {
        return this.http.delete(`${apiURL()}/api2/project/${p.project_name}/${p.name}/dependency/${dependency}`);
    }

    get_apt_sources(name: string, version: string, ci: boolean = false) {
        const params: any = {};
        if (ci) {
            params.unstable = true;
        }
        return this.http.get<string>(`${apiURL()}/api/projectsources/${name}/${version}`, {params, responseType: 'text' as 'json'});
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

    delete(p: ProjectVersion) {
        return this.http.delete<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}`, {});
    }
}
