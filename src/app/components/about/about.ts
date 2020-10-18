import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {apiURL} from '../../lib/url';

interface Status {
    sshkey: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class AboutComponent implements OnInit {
    status: Status;

    constructor(protected http: HttpClient) {
        this.status = {sshkey: ''};
    }

    ngOnInit() {
        this.http.get<Status>(`${apiURL()}/api/status`).subscribe(
            r => this.status = r,
            err => console.log('Error getting server status', err)
        );
    }
}
