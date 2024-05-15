import {Component, ElementRef, ViewChild, Input, OnInit, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {Observable, BehaviorSubject} from 'rxjs';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {AlertService} from '../../services/alert.service';
import {buildicon} from '../../services/build.service';
import {TriggerBuildDialogComponent, SourcerepoRecloneDialogComponent} from '../repo/repo-list';


@Component({
    selector: 'app-projectversion-repo-list',
    templateUrl: './projectversion-repo-list.html',
    styleUrls: ['./projectversion-repo-list.scss']
})
export class ProjectversionRepoListComponent extends TableComponent {
    buildicon;
    dataSource: RepositoryDataSource;
    projectversion: ProjectVersion;
    displayedColumns: string[] = [
        'name',
        'last_build',
        'architectures',
        'url',
        'state',
        'runLintian',
        'actions'
    ];
    @ViewChild('inputURL', { static: false }) inputURL: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected repositoryService: RepositoryService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_url', '']]);
        this.dataSource = new RepositoryDataSource(repositoryService);
        this.projectversion = {id: -1, name: '', is_locked: false,
                               project_name: '',
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: [],
                               projectversiontype: 'regular', retention_successful_builds: 1, retention_failed_builds: 7,
                               publish_s3: false, s3_endpoint: '', s3_path: '', sourcerepositories: []};
        this.buildicon = buildicon;
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const version = params.get('version');
            this.route.parent.parent.paramMap.subscribe((params2: ParamMap) => {
                const name = params2.get('name');
                this.projectversionService.get(name, version).subscribe((res: ProjectVersion) => this.projectversion = res);
                this.dataSource.load(`/api2/project/${name}/${version}/repositories`, this.params);
            });
        });
    }

    initElements() {
        this.inputURL.nativeElement.value = this.params.get('filter_url');
    }

    setParams() {
        this.params.set('filter_url', this.inputURL.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputURL.nativeElement);
    }

    create(): void {
        const dialog = this.dialog.open(SourcerepoDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }

    reclone(element) {
        const dialogRef = this.dialog.open(SourcerepoRecloneDialogComponent, {
            data: { repo: element },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.loadData()); // FIXME needed?
    }

    build(id: number) {
        this.repositoryService.build(id).subscribe();
    }

    edit(element) {
        const dialogRef = this.dialog.open(SourcerepoDialogComponent, {data: {
            projectversion: this.projectversion, repo: element}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    remove(element) {
        const dialogRef = this.dialog.open(SourcerepoRemoveDialogComponent, {
            data: { projectversion: this.projectversion, repo: element },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    trigger(repoId: number, giturl: string) {
        const dialogRef = this.dialog.open(TriggerBuildDialogComponent, {data: {
            projectversion: this.projectversion, repoId, giturl}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-repo-dialog',
    templateUrl: 'repo-form.html',
})
export class SourcerepoDialogComponent implements OnInit {
    clicked: boolean;
    public projectversion: ProjectVersion;
    public repo: any;
    private giturls = new BehaviorSubject<string[]>([]);
    giturls$ = this.giturls.asObservable();
    form = this.fb.group({
        url: new FormControl('', [Validators.required,
                                  Validators.minLength(2),
                                  ValidationService.gitValidator
                                  ]),
        architectures: new FormControl([], [ValidationService.minLengthArray(1)]),
        architecture0: new FormControl(false),
        architecture1: new FormControl(false),
        architecture2: new FormControl(false),
        architecture3: new FormControl(false),
        runLintian: new FormControl(false)
    });

    constructor(public dialog: MatDialogRef<SourcerepoDialogComponent>,
                protected repositoryService: RepositoryService,
                private fb: FormBuilder,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repo: any }
    ) {
        this.clicked = false;
        this.projectversion = data.projectversion;
        this.repo = data.repo;
    }

    ngOnInit() {
        ['amd64', 'i386', 'arm64', 'armhf'].forEach((arch, index) => {
            if (this.projectversion.architectures.indexOf(arch) === -1) {
                this.form.get(`architecture${index}`).disable();
            }
        });

        if (this.repo) {
            this.form.patchValue({url: this.repo.url});
            if (this.repo.run_lintian) {
                this.form.patchValue({runLintian: true});
                this.form.get('runLintian').updateValueAndValidity();
            }
            this.form.patchValue({architecture0: false, architecture1: false, architecture2: false, architecture3: false});
            this.repo.architectures.forEach(arch => {
                switch (arch) {
                    case 'amd64': {
                        this.form.patchValue({architecture0: true});
                        this.form.get('architecture0').updateValueAndValidity();
                        break;
                    }
                    case 'i386': {
                        this.form.patchValue({architecture1: true});
                        this.form.get('architecture1').updateValueAndValidity();
                        break;
                    }
                    case 'arm64': {
                        this.form.patchValue({architecture2: true});
                        this.form.get('architecture2').updateValueAndValidity();
                        break;
                    }
                    case 'armhf': {
                        this.form.patchValue({architecture3: true});
                        this.form.get('architecture3').updateValueAndValidity();
                        break;
                    }
                }

            });

        } else {
            this.form.patchValue({architecture0: true});
        }

        this.updateArchs();
        this.form.controls.url.valueChanges.subscribe(
            url => {
                this.repositoryService.find(url, this.projectversion.id).subscribe( res => {
                        const giturls = [];
                        for (const entry of res) {
                            giturls.push(entry.url);
                        }
                        this.giturls.next(giturls);
                    }
                );
            }
        );
    }


    updateArchs(): void {
        const architectures = [];
        ['amd64', 'i386', 'arm64', 'armhf'].forEach((item, index) => {
            if (this.form.get(`architecture${index}`).value === true) {
                architectures.push(item);
            }
        });
        this.form.patchValue({architectures});
        this.form.get('architectures').updateValueAndValidity();
    }

    save(): void {
        this.clicked = true;
        this.updateArchs();
        if (!this.repo) {
            this.repositoryService.add(this.data.projectversion, this.form.value.url.trim(), this.form.value.architectures, this.form.value.runLintian).subscribe(
                r => this.dialog.close(),
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        } else {
            this.repositoryService.edit(this.data.projectversion, this.repo.id,
                                        this.form.value.architectures, this.form.value.runLintian).subscribe(
                r => this.dialog.close(),
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        }
    }
}

@Component({
    selector: 'app-repo-dialog',
    templateUrl: 'projectversion-repo-remove-form.html',
})
export class SourcerepoRemoveDialogComponent {
    clicked: boolean;
    repo: Repository;
    projectversion: ProjectVersion;
    constructor(public dialog: MatDialogRef<SourcerepoRemoveDialogComponent>,
                protected repoService: RepositoryService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repo: Repository }
    ) {
        this.clicked = false;
        this.projectversion = data.projectversion;
        this.repo = data.repo;
    }

    save(): void {
        this.clicked = true;
        this.repoService.remove(this.projectversion, this.repo.id).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['project/' + this.projectversion.project_name + '/' + this.projectversion.name + '/repos']);
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}
