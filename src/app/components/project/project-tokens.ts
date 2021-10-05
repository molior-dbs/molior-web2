import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {MoliorResult} from '../../lib/table.datasource';
import {ProjectService,
        Project} from '../../services/project.service';
import {TokenService, TokenDataSource, Token} from '../../services/user.service';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';

// FIXME: rename project-token-list
@Component({
    selector: 'app-project-tokens',
    templateUrl: './project-tokens.html',
    styleUrls: ['./project-tokens.scss']
})
export class ProjectTokensComponent extends TableComponent {
    dataSource: TokenDataSource;
    project: Project;
    displayedColumns: string[] = [
        'description',
        'actions'
    ];
    @ViewChild('inputDescription', { static: false }) inputDescription: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected tokenService: TokenService,
                protected dialog: MatDialog) {
        super(route, router, [['description', '']]);
        this.project = {id: -1, name: '', description: ''};
        this.dataSource = new TokenDataSource(tokenService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.projectService.get(name).subscribe((res: Project) => this.project = res);
            this.dataSource.load(`/api2/projectbase/${name}/tokens`, this.params);
        });
    }

    initElements() {
        this.inputDescription.nativeElement.value = this.params.get('description');
    }

    setParams() {
        this.params.set('description', this.inputDescription.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputDescription.nativeElement);
    }

    create(): void {
        const dialog = this.dialog.open(ProjectTokenDialogComponent, {
            data: {token: null, project: this.project},
            disableClose: true,
            width: '700px',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    delete(token) {
        const dialog = this.dialog.open(ProjectTokenDeleteDialogComponent, {
            data: {token, project: this.project},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }
}

@Component({
    selector: 'app-project-token-dialog',
    templateUrl: 'project-token-form.html',
})
export class ProjectTokenDialogComponent {
    clicked: boolean;
    project: Project;
    token: Token;
    descriptions = [];
    form = this.fb.group({
        tokentype: new FormControl('new'),
        description: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                  ]),
        token: new FormControl('')
    });

    constructor(public dialog: MatDialogRef<ProjectTokenDialogComponent>,
                protected projectService: ProjectService,
                protected tokenService: TokenService,
                private fb: FormBuilder,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {token: Token, project: Project}) {
        this.clicked = false;
        this.project = data.project;
        this.token = data.token;
        if (this.token) {
            this.form.patchValue({description: this.token.description});
        }
        this.searchTokens();
    }

    create(): void {
        if (!this.token) {
            this.projectService.createToken(this.project.name, this.form.value.description).subscribe(
                r => {
                    /* tslint:disable:no-string-literal */
                    this.form.patchValue({token: r['token']});
                    /* tslint:enable:no-string-literal */
                },
                err => {
                    this.alertService.error(err.error);
                });
        }
    }

    save(): void {
        this.clicked = true;
        if (this.form.value.tokentype === 'existing') {
            this.projectService.addToken(this.project.name, this.form.value.description).subscribe(
                r => {
                    this.dialog.close();
                },
                err => {
                    this.alertService.error(err.error);
                });
        } else {
            this.dialog.close();
        }
    }

    searchTokens() {
        this.tokenService.getTokens(this.form.value.description, this.project.id).subscribe(res => {
            this.descriptions = [];
            for (const entry of res) {
                this.descriptions.push({description: `${entry.description}`, id: entry.id});
            }
        });
    }
}

@Component({
    selector: 'app-project-token-delete-dialog',
    templateUrl: 'project-token-delete-form.html',
})
export class ProjectTokenDeleteDialogComponent {
    clicked: boolean;
    project: Project;
    token: Token;

    constructor(public dialog: MatDialogRef<ProjectTokenDeleteDialogComponent>,
                protected projectService: ProjectService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {token: Token, project: Project}) {
        this.clicked = false;
        this.project = data.project;
        this.token = data.token;
    }

    save(): void {
        this.clicked = true;
        this.projectService.deleteToken(this.project.name, this.token.id).subscribe(
           r => this.dialog.close(),
           err => {
               this.alertService.error(err.error);
               this.clicked = false;
           }
        );
    }
}
