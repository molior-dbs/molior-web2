import {Component, ElementRef, ViewChild, Input, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';


@Component({
    selector: 'app-projectversion-build-list',
    templateUrl: './projectversion-build-list.html',
    styleUrls: ['./projectversion-build-list.scss']
})
export class ProjectversionBuildListComponent {
    buildicon;
    projectversion: ProjectVersion;

    constructor(protected route: ActivatedRoute,
                protected projectversionService: ProjectVersionService) {
        this.projectversion = {id: -1, name: '', is_locked: false,
                               project_name: '',
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false};
        this.route.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            const version = params.get('version');
            this.projectversionService.get(name, version).subscribe((res: ProjectVersion) => this.projectversion = res);
        });
    }
}
