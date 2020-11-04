import {Component, OnInit, Input, ViewChild, ElementRef, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {ProjectVersion, ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';

@Component({
    selector: 'app-projectversion-dependents',
    templateUrl: './projectversion-dependents.html'
})
export class ProjectversionDependentsComponent extends TableComponent {
    projectversion: ProjectVersion;
    projectName: string;
    projectVersion: string;
    dataSource: ProjectVersionDataSource;
    displayedColumns: string[] = [
        'dependent',
        'architectures',
        'basemirror',
        'is_locked',
        'ci_builds_enabled',
        'use_cibuilds',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(public route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService) {
        super(route, router, [['filter_name', '']]);
        this.projectversion = {id: -1, name: this.projectVersion, is_locked: false,
                               project_name: this.projectName,
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: []};
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    loadData() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.projectName = params.get('name');
            this.projectVersion = params.get('version');
            this.projectversionService.get(this.projectName,
                this.projectVersion).subscribe((res: ProjectVersion) => {
                    this.projectversion = res;
                });
            this.dataSource.load(`/api2/project/${this.projectName}/${this.projectVersion}/dependents`, this.params);
        });
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    getDependentLink(element) {
        return ['/project', element.project_name, element.name];
    }

}
