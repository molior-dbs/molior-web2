import {Component, ViewChild, AfterViewInit } from '@angular/core';
import {MatPaginator, MatTableDataSource} from '@angular/material';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {first} from 'rxjs/operators';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';

import {AuthService} from './services/auth.service';
import {UserService} from './services/user.service';
import {MoliorService, MoliorStatus} from './services/websocket';
import {HttpClient} from '@angular/common/http';
import {apiURL} from './lib/url';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit {
    title = 'molior-web';
    private connectionColor: BehaviorSubject<string>;
    public connectionColor$: Observable<string>;
    status: MoliorStatus;
    date: Date;

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private router: Router,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        protected moliorService: MoliorService,
        protected http: HttpClient,
        private dialogs: MatDialog
    ) {
        this.matIconRegistry.addSvgIcon('debian', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/debian.svg'));
        this.matIconRegistry.addSvgIcon('git', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/git.svg'));
        this.matIconRegistry.addSvgIcon('amd64', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/amd64.svg'));
        this.matIconRegistry.addSvgIcon('arm64', this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/arm64.svg'));
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
        this.status = {sshkey: '', gpgurl: '', version_molior_server: '', version_aptly: '',
                       maintenance_message: '', maintenance_mode: false};
    }

    ngAfterViewInit() {
        this.moliorService.getMoliorStatus().subscribe(r => {
            this.status = r;
            },
            err => console.log('Error getting server status', err)
        );
    }

    logout() {
        this.moliorService.disconnect();
        this.authService.logout();
        this.dialogs.closeAll();
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

    activeMenu(menu) {
        if (this.router.url.startsWith(`/${menu}`)) {
            return 'active-link';
        }
        return '';
    }
}

