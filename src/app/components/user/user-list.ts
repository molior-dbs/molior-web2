import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatCheckbox} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {UserService, UserDataSource, User} from '../../services/user.service';
import {ValidationService} from '../../services/validation.service';
import {AlertService} from '../../services/alert.service';


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent extends TableComponent {
    dataSource: UserDataSource;
    displayedColumns: string[] = [
        'username',
        'email',
        'is_admin',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputEmail', { static: false }) inputEmail: ElementRef;
    @ViewChild('inputAdmin', { static: false }) inputAdmin: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected userService: UserService,
                protected dialog: MatDialog) {
        super(route, router, [['name', ''], ['email', ''], ['admin', false]]);
        this.dataSource = new UserDataSource(userService);
        this.contextmenuIndex = 0;  // no previous context menus
    }

    loadData() {
        this.dataSource.load('/api/users', this.params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('name');
        this.inputEmail.nativeElement.value = this.params.get('email');
        (this.inputAdmin as any)._checked = this.params.get('admin') === 'true';
    }

    setParams() {
        this.params.set('name', this.inputName.nativeElement.value);
        this.params.set('email', this.inputEmail.nativeElement.value);
        this.params.set('admin', (this.inputAdmin as any)._checked);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputEmail.nativeElement);
    }

    filterAdmin() {
        this.paginator.pageIndex = 0;
        this.params.set('page', 1);
        this.setParams();
        this.loadPage();
    }

    create(): void {
        const dialogRef = this.dialog.open(UserDialogComponent, {disableClose: true, width: '40%'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    edit(user): void {
        const dialogRef = this.dialog.open(UserDialogComponent, {data: user, disableClose: true, width: '40%'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(element): void {
        if (confirm(`Delete user ${element.username} ?`)) {
            this.userService.delete(element.id);
            this.loadData();
        }
    }
}

@Component({
    selector: 'app-user-form',
    templateUrl: 'user-form.html',
    styleUrls: ['user-form.scss'],
})
export class UserDialogComponent {
    form = this.fb.group({
        name: new FormControl('', [Validators.required,
                                   Validators.minLength(2),
                                   ValidationService.nameValidator
                                  ]),
        password: new FormControl('', [Validators.required,
                                       Validators.minLength(8)]),
        email: new FormControl('', [ValidationService.emailValidator]),
        isAdmin: new FormControl(false)
    });

    constructor(public dialog: MatDialogRef<UserDialogComponent>,
                protected userService: UserService,
                protected alertService: AlertService,
                private fb: FormBuilder,
                @Inject(MAT_DIALOG_DATA) public user: User) {
        if (user) {
            this.form.patchValue({name: this.user.username, email: this.user.email, isAdmin: this.user.is_admin});
            this.form.get('password').setValidators(null);
        }
    }

    save(): void {
        if (!this.user) {
            this.userService.create(this.form.value.name,
                                    this.form.value.email,
                                    this.form.value.isAdmin,
                                    this.form.value.password).subscribe(
                                        msg => this.dialog.close(),
                                        err => this.alertService.error(err.error)
                                    );
        } else {
            this.userService.edit(this.user.id,
                                  this.form.value.email,
                                  this.form.value.isAdmin,
                                  this.form.value.password).subscribe(
                                        msg => this.dialog.close(),
                                        err => this.alertService.error(err.error)
                                  );
        }
    }

    changePassword(): void {
        if (this.user) {
            if (this.form.value.password !== '') {
                this.form.get('password').setValidators([Validators.minLength(8)]);
            } else {
                this.form.get('password').setValidators(null);
            }
        }
    }
}

