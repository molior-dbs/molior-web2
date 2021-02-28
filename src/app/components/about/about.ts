import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {apiURL} from '../../lib/url';

interface Status {
    sshkey: string;
    gpgurl: string;
    version: string;
    maintenance_message: string;
    maintenance_mode: boolean;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class AboutComponent implements OnInit {
    status: Status;
    repoasc: string;

    constructor(protected http: HttpClient) {
        this.status = {sshkey: '', gpgurl: '', version: '', maintenance_message: '', maintenance_mode: false};
        this.repoasc = '';
    }

    ngOnInit() {
        this.http.get<Status>(`${apiURL()}/api/status`).subscribe(r => {
            this.status = r;
            this.http.get<string>(this.status.gpgurl, {responseType: 'text' as 'json'}).subscribe(r2 => this.repoasc = r2);
            },
            err => console.log('Error getting server status', err)
        );
    }
}
