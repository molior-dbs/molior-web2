import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AbstractControl} from '@angular/forms';

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
    dependency_ids: number[];
    dependent_ids: number[];
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
        if (params.get('filter_role')) {
            p.role = params.get('filter_role');
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
        return this.http.get<Project>(`${apiURL()}/api2/projectbase/${name}`);
    }

    create(name: string, description: string) {
        return this.http.post(`${apiURL()}/api/projects`, {name, description});
    }

    edit(id: number, description: string) {
        return this.http.put(`${apiURL()}/api/projectbase/${id}`, {description});
    }

    delete(name: string) {
        return this.http.delete(`${apiURL()}/api2/projectbase/${name}`);
    }

    addPermission(name: string, username: string, role: string) {
        return this.http.post(`${apiURL()}/api2/projectbase/${name}/permissions`, {username, role});
    }

    editPermission(name: string, username: string, role: string) {
        return this.http.put(`${apiURL()}/api2/projectbase/${name}/permissions`, {username, role});
    }

    deletePermission(name: string, username: string) {
        return this.http.request('delete', `${apiURL()}/api2/projectbase/${name}/permissions`, {body: {username}});
    }

    createToken(name: string, description: string) {
        return this.http.post(`${apiURL()}/api2/projectbase/${name}/token`, {description});
    }

    addToken(name: string, description: string) {
        return this.http.put(`${apiURL()}/api2/projectbase/${name}/token`, {description});
    }

    deleteToken(name: string, id: number) {
        return this.http.request('delete', `${apiURL()}/api2/projectbase/${name}/tokens`, {body: {id}});
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

    create(project: string, version: string, description: string, dependencylevel: string, basemirror: string, baseproject: string,
           architectures: string[], cibuilds: boolean) {
        return this.http.post<ProjectVersion>(`${apiURL()}/api2/projectbase/${project}/versions`,
            { name: version, description, dependency_policy: dependencylevel, basemirror, baseproject, architectures, cibuilds });
    }

    edit(project: string, version: string, description: string, dependencylevel: string, cibuilds: boolean) {
        return this.http.put<ProjectVersion>(`${apiURL()}/api2/project/${project}/${version}`,
            { description, dependency_policy: dependencylevel, cibuilds });
    }

    getDependencies(p: ProjectVersion, search: string) {
        const params: any = {candidates: true, q: search};
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
        return this.http.get<string>(`${apiURL()}/api2/project/${name}/${version}/aptsources`, {params, responseType: 'text' as 'json'});
    }

    copy(p: ProjectVersion, version: string, description: string, dependencylevel: string, basemirror: string, baseproject: string,
         architectures: string[], cibuilds: boolean, buildlatest: boolean) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/copy`,
            { name: version, description, dependency_policy: dependencylevel, basemirror, baseproject,
              architectures, cibuilds, buildlatest });
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

    delete(p: ProjectVersion, forceremoval: boolean) {
        return this.http.delete<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}?forceremoval=${forceremoval}`);
    }

    buildUpload(p: ProjectVersion, formData) {
        return this.http.post<string>(`${apiURL()}/api2/project/${p.project_name}/${p.name}/extbuild`, formData);
    }

    getBaseProjects(search: string = '') {
        const p: any = {};
        if (search) {
            p.q = search;
        }
        return this.http.get(`${apiURL()}/api/projectversions`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<ProjectVersion>(res['total_result_count'], res['results']))
            /* tslint:enable:no-string-literal */
            );
    }

}

export function BaseProjectValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== undefined && this.baseprojects ) {
        let found = false;
        for (const i in this.baseprojects) {
            if (i) {
                const base = this.baseprojects[i];
                if (base.name === control.value) {
                    found = true;
                }
            }
        }
        if (!found) {
            return { invalidValue: true };
        }
    }
    return null;
}

