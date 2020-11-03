import {Component, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Repository, RepositoryService} from '../../services/repository.service';
import {apiURL} from '../../lib/url';
import {HttpClient} from '@angular/common/http';

import {ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';
import {RepoMergeDialogComponent, RepoDeleteDialogComponent} from './repo-list';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-repo',
    templateUrl: './repo-info.html',
    styleUrls: ['./repo-info.scss']
})
export class RepositoryInfoComponent extends TableComponent {
    repo: Repository;
    repoID: number;
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
        this.repo = {id: 0, name: '', url: '', state: ''};
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    loadData() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.repoID = Number(params.get('id'));
            this.http.get<Repository>(`${apiURL()}/api2/repository/${this.repoID}`).subscribe(
                res => {
                    this.repo = res;
                    this.dataSource.load(`/api2/repository/${this.repoID}/dependents`, this.params);
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
}
