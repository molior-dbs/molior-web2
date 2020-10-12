import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {UserService, User} from '../../services/user.service';

@Component({
    selector: 'app-user-info',
    templateUrl: './user-info.html',
})
export class UserInfoComponent implements OnInit {
    user: User;

    constructor(protected route: ActivatedRoute,
                protected userService: UserService) {
        this.user = {id: 0,
            username: '',
            password: '',
            email: '',
            is_admin: false
        };
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const username = params.get('username');
            this.userService.get(username).subscribe((res: User) => this.user = res);
        });
    }
}
