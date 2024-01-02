import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators, FormArray} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectVersionService, ProjectVersionDataSource, ProjectVersion, Project,
        BaseProjectValidator} from '../../services/project.service';
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
        dialog.afterClosed().subscribe(r => {
            this.loadData();
            this.router.navigate(['/projects']);
        });
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

    copy(projectversion: ProjectVersion): void {
        const dialog = this.dialog.open(ProjectversionDialogComponent, {
            data: { projectName: this.project.name, projectversion, copy: true },
            disableClose: true,
            width: '60%',
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

    extupload(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionBuilduploadDialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '600px',
        });
    }

    publishS3(projectversion: ProjectVersion) {
        const dialog = this.dialog.open(ProjectversionS3DialogComponent, {
            data: { projectversion },
            disableClose: true,
            width: '600px',
        });
        dialog.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-projectversion-dialog',
    templateUrl: '../projectversion/projectversion-form.html',
})
export class ProjectversionDialogComponent {
    clicked: boolean;
    projectName: string;
    projectversion: ProjectVersion;
    basemirrors: any[];
    baseprojects: any[];
    baseArchs: string[];
    defaultDependencyLevel: 'strict';
    mode: string;
    retentionSuccessfulBuilds: number;
    retentionFailedBuilds: number;
    form = this.fb.group({
        formArray : this.fb.array([
            this.fb.group({
                version: new FormControl('', [Validators.required,
                                        Validators.minLength(2),
                                        ValidationService.versionValidator]),
                description: new FormControl('', [Validators.maxLength(255)]),
                basetype: new FormControl('mirror'),
                basemirror: new FormControl('', [Validators.required, BaseMirrorValidator.bind(this)]),
                baseproject: new FormControl(''),
                architectures: new FormControl([]),
                architecture0: new FormControl(true),
                architecture1: new FormControl(true),
                architecture2: new FormControl(true),
                architecture3: new FormControl(true),
                dependencylevel: new FormControl('strict', [Validators.required]),
                cibuilds: new FormControl(false),
                buildlatest: new FormControl(false)
            }),
            this.fb.group({
                retentionSuccessfulBuilds: new FormControl(1, [Validators.min(1), Validators.max(5)]),
                retentionFailedBuilds: new FormControl(7, [Validators.min(7)])
            })
        ])
    });

    constructor(public dialog: MatDialogRef<ProjectversionDialogComponent>,
                private fb: FormBuilder,
                protected mirrorService: MirrorService,
                protected projectVersionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectName: string, projectversion: ProjectVersion, copy: boolean }
    ) {
        this.clicked = false;
        this.projectName = data.projectName;
        this.projectversion = data.projectversion;
        this.mode = 'create';
        this.baseArchs = [];
        if (this.projectversion) {
            if (data.copy) {
                this.mode = 'copy';
            } else {
                this.mode = 'edit';
            }
            this.formArray.get([0]).patchValue({version: this.mode === 'copy' ? this.projectversion.name + '-copy' : this.projectversion.name,
                                  basemirror: this.projectversion.basemirror,
                                  description: this.projectversion.description,
                                  dependencylevel: this.projectversion.dependency_policy,
                                  cibuilds: this.projectversion.ci_builds_enabled,
                                  architectures: this.projectversion.architectures,
                                 });


            this.formArray.get([1]).patchValue({
                retentionSuccessfulBuilds: this.projectversion.retention_successful_builds,
                retentionFailedBuilds: this.projectversion.retention_failed_builds,
            })
        }
        this.basemirrors = [];
        this.baseprojects = [];
        mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
            if (this.mode === 'edit' || this.mode === 'copy') {
                this.formArray.get([0]).patchValue({architecture0: false});
                this.formArray.get([0]).patchValue({architecture1: false});
                this.formArray.get([0]).patchValue({architecture2: false});
                this.formArray.get([0]).patchValue({architecture3: false});
                this.baseArchs.forEach((item, index) => {
                    if (this.formArray.get([0]).value.architectures.includes(item)) {
                        switch (index) {
                            case 0:
                                this.formArray.get([0]).patchValue({architecture0: true});
                                break;
                            case 1:
                                this.formArray.get([0]).patchValue({architecture1: true});
                                break;
                            case 2:
                                this.formArray.get([0]).patchValue({architecture2: true});
                                break;
                            case 3:
                                this.formArray.get([0]).patchValue({architecture3: true});
                                break;
                        }
                    }
                });
                this.formArray.get([0]).get('basemirror').updateValueAndValidity();
                this.changeBaseMirror();

                this.formArray.get([1]).patchValue({retentionSuccessfulBuilds: this.projectversion.retention_successful_builds})
                this.formArray.get([1]).patchValue({retentionFailedBuilds: this.projectversion.retention_failed_builds})
            }
        });
        projectVersionService.getBaseProjects().subscribe(res => {
            this.baseprojects = [];
            for (const entry of res) {
                this.baseprojects.push({name: `${entry.project_name}/${entry.name}`, architectures: entry.architectures,
                                        basemirror: entry.basemirror});
            }
        });
    }

    updateArchs(): void {
        this.formArray.get([0]).patchValue({architectures: []});
        this.baseArchs.forEach((item, index) => {
            if (this.formArray.get([0]).value[`architecture${index}`] === true) {
                this.formArray.get([0]).value.architectures.push(item);
            }
        });
    }

    save(): void {
        this.clicked = true;
        this.updateArchs();
        if (this.mode === 'edit') {
            this.projectVersionService.edit(this.data.projectName,
                                            this.projectversion.name,
                                            this.formArray.get([0]).value.description,
                                            this.formArray.get([0]).value.dependencylevel,
                                            this.formArray.get([0]).value.cibuilds,
                                            this.formArray.get([1]).value.retentionSuccessfulBuilds,
                                            this.formArray.get([1]).value.retentionFailedBuilds).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.projectName, this.formArray.get([0]).value.version]);
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        } else if (this.mode === 'copy') {
            this.projectVersionService.copy(this.projectversion,
                                            this.formArray.get([0]).value.version,
                                            this.formArray.get([0]).value.description,
                                            this.formArray.get([0]).value.dependencylevel,
                                            this.formArray.get([0]).value.basemirror,
                                            this.formArray.get([0]).value.baseproject,
                                            this.formArray.get([0]).value.architectures,
                                            this.formArray.get([0]).value.cibuilds,
                                            this.formArray.get([0]).value.buildlatest,
                                            this.formArray.get([1]).value.retentionSuccessfulBuilds,
                                            this.formArray.get([1]).value.retentionFailedBuilds).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.projectName, this.formArray.get([0]).value.version]);
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        } else {
            this.projectVersionService.create(this.data.projectName,
                                              this.formArray.get([0]).value.version,
                                              this.formArray.get([0]).value.description,
                                              this.formArray.get([0]).value.dependencylevel,
                                              this.formArray.get([0]).value.basemirror,
                                              this.formArray.get([0]).value.baseproject,
                                              this.formArray.get([0]).value.architectures,
                                              this.formArray.get([0]).value.cibuilds,
                                              this.formArray.get([1]).value.retentionSuccessfulBuilds,
                                              this.formArray.get([1]).value.retentionFailedBuilds).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.projectName, this.formArray.get([0]).value.version]);
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        }
    }

    chooseBaseMirror() {
        const form = this.formArray.get([0]);
        form.patchValue({baseproject: ''});
        form.get('baseproject').setValidators([]);
        form.get('baseproject').markAsTouched();
        form.get('baseproject').updateValueAndValidity();
        form.get('basemirror').setValidators([Validators.required, BaseMirrorValidator.bind(this)]);
        form.get('basemirror').markAsTouched();
        form.get('basemirror').updateValueAndValidity();
    }

    chooseBaseProject() {
        const form = this.formArray.get([0]);
        form.patchValue({basemirror: ''});
        form.get('basemirror').setValidators([]);
        form.get('basemirror').markAsTouched();
        form.get('basemirror').updateValueAndValidity();
        form.get('baseproject').setValidators([Validators.required, BaseProjectValidator.bind(this)]);
        form.get('baseproject').markAsTouched();
        form.get('baseproject').updateValueAndValidity();
    }

    searchBaseMirror() {
        this.mirrorService.getBaseMirrors(this.formArray.get([0]).value.basemirror).subscribe(res => {
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
        });
    }

    searchBaseProject() {
        this.projectVersionService.getBaseProjects(this.formArray.get([0]).value.baseproject).subscribe(res => {
            this.baseprojects = [];
            for (const entry of res) {
                this.baseprojects.push({name: `${entry.project_name}/${entry.name}`, architectures: entry.architectures,
                                        basemirror: entry.basemirror});
            }
        });
    }

    changeBaseMirror() {
        this.baseArchs = [];
        const splitted = this.formArray.get([0]).value.basemirror.split('/', 2);
        if (splitted.length === 2) {
            this.mirrorService.get(splitted[0], splitted[1]).subscribe(res => {
                this.baseArchs = res.architectures;
                // FIXME: if arch in orog archs:
                // this.form.patchValue({architecture0: true});
            });
        }
        this.formArray.get([0]).patchValue({architecture0: true});
        this.formArray.get([0]).patchValue({architecture1: true});
        this.formArray.get([0]).patchValue({architecture2: true});
        this.formArray.get([0]).patchValue({architecture3: true});
        this.updateArchs();
    }

    changeBaseProject() {
        this.baseArchs = [];
        const splitted = this.formArray.get([0]).value.baseproject.split('/', 2);
        if (splitted.length === 2) {
            this.projectVersionService.get(splitted[0], splitted[1]).subscribe(res => {
                this.baseArchs = res.architectures;
                // FIXME: if arch in orog archs:
                // this.form.patchValue({architecture0: true});
            });
        }
        this.formArray.get([0]).patchValue({architecture0: true});
        this.formArray.get([0]).patchValue({architecture1: true});
        this.formArray.get([0]).patchValue({architecture2: true});
        this.formArray.get([0]).patchValue({architecture3: true});
        this.updateArchs();
    }

    get formArray() {
        // Typecast, because: reasons
        // https://github.com/angular/angular-cli/issues/6099
        return this.form.get('formArray') as FormArray;
    }
}

@Component({
    selector: 'app-projectversion-delete-dialog',
    templateUrl: '../projectversion/projectversion-delete-form.html',
})
export class ProjectversionDeleteDialogComponent {
    clicked: boolean;
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
    ) {
        this.clicked = false;
        this.projectversion = data.projectversion;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.delete(this.projectversion, this.form.value.forceremoval).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name]);
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}

@Component({
    selector: 'app-lock-dialog',
    templateUrl: '../projectversion/projectversion-lock-form.html',
})
export class ProjectversionLockDialogComponent {
    clicked: boolean;
    projectversion: ProjectVersion;
    constructor(public dialog: MatDialogRef<ProjectversionLockDialogComponent>,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) {
        this.projectversion = data.projectversion;
        this.clicked = false;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.lock(this.projectversion).subscribe(r => this.dialog.close(),
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}


@Component({
    selector: 'app-overlay-dialog',
    templateUrl: '../projectversion/projectversion-overlay-form.html',
})
export class ProjectversionOverlayDialogComponent {
    clicked: boolean;
    projectversion: ProjectVersion;
    form = this.fb.group({
        name: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                   ValidationService.versionValidator]),
    });

    constructor(public dialog: MatDialogRef<ProjectversionOverlayDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) {
        this.projectversion = data.projectversion;
        this.clicked = false;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.overlay(this.projectversion, this.form.value.name).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name, this.form.value.name]);
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}


@Component({
    selector: 'app-snapshot-dialog',
    templateUrl: '../projectversion/projectversion-snapshot-form.html',
})
export class ProjectversionSnapshotDialogComponent {
    clicked: boolean;
    projectversion: ProjectVersion;
    form = this.fb.group({
        name: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                   ValidationService.versionValidator]),
    });

    constructor(public dialog: MatDialogRef<ProjectversionSnapshotDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) {
        this.projectversion = data.projectversion;
        this.clicked = false;
    }

    save(): void {
        this.clicked = true;
        this.projectversionService.snapshot(this.projectversion, this.form.value.name).subscribe(r => {
            this.dialog.close();
            this.router.navigate(['/project', this.projectversion.project_name, this.form.value.name]);
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}

@Component({
    selector: 'app-buildupload-dialog',
    templateUrl: '../projectversion/projectversion-buildupload-form.html',
})
export class ProjectversionBuilduploadDialogComponent {
    clicked: boolean;
    error: boolean;
    projectversion: ProjectVersion;
    dependency: string;
    form = this.fb.group({
        files: new FormControl(FileList)
    });

    constructor(public dialog: MatDialogRef<ProjectversionBuilduploadDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, dependency: string }
    ) {
        this.clicked = false;
        this.error = false;
        this.projectversion = data.projectversion;
        this.dependency = data.dependency;
    }

    save(): void {
        this.clicked = true;
        const element = document.getElementById('fileupload') as HTMLInputElement;

        const formData = new FormData();
        if (element.files) {
            Array.from(element.files).forEach(file =>
                formData.append(file.name, file)
            );
        }

        this.projectversionService.buildUpload(this.projectversion, formData).subscribe(
            r => this.dialog.close(),
            err => {
                this.alertService.error(err.error);
                this.error = true;
                this.clicked = false;
            }
        );
    }
}

@Component({
    selector: 'app-s3-dialog',
    templateUrl: '../projectversion/projectversion-s3-form.html',
})
export class ProjectversionS3DialogComponent {
    clicked: boolean;
    error: boolean;
    projectversion: ProjectVersion;
    s3_endpoints: [];
    form = this.fb.group({
        s3_endpoint: new FormControl(""),
        s3_path: new FormControl(""),
        publish_s3: new FormControl(false)
    });

    constructor(public dialog: MatDialogRef<ProjectversionS3DialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion}
    ) {
        this.clicked = false;
        this.error = false;
        this.projectversion = data.projectversion;
        this.s3_endpoints = [];
        projectversionService.getS3Endpoints().subscribe(res => this.s3_endpoints = res);
        this.form.patchValue({
            publish_s3: this.projectversion.publish_s3,
            s3_endpoint: this.projectversion.s3_endpoint,
            s3_path: this.projectversion.s3_path,
        })
    }

    save(): void {
        this.clicked = true;

        this.projectversionService.publishS3(this.projectversion, this.form.value).subscribe(
            r => this.dialog.close(),
            err => {
                this.alertService.error(err.error);
                this.error = true;
                this.clicked = false;
            }
        );
    }
}
