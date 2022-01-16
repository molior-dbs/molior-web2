import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {apiURL} from '../../lib/url';
import {MoliorService, MoliorStatus} from '../../services/websocket';
import {MoliorWebVersion} from '../../lib/version';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class AboutComponent implements OnInit {
    status: MoliorStatus;
    repoasc: string;
    versionMoliorWeb: string;

    constructor(protected http: HttpClient,
                protected moliorService: MoliorService
    ) {
        this.status = {sshkey: '', gpgurl: '', version_molior_server: '', version_aptly: '',
                       maintenance_message: '', maintenance_mode: false};
        this.repoasc = '';
        this.versionMoliorWeb = MoliorWebVersion();
    }

    ngOnInit() {
        this.moliorService.getMoliorStatus().subscribe(r => {
            this.status = r;
            this.http.get<string>(this.status.gpgurl, {responseType: 'text' as 'json'}).subscribe(r2 => this.repoasc = r2);
            },
            err => console.log('Error getting server status', err)
        );
    }
}
