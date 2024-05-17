import {Component, OnInit, Input, ViewChild, ElementRef, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

import {ProjectVersion, ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';
import {ProjectversionDialogComponent, ProjectversionDeleteDialogComponent, ProjectversionOverlayDialogComponent,
    ProjectversionLockDialogComponent, ProjectversionSnapshotDialogComponent,
    ProjectversionBuilduploadDialogComponent} from '../project/project-info';
import {AlertService} from '../../services/alert.service';

@Component({
    selector: 'app-projectversion-info',
    templateUrl: './projectversion-info.html',
    styleUrls: ['./projectversion-info.scss']
})
export class ProjectversionInfoComponent extends TableComponent {
    projectversion: ProjectVersion;
    projectName: string;
    projectVersion: string;
    dataSource: ProjectVersionDataSource;
    displayedColumns: string[] = [
        'dependency',
        'architectures',
        'basemirror',
        'is_locked',
        'ci_builds_enabled',
        'dependency_policy',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(public route: ActivatedRoute,
                protected router: Router,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.projectversion = {id: -1, name: this.projectVersion, is_locked: false,
                               project_name: this.projectName,
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: [],
                               projectversiontype: 'regular', retention_successful_builds: 1, retention_failed_builds: 7 };
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
            this.dataSource.load(`/api2/project/${this.projectName}/${this.projectVersion}/dependencies`, this.params);
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

    add() {
        const dialog = this.dialog.open(DependencyDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(r => this.loadData());
    }

    removeDependency(name: string, version: string) {
        const dialog = this.dialog.open(DependencyDeleteDialogComponent, {
            data: { projectversion: this.projectversion, dependency: `${name}/${version}` },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    getDependencyLink(element) {
        if (element.is_mirror) {
            return ['/mirror', element.project_name, element.name];
        } else {
            return ['/project', element.project_name, element.name];
        }
    }

    edit() {
        const dialog = this.dialog.open(ProjectversionDialogComponent,
          {data: { projectName: this.projectName, projectversion: this.projectversion},
        disableClose: true, width: '40%'});
        dialog.afterClosed().subscribe(result => this.loadData());
    }

    delete() {
        const dialog = this.dialog.open(ProjectversionDeleteDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });
    }

    copy() {
        const dialog = this.dialog.open(ProjectversionDialogComponent, {
            data: { projectName: this.projectName, projectversion: this.projectversion, copy: true },
            disableClose: true,
            width: '60%',
        });
    }

    snapshot() {
        const dialog = this.dialog.open(ProjectversionSnapshotDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });
    }

    overlay() {
        const dialog = this.dialog.open(ProjectversionOverlayDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });
    }

    lock() {
        const dialog = this.dialog.open(ProjectversionLockDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(result => this.loadData());
    }

    isExternalDependency(pv: any): boolean {
        if (this.projectversion.dependency_ids.includes(pv.id)) {
            return false;
        }
        return true;
    }

    extupload() {
        const dialog = this.dialog.open(ProjectversionBuilduploadDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '600px',
        });
    }
}


@Component({
    selector: 'app-dependency-dialog',
    templateUrl: 'projectversion-dependency-form.html',
})
export class DependencyDialogComponent {
    clicked: boolean;
    projectversion: ProjectVersion;
    dependencies: ProjectVersion[];
    form = this.fb.group({
        dependency: new FormControl('', [Validators.required]),
        use_cibuilds: new FormControl(false),
    });

    constructor(public dialog: MatDialogRef<DependencyDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) {
        this.clicked = false;
        this.projectversion = data.projectversion;
        this.searchDependencies();
    }

    searchDependencies() {
        const search = this.form.value.dependency;
        this.projectversionService.getDependencies(this.projectversion, search).subscribe(res => {
            this.dependencies = [];
            for (const entry of res) {
                this.dependencies.push(entry);
            }
        });
    }

    getDependencyName(entry) {
        return `${entry.project_name}/${entry.name}`;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.addDependency(
            this.projectversion,
            this.form.value.dependency,
            this.form.value.use_cibuilds).subscribe(
                r => this.dialog.close(),
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                }
            );
    }
}

@Component({
    selector: 'app-dependency-delete-dialog',
    templateUrl: 'projectversion-dependency-delete-form.html',
})
export class DependencyDeleteDialogComponent {
    clicked: boolean;
    projectversion: ProjectVersion;
    dependency: string;

    constructor(public dialog: MatDialogRef<DependencyDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, dependency: string }
    ) {
        this.clicked = false;
        this.projectversion = data.projectversion;
        this.dependency = data.dependency;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.removeDependency(this.projectversion, this.dependency).subscribe(
            r => this.dialog.close(),
            err => {
                this.alertService.error(err.error);
                this.clicked = false;
            }
        );
    }
}
