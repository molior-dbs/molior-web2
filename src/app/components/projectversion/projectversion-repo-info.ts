import {Component, ElementRef, ViewChild, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {ProjectVersion} from '../../services/project.service';

@Component({
    selector: 'app-projectversion-repo-info',
    templateUrl: './projectversion-repo-info.html',
    styleUrls: ['./projectversion-repo-info.scss']
})
export class ProjectversionRepoComponent {
    projectversion: ProjectVersion;

    constructor(protected route: ActivatedRoute,
                protected router: Router) {
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: ''};
    }
}
