import {Component, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Repository, RepositoryService} from '../../services/repository.service';
import {apiURL} from '../../lib/url';
import {HttpClient} from '@angular/common/http';

import {ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';
import {RepoMergeDialogComponent, RepoDeleteDialogComponent, RepositoryDialogComponent,
        TriggerBuildDialogComponent, SourcerepoRecloneDialogComponent} from './repo-list';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-repo',
    templateUrl: './repo-info.html',
    styleUrls: ['./repo-info.scss']
})
export class RepositoryInfoComponent extends TableComponent {
    repo: Repository;
    repoId: number;
    dataSource: ProjectVersionDataSource;
    displayedColumns: string[] = [
        'dependent',
        'architectures',
        'basemirror',
        'is_locked',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected http: HttpClient,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected repoService: RepositoryService,
                protected route: ActivatedRoute,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.repo = {id: -1, name: '', state: '', url: '', last_gitref: '', architectures: [], run_lintian: false,
            last_build: {
                id: -1,
                version: '',
                build_state: '',
                sourcename: ''
            },
            last_successful_build: {
                id: -1,
                version: '',
                build_state: '',
                sourcename: ''
            },
        };
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            this.repoId = Number(params.get('id'));
            this.http.get<Repository>(`${apiURL()}/api2/repository/${this.repoId}`).subscribe(
                res => {
                    this.repo = res;
                    this.dataSource.load(`/api2/repository/${this.repoId}/dependents`, this.params);
            });
        });
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
    }

    getDependentLink(element) {
        if (element.is_mirror) {
            return ['/mirror', element.project_name, element.name];
        } else {
            return ['/project', element.project_name, element.name];
        }
    }

    editRepo() {
        const dialog = this.dialog.open(RepositoryDialogComponent, {data: {repo: this.repo}, disableClose: true, width: '900px'});
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    deleteRepo() {
        const dialog = this.dialog.open(RepoDeleteDialogComponent, {
            data: { repo: this.repo },
            disableClose: true,
            width: '40%',
        });
    }

    mergeDuplicate() {
        const dialog = this.dialog.open(RepoMergeDialogComponent, {
            data: { repo: this.repo },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    build() {
        this.repoService.build(this.repo.id).subscribe();
    }

    trigger(repoId: number, giturl: string) {
        const dialogRef = this.dialog.open(TriggerBuildDialogComponent, {data: {
            repoId, giturl}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    reclone() {
        const dialog = this.dialog.open(SourcerepoRecloneDialogComponent, {
            data: {repo: this.repo}, disableClose: true, width: '40%'});
        dialog.afterClosed().subscribe(result => this.loadData()); // FIXME needed?
    }

    transformUrl(url: string): string {
        const sshPattern = /^git@ssh\.code\.roche\.com:(.+)\/(.+)\.git$/;
        const match = url.match(sshPattern);

        if (match) {
            const group = match[1];
            const repo = match[2];
            return `https://code.roche.com/${group}/${repo}`;
        }

        return url;
      }
}
