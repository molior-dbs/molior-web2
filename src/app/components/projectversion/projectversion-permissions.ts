import {Component, ElementRef, ViewChild, Input, OnInit, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {Observable, BehaviorSubject} from 'rxjs';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {UserService, UserDataSource, User} from '../../services/user.service';


@Component({
    selector: 'app-projectversion-permissions',
    templateUrl: './projectversion-permissions.html',
    styleUrls: ['./projectversion-permissions.scss']
})
export class ProjectversionPermissionsComponent extends TableComponent {
    buildicon;
    dataSource: UserDataSource;
    projectversion: ProjectVersion;
    displayedColumns: string[] = [
        'name',
        'actions'
    ];
    // @ViewChild('inputURL', { static: false }) inputURL: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected userService: UserService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_url', '']]);
        this.dataSource = new UserDataSource(userService);
        this.projectversion = {id: -1, name: '', is_locked: false,
                               project_name: '',
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: [],
                               projectversiontype: 'regular'};
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const version = params.get('version');
            this.route.parent.parent.paramMap.subscribe((params2: ParamMap) => {
                const name = params2.get('name');
                this.projectversionService.get(name, version).subscribe((res: ProjectVersion) => this.projectversion = res);
                // this.dataSource.load(`/api2/project/${name}/${version}/repositories`, this.params);
            });
        });
    }

    initElements() {
        // this.inputURL.nativeElement.value = this.params.get('filter_url');
    }

    setParams() {
        // this.params.set('filter_url', this.inputURL.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        // this.initFilter(this.inputURL.nativeElement);
    }

    create(): void {
    }

    edit(element) {
    }

    delete(id: number) {
    }
}
