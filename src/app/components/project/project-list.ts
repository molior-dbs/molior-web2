import {Component, ElementRef, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectDataSource, Project} from '../../services/project.service';

// Dialog
import {Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';


@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.html',
    styleUrls: ['./project-list.scss']
})
export class ProjectListComponent extends TableComponent {
    dataSource: ProjectDataSource;
    displayedColumns: string[] = [
        'name',
        'projectversionCount',
        'buildCount',
        'cibuildCount',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.dataSource = new ProjectDataSource(projectService);
    }

    loadData() {
        this.dataSource.load('/api/projects', this.params);
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

    create(): void {
        const dialog = this.dialog.open(ProjectCreateDialogComponent, {
            data: { project: null },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    edit(project): void {
        const dialog = this.dialog.open(ProjectCreateDialogComponent, {
            data: { project },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    delete(projectName: string): void {
        const dialog = this.dialog.open(ProjectDeleteDialogComponent, {
            data: { projectName },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }
}

@Component({
    selector: 'app-project-dialog',
    templateUrl: 'project.form.html',
})
export class ProjectCreateDialogComponent {
    clicked: boolean;
    project: Project;
    form = this.fb.group({
        name: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                   ValidationService.nameValidator
                                  ]),
        description: new FormControl('', [Validators.maxLength(255)]),
    });

    constructor(public dialog: MatDialogRef<ProjectCreateDialogComponent>,
                protected projectService: ProjectService,
                private fb: FormBuilder,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { project: Project }) {
                    this.clicked = false;
                    if (data.project) {
                        this.project = data.project;
                        this.form.patchValue({name: this.project.name, description: this.project.description});
                    }
                }

    save(): void {
        this.clicked = true;
        if (!this.project) {
            this.projectService.create(this.form.value.name, this.form.value.description).subscribe(
                r => {
                    this.dialog.close();
                    this.router.navigate(['/project', this.form.value.name]);
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        } else {
            this.projectService.edit(this.project.id, this.form.value.description).subscribe(
                r => {
                    this.dialog.close();
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        }
    }
}

@Component({
    selector: 'app-project-delete-dialog',
    templateUrl: 'project-delete-form.html',
})
export class ProjectDeleteDialogComponent {
    clicked: boolean;
    projectName: string;
    constructor(public dialog: MatDialogRef<ProjectDeleteDialogComponent>,
                protected projectService: ProjectService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { projectName: string }
    ) {
        this.projectName = data.projectName;
        this.clicked = false;
    }
    save(): void {
        this.clicked = true;
        this.projectService.delete(this.projectName).subscribe(
            r => this.dialog.close(),
            err => {
                this.alertService.error(err.error);
                this.clicked = false;
            });
    }
}
