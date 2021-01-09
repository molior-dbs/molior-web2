import {Component, ElementRef, ViewChild, Input, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {TableComponent} from '../../lib/table.component';
import {SourcerepoDialogComponent, SourcerepoDeleteDialogComponent} from './projectversion-repo-list';
import {AlertService} from '../../services/alert.service';
import {ValidationService} from '../../services/validation.service';
import {TriggerBuildDialogComponent, SourcerepoRecloneDialogComponent} from '../repo/repo-list';

@Component({
    selector: 'app-projectversion-repo-info',
    templateUrl: './projectversion-repo-info.html',
    styleUrls: ['./projectversion-repo-info.scss']
})
export class ProjectversionRepoComponent extends TableComponent {
    projectversion: ProjectVersion;
    repository: Repository;
    dataSource: RepositoryDataSource;
    displayedColumns: string[] = [
        'url',
        'method',
        'skipssl',
        'hooktype',
        'enabled',
        'actions'
    ];

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected repositoryService: RepositoryService,
                protected dialog: MatDialog) {
        super(route, router, []);
        this.projectversion = {id: -1, name: '', is_locked: false,
                               project_name: '',
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: []};
        this.repository = {id: -1, name: '', state: '', url: ''};
        this.dataSource = new RepositoryDataSource(this.repositoryService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const projectVersion = params.get('version');
            const repoId = +params.get('id');
            this.route.parent.parent.paramMap.subscribe((params2: ParamMap) => {
                const projectName = params2.get('name');
                this.projectversionService.get(projectName, projectVersion).subscribe((res: ProjectVersion) => {
                    this.projectversion = res;
                    this.repositoryService.get_projectversion_repo(projectName, projectVersion, repoId).subscribe((res2: Repository) => {
                            this.repository = res2;
                            this.dataSource.load(`/api2/project/${projectName}/${projectVersion}/repository/${repoId}/hooks`, this.params);
                        });
                    });
            });
        });
    }

    initElements() {
    }

    setParams() {
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
    }

    addHook(): void {
        const dialog = this.dialog.open(HookDialogComponent, {
            data: { projectversion: this.projectversion, repository: this.repository, hook: null },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }

    editHook(hook: any) {
        const dialog = this.dialog.open(HookDialogComponent, {
            data: { projectversion: this.projectversion, repository: this.repository, hook },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }

    removeHook(id: number) {
        const dialogRef = this.dialog.open(HookDeleteDialogComponent, {
            data: { projectversion: this.projectversion, repository: this.repository, id },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    reclone() {
        const dialogRef = this.dialog.open(SourcerepoRecloneDialogComponent, {
            data: { repo: this.repository },
            disableClose: true,
            width: '40%',
        });
    }

    build() {
        this.repositoryService.build(this.repository.id).subscribe();
    }

    edit() {
        const dialogRef = this.dialog.open(SourcerepoDialogComponent, {data: {
            projectversion: this.projectversion, repo: this.repository}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete() {
        const dialogRef = this.dialog.open(SourcerepoDeleteDialogComponent, {
            data: { projectversion: this.projectversion, repo: this.repository },
            disableClose: true,
            width: '40%',
        });
    }

    trigger(repoId: number, giturl: string) {
        const dialogRef = this.dialog.open(TriggerBuildDialogComponent, {data: {
            projectversion: this.projectversion, repoId, giturl}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-hook-dialog',
    templateUrl: 'hook-form.html',
})
export class HookDialogComponent {
    clicked: boolean;
    public hook: any;
    // private giturls = new BehaviorSubject<string[]>([]);
    // giturls$ = this.giturls.asObservable();
    form = this.fb.group({
        url: new FormControl('', [Validators.required,
            Validators.minLength(2),
            ValidationService.httpValidator
                                  ]),
        method: new FormControl('POST', [Validators.required,
                                  Validators.minLength(2),
                                  ]),
        hooktype: new FormControl('deb', [Validators.required,
                                  Validators.minLength(2),
                                  ]),
        skipssl: new FormControl(false),
        body: new FormControl(''),
        enabled: new FormControl(true),
    });

    constructor(public dialog: MatDialogRef<HookDialogComponent>,
                protected repositoryService: RepositoryService,
                private alertService: AlertService,
                private fb: FormBuilder,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repository: Repository, hook: any }
    ) {
        this.clicked = false;
        this.hook = data.hook;
        if (this.hook) {
            this.form.patchValue({url: this.hook.url});
            this.form.patchValue({method: this.hook.method.toUpperCase()});
            this.form.patchValue({hooktype: this.hook.hooktype});
            this.form.patchValue({skipssl: this.hook.skipssl});
            this.form.patchValue({body: this.hook.body});
            this.form.patchValue({enabled: this.hook.enabled});
        }
    }

    save(): void {
        this.clicked = true;
        if (!this.hook) {
            this.repositoryService.addHook(this.data.projectversion, this.data.repository.id,
                this.form.value.url.trim(),
                this.form.value.skipssl,
                this.form.value.method.trim(),
                this.form.value.hooktype.trim(),
                this.form.value.body.trim()
            ).subscribe(r => this.dialog.close(),
                        err => {
                            this.alertService.error(err.error);
                            this.clicked = false;
                        });
        } else {
            this.repositoryService.editHook(this.data.projectversion, this.data.repository.id, this.hook.id,
                this.form.value.url.trim(),
                this.form.value.skipssl,
                this.form.value.method.trim(),
                this.form.value.hooktype.trim(),
                this.form.value.body.trim(),
                this.form.value.enabled
            ).subscribe(r => this.dialog.close(),
                        err => {
                            this.alertService.error(err.error);
                            this.clicked = false;
                        });
        }
    }
}

@Component({
    selector: 'app-hook-dialog',
    templateUrl: 'hook-delete-form.html',
})
export class HookDeleteDialogComponent {
    clicked: boolean;
    constructor(public dialog: MatDialogRef<HookDeleteDialogComponent>,
                protected repositoryService: RepositoryService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repository: Repository, id: number }
    ) {
        this.clicked = false;
    }

    save(): void {
        this.clicked = true;
        this.repositoryService.removeHook(this.data.projectversion, this.data.repository.id, this.data.id).subscribe(
            r => this.dialog.close(),
            err => {
                this.alertService.error(err.error);
                this.clicked = false;
            }
        );
    }
}
