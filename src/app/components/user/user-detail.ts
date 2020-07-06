import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService, User} from '../../services/user.service';

@Component({
    selector: 'app-user-detail',
    templateUrl: './user-detail.html',
})
export class UserDetailComponent implements OnInit {
    user: User;

    constructor(protected route: ActivatedRoute,
                protected userService: UserService) {
        this.user = {id: 0,
            username: this.route.snapshot.paramMap.get('username'),
            password: '',
            email: '',
            is_admin: false
        };
    }

    ngOnInit() {
        this.userService.get(this.user.username).subscribe((res: User) => this.user = res);
    }
}
