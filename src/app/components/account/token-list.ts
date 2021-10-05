import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {MoliorResult} from '../../lib/table.datasource';
import {UserService, User, TokenDataSource, TokenService, Token} from '../../services/user.service';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';


@Component({
    selector: 'app-token-list',
    templateUrl: './token-list.html',
    styleUrls: ['./token-list.scss']
})
export class TokenListComponent extends TableComponent {
    dataSource: TokenDataSource;
    displayedColumns: string[] = [
        'description',
        'actions'
    ];
    @ViewChild('inputDescription', { static: false }) inputDescription: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected tokenService: TokenService,
                protected dialog: MatDialog) {
        super(route, router, [['description', '']]);
        this.dataSource = new TokenDataSource(tokenService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.dataSource.load(`/api2/tokens`, this.params);
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
        const dialog = this.dialog.open(TokenDialogComponent, {
            data: {token: null},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    delete(token) {
        const dialog = this.dialog.open(TokenDeleteDialogComponent, {
            data: {token},
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }
}

@Component({
    selector: 'app-token-dialog',
    templateUrl: 'token-form.html',
})
export class TokenDialogComponent {
    clicked: boolean;
    token: Token;
    roles = [];
    form = this.fb.group({
        description: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                  ]),
        token: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                  ])
    });

    constructor(public dialog: MatDialogRef<TokenDialogComponent>,
                protected tokenService: TokenService,
                private fb: FormBuilder,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {token: Token}) {
        this.clicked = false;
        this.token = data.token;
        if (this.token) {
            this.form.patchValue({description: this.token.description});
        }
    }

    create(): void {
        console.log(this.form.get('description'));
        this.clicked = true;
        if (!this.token) {
            this.tokenService.createToken(this.form.value.description).subscribe(
                r => {
                    /* tslint:disable:no-string-literal */
                    this.form.patchValue({token: r['token']});
                },
                err => {
                    this.alertService.error(err.error);
                    this.clicked = false;
                });
        }
    }

    save(): void {
        this.dialog.close();
    }
}

@Component({
    selector: 'app-token-delete-dialog',
    templateUrl: 'token-delete-form.html',
})
export class TokenDeleteDialogComponent {
    clicked: boolean;
    token: Token;

    constructor(public dialog: MatDialogRef<TokenDeleteDialogComponent>,
                protected tokenService: TokenService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: {token: Token}) {
        this.clicked = false;
        this.token = data.token;
    }

    save(): void {
        this.clicked = true;
        this.tokenService.deleteToken(this.token.id).subscribe(
           r => this.dialog.close(),
           err => {
               this.alertService.error(err.error);
               this.clicked = false;
           }
        );
    }
}
