import {Component} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {UserService, User} from '../../services/user.service';
import {UserDialogComponent, UserDeleteDialogComponent} from './user-list';
import {AlertService} from '../../services/alert.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-user-info',
    templateUrl: './user-info.html',
})
export class UserInfoComponent {
    user: User;

    constructor(protected route: ActivatedRoute,
                protected dialog: MatDialog,
                protected userService: UserService) {
        this.user = {id: 0,
            username: '',
            password: '',
            email: '',
            is_admin: false
        };
        this.route.paramMap.subscribe((params: ParamMap) => {
            const username = params.get('username');
            this.userService.get(username).subscribe((res: User) => this.user = res);
        });
    }

    edit(): void {
        const dialogRef = this.dialog.open(UserDialogComponent, {data: {user: this.user}, disableClose: true, width: '40%'});
        dialogRef.afterClosed().subscribe();
    }

    delete(): void {
        const dialogRef = this.dialog.open(UserDeleteDialogComponent, {data: {user: this.user}, disableClose: true, width: '40%'});
        dialogRef.afterClosed().subscribe();
    }
}
