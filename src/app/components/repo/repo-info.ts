import {Component} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Repository} from '../../services/repository.service';
import {apiURL} from '../../lib/url';
import {HttpClient} from '@angular/common/http';


@Component({
    selector: 'app-repo',
    templateUrl: './repo-info.html',
    styleUrls: ['./repo-info.scss']
})
export class RepositoryInfoComponent {
    repo: Repository;
    repoID: number;

    constructor(protected http: HttpClient,
                protected route: ActivatedRoute) {
        this.repo = {id: 0, name: '', url: '', state: ''};
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.repoID = Number(params.get('id'));
            this.http.get<Repository>(`${apiURL()}/api2/repository/${this.repoID}`).subscribe(
                res => this.repo = res
            );
        });
    }
}
