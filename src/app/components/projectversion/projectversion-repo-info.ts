import {Component, ElementRef, ViewChild, Input, OnInit, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {TableComponent} from '../../lib/table.component';

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
        'actions'
    ];

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected repositoryService: RepositoryService,
                protected dialog: MatDialog) {
        super(route, router, []);
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false};
        this.repository = {id: +this.route.parent.snapshot.paramMap.get('id'), name: '', state: '', url: ''};
        this.dataSource = new RepositoryDataSource(this.repositoryService);
        this.contextmenuIndex = 0;  // no previous context menus
    }

    loadData() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const projectName = params.get('name');
            const projectVersion = params.get('version');
            const repoID = +params.get('id');
            this.projectversionService.get(projectName, projectVersion).subscribe((res: ProjectVersion) => {
                    this.projectversion = res;
                    this.repositoryService.get_projectversion_repo(projectName, projectVersion, repoID).subscribe((res2: Repository) => {
                        this.repository = res2;
                        this.dataSource.load(`/api2/project/${projectName}/${projectVersion}/repository/${repoID}/hooks`, this.params);
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
            this.repositoryService.addHook(this.data.projectversion, this.data.repository,
                                           this.form.value.url.trim()).subscribe();
        } else {
            // this.repositoryService.editHook(this.data.projectversion, this.data.repository,
                                            // this.form.value.url.trim()).subscribe();
        }
        this.dialog.close();
    }
}
