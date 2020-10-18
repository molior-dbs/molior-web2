import {Component, OnInit, ViewChild } from '@angular/core';
import {MatPaginator, MatTableDataSource} from '@angular/material';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';

import {AuthService} from './services/auth.service';
import {UserService} from './services/user.service';
import {MoliorService} from './services/websocket';
import {HttpClient} from '@angular/common/http';
import {apiURL} from './lib/url';

interface Status {
    version: string;
    sshkey: string;
    maintenance_mode: boolean;
    maintenance_message: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
    title = 'molior-web';
    private connectionColor: BehaviorSubject<string>;
    public connectionColor$: Observable<string>;
    status: Status;
    date: Date;

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private router: Router,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        protected moliorService: MoliorService,
        protected http: HttpClient
    ) {
        this.matIconRegistry.addSvgIcon('debian', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/debian.svg'));
        this.matIconRegistry.addSvgIcon('git', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/git.svg'));
        this.connectionColor = new BehaviorSubject<string>('red');
        this.connectionColor$ = this.connectionColor.asObservable();
        this.connectionColor.next('red');
        this.moliorService.wsconnect.subscribe(evt => {
            if (evt.event === 'disconnected') {
                this.connectionColor.next('red');
                console.log('ws: disconnected');
            } else if (evt.event === 'unauthorized') {
                console.log('ws: unauthorized');
                this.connectionColor.next('red');
                this.logout();
            } else if (evt.event === 'connected') {
                this.connectionColor.next('lightgreen');
            }
        });
        if (this.authenticated()) {
            this.moliorService.connect();
        }
        this.status = { sshkey: '', version: '', maintenance_mode: false, maintenance_message: '' };
    }

    ngOnInit() {
        this.http.get<Status>(`${apiURL()}/api/status`).subscribe( r => {
            this.status = r;
        });
    }

    logout() {
        this.moliorService.disconnect();
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
    }

    authenticated() {
        return this.authService.currentUserValue != null;
    }

    getLoggedUserName(): string {
        if (this.authService.currentUserValue) {
            return this.authService.currentUserValue.username;
        }
        return '';
    }

    goToHomePage() {
        // redirect to home if already logged in
        if (this.authService.currentUserValue) {
            this.router.navigate(['/']);
        }
    }
}

