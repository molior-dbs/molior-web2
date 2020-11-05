import {Component, ElementRef, ViewChild, Input, OnInit, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {TableComponent} from '../../lib/table.component';
import {SourcerepoDialogComponent, CIBuildDialogComponent, SourcerepoDeleteDialogComponent} from './projectversion-repo-list';

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
            const repoID = +params.get('id');
            this.route.parent.parent.paramMap.subscribe((params2: ParamMap) => {
                const projectName = params2.get('name');
                this.projectversionService.get(projectName, projectVersion).subscribe((res: ProjectVersion) => {
                    this.projectversion = res;
                    this.repositoryService.get_projectversion_repo(projectName, projectVersion, repoID).subscribe((res2: Repository) => {
                            this.repository = res2;
                            this.dataSource.load(`/api2/project/${projectName}/${projectVersion}/repository/${repoID}/hooks`, this.params);
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
            data: { projectversion: this.projectversion, repository: this.repository },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }

    removeHook(id) {
        // FIXME: confirm dialog
        this.repositoryService.removeHook(this.projectversion, this.repository.id, id).subscribe(
            r => this.loadData());
    }

    reclone() {
        this.repositoryService.reclone(this.repository.id).subscribe();
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

    cibuild() {
        const dialogRef = this.dialog.open(CIBuildDialogComponent, {data: {
            projectversion: this.projectversion, repo: this.repository}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-hook-dialog',
    templateUrl: 'hook-form.html',
})
export class HookDialogComponent implements OnInit {
    public hook: any;
    // private giturls = new BehaviorSubject<string[]>([]);
    // giturls$ = this.giturls.asObservable();
    form = this.fb.group({
        url: new FormControl('', [Validators.required,
                                  Validators.minLength(2),
            // FIXME: ValidationService.URL
                                  ]),
        method: new FormControl('POST', [Validators.required,
                                  Validators.minLength(2),
                                  ]),
        hooktype: new FormControl('deb', [Validators.required,
                                  Validators.minLength(2),
                                  ]),
        skipssl: new FormControl(false),
        body: new FormControl('')
    });

    constructor(public dialog: MatDialogRef<HookDialogComponent>,
                protected repositoryService: RepositoryService,
                private fb: FormBuilder,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repository: Repository }
    ) {
    }

    ngOnInit() {
        if (this.hook) {
        }
    }

    save(): void {
        if (!this.hook) {
            this.repositoryService.addHook(this.data.projectversion, this.data.repository.id,
                this.form.value.url.trim(),
                this.form.value.skipssl,
                this.form.value.method.trim(),
                this.form.value.hooktype.trim(),
                this.form.value.body.trim(),
            ).subscribe();
        } else {
            // this.repositoryService.editHook(this.data.projectversion, this.data.repository,
                                            // this.form.value.url.trim()).subscribe();
        }
        this.dialog.close();
    }
}
