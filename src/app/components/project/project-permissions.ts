import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {MoliorResult} from '../../lib/table.datasource';
import {ProjectService, ProjectDataSource,
        Project, Permission} from '../../services/project.service';
import {UserService, User} from '../../services/user.service';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';


@Component({
    selector: 'app-project-permissions',
    templateUrl: './project-permissions.html',
    styleUrls: ['./project-permissions.scss']
})
export class ProjectPermissionsComponent extends TableComponent {
    dataSource: ProjectDataSource;
    project: Project;
    displayedColumns: string[] = [
        'username',
        'role',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputRole', { static: false }) inputRole: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', ''], ['filter_role', '']]);
        this.project = {id: -1, name: '', description: ''};
        this.dataSource = new ProjectDataSource(projectService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.projectService.get(name).subscribe((res: Project) => this.project = res);
            this.dataSource.load(`/api2/projectbase/${name}/permissions`, this.params);
        });
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
        this.inputRole.nativeElement.value = this.params.get('filter_role');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_role', this.inputRole.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputRole.nativeElement);
    }

    add(): void {
        const dialog = this.dialog.open(ProjectPermissionDialogComponent, {
            data: {permission: null, project: this.project},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    edit(permission) {
        const dialog = this.dialog.open(ProjectPermissionDialogComponent, {
            data: {permission, project: this.project},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    delete(permission) {
        const dialog = this.dialog.open(ProjectPermissionDeleteDialogComponent, {
            data: {permission, project: this.project},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }
}

@Component({
    selector: 'app-project-permission-dialog',
    templateUrl: 'project-permission-form.html',
})
export class ProjectPermissionDialogComponent {
    project: Project;
    permission: Permission;
    roles = [];
    usernames: MoliorResult<User>;
    form = this.fb.group({
        username: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
            // ValidationService.usernameValidator
                                  ]),
        role: new FormControl('', [Validators.maxLength(255)]),
    });

    constructor(public dialog: MatDialogRef<ProjectPermissionDialogComponent>,
                protected projectService: ProjectService,
                protected userService: UserService,
                private fb: FormBuilder,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {permission: Permission, project: Project}) {
        this.project = data.project;
        this.permission = data.permission;
        if (this.permission) {
            this.form.patchValue({username: this.permission.username, role: this.permission.role});
        } else {
            this.userService.getProjectRoleCandidates(this.project.name).subscribe(
                /* tslint:disable:no-string-literal */
                res => this.usernames = new MoliorResult<User>(res['total_result_count'], res['results'])
                /* tslint:enable:no-string-literal */
            );
        }
    }

    save(): void {
        this.userService.get(this.form.value.username).subscribe(
            r => {
                if (!this.permission) {
                    this.projectService.addPermission(this.project.name, r.username, this.form.value.role).subscribe(
                        r2 => this.dialog.close(),
                        err2 => this.alertService.error(err2.error));
                } else {
                    this.projectService.editPermission(this.project.name, r.username, this.form.value.role).subscribe(
                        r2 => this.dialog.close(),
                        err2 => this.alertService.error(err2.error));
                }
            },
            err => this.alertService.error(err.error)
        );
    }
}

@Component({
    selector: 'app-project-permission-delete-dialog',
    templateUrl: 'project-permission-delete-form.html',
})
export class ProjectPermissionDeleteDialogComponent {
    project: Project;
    permission: Permission;

    constructor(public dialog: MatDialogRef<ProjectPermissionDeleteDialogComponent>,
                protected projectService: ProjectService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {permission: Permission, project: Project}) {
        this.project = data.project;
        this.permission = data.permission;
    }

    save(): void {
        this.projectService.deletePermission(this.project.name, this.permission.username).subscribe(
           r => this.dialog.close(),
           err => this.alertService.error(err.error)
        );
    }
}
