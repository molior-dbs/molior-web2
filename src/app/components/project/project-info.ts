import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectVersionService, ProjectVersionDataSource, ProjectVersion, Project} from '../../services/project.service';
import {MirrorService, Mirror, BaseMirrorValidator} from '../../services/mirror.service';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';
import {ProjectCreateDialogComponent, ProjectDeleteDialogComponent} from './project-list';

@Component({
    selector: 'app-projectversions',
    templateUrl: './project-info.html',
    styleUrls: ['./project-info.scss']
})
export class ProjectInfoComponent extends TableComponent {
    dataSource: ProjectVersionDataSource;
    project: Project;
    displayedColumns: string[] = [
        'name',
        'architectures',
        'basemirror',
        'is_locked',
        'ci_builds_enabled',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected projectversionService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.project = {id: -1, name: '', description: ''};
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.projectService.get(name).subscribe((res: Project) => this.project = res);
            this.dataSource.load(`/api2/projectbase/${name}/versions`, this.params);
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

    editProject(): void {
        const dialog = this.dialog.open(ProjectCreateDialogComponent, {
            data: { project: this.project },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    deleteProject(): void {
        const dialog = this.dialog.open(ProjectDeleteDialogComponent, {
            data: { projectName: this.project.name },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }


    create(): void {
        const dialog = this.dialog.open(ProjectversionDialogComponent, {
            data: { projectName: this.project.name },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    edit(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionDialogComponent,
          {data: { projectName: this.project.name, projectversion},
        disableClose: true, width: '40%'});
        dialog.afterClosed().subscribe(result => this.loadData());
    }

    delete(projectversion: ProjectVersion): void {
        const dialog = this.dialog.open(ProjectversionDeleteDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    clone(projectversion: ProjectVersion): void {
        const dialog = this.dialog.open(ProjectversionCloneDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    snapshot(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionSnapshotDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '40%',
        });
    }

    overlay(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionOverlayDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '40%',
        });
    }

    lock(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionLockDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-projectversion-dialog',
    templateUrl: '../projectversion/projectversion-form.html',
})
export class ProjectversionDialogComponent {
    projectName: string;
    projectversion: ProjectVersion;
    basemirrors: { [id: string]: string[]; };
    mirrorArchs: string[];
    defaultDependencyLevel: 'strict';
    form = this.fb.group({
        version: new FormControl('', [Validators.required,
                                      Validators.minLength(2),
                                      ValidationService.versionValidator]),
        description: new FormControl('', [Validators.maxLength(255)]),
        basemirror: new FormControl('', [Validators.required, BaseMirrorValidator.bind(this)]),
        architectures: new FormControl([]),
        architecture0: new FormControl(true),
        architecture1: new FormControl(true),
        architecture2: new FormControl(true),
        architecture3: new FormControl(true),
        dependencylevel: new FormControl('strict', [Validators.required]),
        cibuilds: new FormControl(false)
    });

    constructor(public dialog: MatDialogRef<ProjectversionDialogComponent>,
                private fb: FormBuilder,
                protected mirrorService: MirrorService,
                protected projectVersionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectName: string, projectversion: ProjectVersion}
    ) {
        this.projectName = data.projectName;
        this.projectversion = data.projectversion;
        if (this.projectversion) {
          this.form.patchValue({version: this.projectversion.name});
          this.form.patchValue({basemirror: this.projectversion.basemirror});
          this.form.patchValue({architectures: this.projectversion.architectures});
          this.form.patchValue({description: this.projectversion.description});
          this.form.patchValue({dependencylevel: this.projectversion.dependency_policy});
          this.form.patchValue({cibuilds: this.projectversion.ci_builds_enabled});
        }
        this.mirrorArchs = [];
        this.basemirrors = {};
        mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrors = {};
            for (const entry of res) {
                this.basemirrors[`${entry.name}/${entry.version}`] = entry.architectures;
            }
            if (this.editMode()) {
                this.mirrorArchs = this.basemirrors[this.form.value.basemirror];
                this.form.get('basemirror').updateValueAndValidity();
                this.updateArchs();
            }
        });
    }

    updateArchs(): void {
        this.form.patchValue({architectures: []});
        this.mirrorArchs.forEach((item, index) => {
            if (this.form.value[`architecture${index}`] === true) {
                this.form.value.architectures.push(item);
            }
        });
    }

    save(): void {
        this.updateArchs();
        if (this.editMode()) {
            this.projectVersionService.edit(this.data.projectName,
                                            this.projectversion.name,
                                            this.form.value.description,
                                            this.form.value.dependencylevel,
                                            this.form.value.cibuilds).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.projectName, this.form.value.version]);
                },
                err => this.alertService.error(err.error));
        } else {
            this.projectVersionService.create(this.data.projectName,
                                              this.form.value.version,
                                              this.form.value.description,
                                              this.form.value.dependencylevel,
                                              this.form.value.basemirror,
                                              this.form.value.architectures,
                                              this.form.value.cibuilds).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.projectName, this.form.value.version]);
                },
                err => this.alertService.error(err.error));
        }
    }

    changeBaseMirror() {
        if (this.form.value.basemirror && this.form.value.basemirror in this.basemirrors) {
            this.mirrorArchs = this.basemirrors[this.form.value.basemirror];
        } else {
            this.mirrorArchs = [];
        }
        this.mirrorService.getBaseMirrors(this.form.value.basemirror).subscribe(res => {
            this.basemirrors = {};
            for (const entry of res) {
                this.basemirrors[`${entry.name}/${entry.version}`] = entry.architectures;
            }
        });
    }

    editMode(): boolean {
        if (this.projectversion && this.projectversion.name) {
           return true;
        }
        return false;
    }
}

@Component({
    selector: 'app-projectversion-delete-dialog',
    templateUrl: '../projectversion/projectversion-delete-form.html',
})
export class ProjectversionDeleteDialogComponent {
    projectversion: ProjectVersion;
    form = this.fb.group({
        forceremoval: new FormControl(false)
    });
    constructor(public dialog: MatDialogRef<ProjectversionDeleteDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) { this.projectversion = data.projectversion; }

    save(): void {
        this.projectversionService.delete(this.projectversion, this.form.value.forceremoval).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name]);
        },
        err => this.alertService.error(err.error));
    }
}

@Component({
    selector: 'app-projectversion-clone-dialog',
    templateUrl: '../projectversion/projectversion-clone-form.html',
})
export class ProjectversionCloneDialogComponent {
    projectversion: ProjectVersion;
    form = this.fb.group({
        name: new FormControl('', [Validators.required]),  // FIXME: name validator
    });

    constructor(public dialog: MatDialogRef<ProjectversionCloneDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) { this.projectversion = data.projectversion; }

    save(): void {
        this.projectversionService.clone(this.projectversion, this.form.value.name).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name, this.form.value.name]);
        },
        err => this.alertService.error(err.error));
    }
}

@Component({
    selector: 'app-lock-dialog',
    templateUrl: '../projectversion/projectversion-lock-form.html',
})
export class ProjectversionLockDialogComponent {
    projectversion: ProjectVersion;
    constructor(public dialog: MatDialogRef<ProjectversionLockDialogComponent>,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) { this.projectversion = data.projectversion; }

    save(): void {
        this.projectversionService.lock(this.projectversion).subscribe(r => this.dialog.close(), err => this.alertService.error(err.error));
    }
}


@Component({
    selector: 'app-overlay-dialog',
    templateUrl: '../projectversion/projectversion-overlay-form.html',
})
export class ProjectversionOverlayDialogComponent {
    projectversion: ProjectVersion;
    form = this.fb.group({
        name: new FormControl('', [Validators.required]),  // FIXME: name validator
    });

    constructor(public dialog: MatDialogRef<ProjectversionOverlayDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) { this.projectversion = data.projectversion; }

    save(): void {
        this.projectversionService.overlay(this.projectversion, this.form.value.name).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name, this.form.value.name]);
        },
        err => this.alertService.error(err.error));
    }
}


@Component({
    selector: 'app-snapshot-dialog',
    templateUrl: '../projectversion/projectversion-snapshot-form.html',
})
export class ProjectversionSnapshotDialogComponent {
    projectversion: ProjectVersion;
    form = this.fb.group({
        name: new FormControl('', [Validators.required]),  // FIXME: name validator
    });

    constructor(public dialog: MatDialogRef<ProjectversionSnapshotDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) { this.projectversion = data.projectversion; }

    save(): void {
        this.projectversionService.snapshot(this.projectversion, this.form.value.name).subscribe(r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name, this.form.value.name]);
        },
        err => this.alertService.error(err.error));
    }
}
