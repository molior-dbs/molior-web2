import {Component, ElementRef, ViewChild, Input, OnInit, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, BehaviorSubject} from 'rxjs';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {buildicon} from '../../services/build.service';


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
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false};
        this.projectversionService.get(this.projectversion.project_name,
            this.projectversion.name).subscribe((res: ProjectVersion) => this.projectversion = res);
        this.contextmenuIndex = 1;
        this.buildicon = buildicon;
    }

    loadData() {
        this.dataSource.load(`/api2/project/${this.projectversion.project_name}/${this.projectversion.name}/repositories`, this.params);
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

    reclone(id: number) {
        this.repositoryService.reclone(id).subscribe();
    }

    build(id: number) {
        this.repositoryService.build(id).subscribe();
    }

    edit(element) {
        const dialogRef = this.dialog.open(SourcerepoDialogComponent, {data: {
            projectversion: this.projectversion, repo: element}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(id: number) {
        if (confirm(`Delete repository from ${this.projectversion.project_name}/${this.projectversion.name} ?`)) {
            this.repositoryService.delete(id, this.projectversion.id).subscribe( r => {
                this.loadData();
            });
        }
    }

    cibuild(element) {
        const dialogRef = this.dialog.open(CIBuildDialogComponent, {data: {
            repo: element}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }
}

@Component({
    selector: 'app-repo-dialog',
    templateUrl: 'repo-form.html',
})
export class SourcerepoDialogComponent implements OnInit {
    public projectversion: ProjectVersion;
    public repo: any;
    private giturls = new BehaviorSubject<string[]>([]);
    giturls$ = this.giturls.asObservable();
    form = this.fb.group({
        url: new FormControl('', [Validators.required,
                                  Validators.minLength(2),
            // FIXME: ValidationService.URL
                                  ]),
        architectures: new FormControl([], [ValidationService.minLengthArray(1)]),
        architecture0: new FormControl(false),
        architecture1: new FormControl(false),
        architecture2: new FormControl(false),
        architecture3: new FormControl(false)
    });

    constructor(public dialog: MatDialogRef<SourcerepoDialogComponent>,
                protected repositoryService: RepositoryService,
                private fb: FormBuilder,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repo: any }
    ) {
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
        this.updateArchs();
        if (!this.repo) {
            this.repositoryService.add(this.data.projectversion, this.form.value.url.trim(), this.form.value.architectures).subscribe();
        } else {
            this.repositoryService.edit(this.data.projectversion, this.repo.id,
                                        this.form.value.url.trim(), this.form.value.architectures).subscribe();
        }
        this.dialog.close();
    }
}

@Component({
    selector: 'app-cibuild-dialog',
    templateUrl: 'projectversion-cibuild-form.html',
})
export class CIBuildDialogComponent {
    public repo: any;
    form = this.fb.group({
        gitref: new FormControl('', [Validators.required]),
    });

    constructor(public dialog: MatDialogRef<CIBuildDialogComponent>,
                private fb: FormBuilder,
                protected repositoryService: RepositoryService,
                protected router: Router,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion, repo: any }
    ) {
        this.repo = data.repo;
        console.log(this.repo);
    }

    save(): void {
        this.repositoryService.cibuild(this.repo.url, this.form.value.gitref.trim()).subscribe(r => {
            this.dialog.close();
        });
    }
}
