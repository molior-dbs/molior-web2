import {Component, ElementRef, ViewChild, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';

@Component({
    selector: 'app-projectversion-repo-info',
    templateUrl: './projectversion-repo-info.html',
    styleUrls: ['./projectversion-repo-info.scss']
})
export class ProjectversionRepoComponent {
    projectversion: ProjectVersion;
    repository: Repository;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected repositoryService: RepositoryService) {
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false};
        this.repository = {id: +this.route.parent.snapshot.paramMap.get('id'), name: '', status: '', url: ''};
        this.projectversionService.get(this.projectversion.project_name,
            this.projectversion.name).subscribe((res: ProjectVersion) => this.projectversion = res);
        this.repositoryService.get_projectversion_repo(this.projectversion.project_name,
            this.projectversion.name, this.repository.id).subscribe((res: Repository) => this.repository = res);
    }
}
