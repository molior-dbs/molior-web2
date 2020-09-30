import {Component, ElementRef, ViewChild, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

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
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict'};
        this.projectversionService.get(this.projectversion.project_name,
            this.projectversion.name).subscribe((res: ProjectVersion) => this.projectversion = res);
    }
}
