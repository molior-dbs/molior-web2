import {Component} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Repository} from '../../services/repository.service';
import {apiURL} from '../../lib/url';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'app-repo',
    templateUrl: './repo-builds.html',
    styleUrls: ['./repo-builds.scss']
})
export class RepositoryBuildsComponent {
    repository: Repository;

    constructor(protected http: HttpClient,
                protected router: Router,
                protected route: ActivatedRoute,
                ) {
        this.repository = null;
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const repoId = Number(params.get('id'));
            this.http.get<Repository>(`${apiURL()}/api2/repository/${repoId}`).subscribe(
                res => {
                    this.repository = res;
            });
        });
    }
}
