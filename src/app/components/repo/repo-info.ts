import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RepositoryService, Repository} from '../../services/repository.service';

@Component({
    selector: 'app-repo',
    templateUrl: './repo-info.html',
    styleUrls: ['./repo-info.scss']
})
export class RepositoryInfoComponent implements OnInit {
    repo: Repository;

    constructor(protected route: ActivatedRoute,
                protected repoService: RepositoryService) {
        this.repo = {id: 0,
            name: this.route.snapshot.paramMap.get('name'),
            url: '',
            state: ''
        };
    }

    ngOnInit() {
        this.repoService.get_projectversion_repo(this.repo.name, this.repo.url, this.repo.id).subscribe(
          (res: Repository) => this.repo = res);
    }
}
