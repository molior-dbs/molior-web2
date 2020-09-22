import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Repository} from '../../services/repository.service';
import {apiURL} from '../../lib/url';
import {HttpClient, HttpParams} from '@angular/common/http';


export interface Repositories {
    total_result_count: number;
    results: Repository[];
}

@Component({
    selector: 'app-repo',
    templateUrl: './repo-info.html',
    styleUrls: ['./repo-info.scss']
})
export class RepositoryInfoComponent implements OnInit {
    repos: Repositories;
    repoID: number;

    constructor(protected http: HttpClient,
                protected route: ActivatedRoute) {
    }

    loadData() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.repoID = Number(params.get('id'));
            console.log('id ' + this.repoID);
            });
        const p = new HttpParams().set('id', `${this.repoID}`);
        this.http.get<Repositories>(`${apiURL()}/api2/repositories/byid`, {params: p}).subscribe(
            res => {
                this.repos = res;
        });
    }

    ngOnInit() {
        this.loadData();
    }
}
