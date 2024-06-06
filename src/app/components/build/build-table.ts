import {Component, ElementRef, ViewChild, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';

import {TableComponent} from '../../lib/table.component';
import {BuildService, BuildDataSource, buildicon, Build} from '../../services/build.service';
import {Repository, RepositoryService} from '../../services/repository.service';
import {ProjectVersion} from '../../services/project.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {BuildDeleteDialogComponent, BuildRebuildDialogComponent, BuildAbortDialogComponent} from './build-list';
import {TriggerBuildDialogComponent} from '../repo/repo-list';
import {apiURL} from '../../lib/url';

@Component({
    selector: 'app-build-table',
    templateUrl: './build-table.html',
    styleUrls: ['./build-table.scss']
})
export class BuildTableComponent extends TableComponent implements OnInit {
    buildicon;
    dataSource: BuildDataSource;
    displayedColumns: string[];
    updateSubscription;
    selectedBuildStates: Array<string> = [];
    buildStates: string[] = ['building', 'needs_build', 'needs_publish'];
    @ViewChild('inputBuildState', {static: false}) inputBuildState: ElementRef;
    @ViewChild('inputSearch', { static: false }) inputSearch: ElementRef;
    @ViewChild('inputMaintainer', { static: false }) inputMaintainer: ElementRef;
    @ViewChild('inputProject', { static: false }) inputProject: ElementRef;
    @ViewChild('inputCommit', { static: false }) inputCommit: ElementRef;
    /* tslint:disable-next-line:no-input-rename */
    @Input('projectversion') projectversion: ProjectVersion;
    /* tslint:disable-next-line:no-input-rename */
    @Input('repository') repository: Repository;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected buildService: BuildService,
                protected moliorService: MoliorService,
                protected repositoryService: RepositoryService,
                protected dialog: MatDialog,
                protected http: HttpClient) {
        super(route, router, [['buildstate', ''],
                              ['search', ''],
                              ['maintainer', ''],
                              ['commit', ''],
                             ]);
        this.dataSource = new BuildDataSource(buildService);
        this.buildicon = buildicon;
        this.updateSubscription = null;
        this.buildStates = this.mergeBuildStates(this.buildStates);
    }

    ngOnInit() {
        this.displayedColumns = [
            'buildstate',
            'sourcename',
            'maintainer',
            'commit',
            'starttime',
            'duration',
            'actions'
        ];
        if (!this.projectversion) {
            this.displayedColumns.splice(2, 0, 'project');
            /* tslint:disable:no-string-literal */
            this.params.DefaultParams['search_project'] = '';
            this.params.CurrentParams = {...this.params.DefaultParams};
            /* tslint:enable:no-string-literal */
        }
    }

    loadData() {
        const params = this.params;
        if (this.projectversion) {
            params.set('project', this.projectversion.project_name + '/' + this.projectversion.name);
        }
        if (this.repository) {
            params.set('sourcerepository_id', this.repository.id);
        }

        let selectedStates = [];

        this.selectedBuildStates.forEach(state => {
            switch (state) {
                case 'successful/already_exists/nothing_done':
                    selectedStates = selectedStates.concat(['successful', 'already_exists', 'nothing_done']);
                    break;
                case 'publishing/publish_failed':
                    selectedStates = selectedStates.concat(['publishing', 'publish_failed']);
                    break;
                case 'new/scheduled':
                    selectedStates = selectedStates.concat(['new', 'scheduled']);
                    break;
                case 'build_failed/already_failed':
                    selectedStates = selectedStates.concat(['build_failed', 'already_failed']);
                    break;
                default:
                    selectedStates.push(state);
                    break;
            }
        });

        selectedStates = [...new Set(selectedStates)];
        params.set('buildstate', selectedStates);

        this.dataSource.load('/api/builds', params);
    }

    initElements() {
        this.inputSearch.nativeElement.value = this.params.get('search');
        this.inputMaintainer.nativeElement.value = this.params.get('maintainer');
        if (!this.projectversion) {
            this.inputProject.nativeElement.value = this.params.get('search_project');
        }
        this.inputCommit.nativeElement.value = this.params.get('commit');
      }

    setParams() {
        this.params.set('buildstate', this.selectedBuildStates.join(','));
        this.params.set('search', this.inputSearch.nativeElement.value);
        this.params.set('maintainer', this.inputMaintainer.nativeElement.value);
        if (!this.projectversion) {
            this.params.set('search_project', this.inputProject.nativeElement.value);
        }
        this.params.set('commit', this.inputCommit.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputSearch.nativeElement);
        this.initFilter(this.inputMaintainer.nativeElement);
        if (!this.projectversion) {
            this.initFilter(this.inputProject.nativeElement);
        }
        this.initFilter(this.inputCommit.nativeElement);
        this.updateSubscription = this.moliorService.builds.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt); });
    }

    mergeBuildStates(states: string[]): string[] {
        const mergedStates = ['successful/already_exists/nothing_done', 'publishing/publish_failed', 'new/scheduled', 'build_failed/already_failed'];
        return states.filter(state => !mergedStates.includes(state)).concat(mergedStates);
      }

    OnDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = null;
        }
    }

    getRowBackground(buildtype) {
        switch (buildtype) {
            case 'build':
            case 'cleanup':
            case 'copy_projectversion':
            case 'delete_projectversion':
            case 'mirror':
                return '#F5F5F5';
            default:
                return 'unset';
        }
    }

    duration(build) {
        if (build.endstamp !== '' && build.startstamp !== '' && (
                build.buildstate === 'successful' ||
                build.buildstate === 'build_failed' ||
                build.buildstate === 'already_exists' ||
                build.buildstate === 'nothing_done' ||
                build.buildstate === 'publish_failed')) {
            const interval = (new Date(build.endstamp).getTime() - new Date(build.startstamp).getTime()) / 1000.0;
            const hrs = Math.floor(interval / 3600.0);
            const mins = Math.floor((interval - (hrs * 3600.0)) / 60.0);
            let secs = `${Math.floor(interval % 60.0)}`;
            let t = '';
            if (hrs > 0) {
                const h = `${hrs}h`;
                t += h + ' ';
            }

            if (mins > 0) {
                const m = `${mins}m`;
                t += m + ' ';
            }
            if (hrs > 0 || mins > 0) {
                secs = secs.padStart(2, '0');
            }
            const s = `${secs}s`;
            t += s;
            return t;
        }
        return null;
    }

    startTime(build, showFull = false) {
        if (build.startstamp !== '') {
            if (showFull) {
                return new Date(build.startstamp).toString();
            }
            const ts = new Date(build.startstamp);
            const year = ts.getFullYear();
            const month = String(ts.getMonth() + 1).padStart(2, '0');
            const day = String(ts.getDate()).padStart(2, '0');
            const hrs = String(ts.getHours()).padStart(2, '0');
            const mins = String(ts.getMinutes()).padStart(2, '0');
            const secs = String(ts.getSeconds()).padStart(2, '0');

            const current = new Date();
            if (ts.getFullYear() === current.getFullYear() &&
                ts.getMonth() === current.getMonth() &&
                ts.getDate() === current.getDate()) {
                return hrs + ':' + mins + ':' + secs;
            }
            if (ts.getFullYear() === current.getFullYear() &&
                ts.getMonth() === current.getMonth() &&
                ts.getDate() === current.getDate() - 1) {
                return 'yesterday, ' + hrs + ':' + mins;
            }
            if (ts.getFullYear() === current.getFullYear() &&
                ts.getMonth() === current.getMonth() &&
                ts.getDate() > current.getDate() - 15) {
                return (current.getDate() - ts.getDate()) + ' days ago, ' + hrs + ':' + mins;
            }
            if (ts.getFullYear() === current.getFullYear()) {
                return month + '-' + day + ' ' + hrs + ':' + mins;
            }
            return year + '-' + month + '-' + day + ' ' + hrs + ':' + mins;
        }
        return null;
    }

    abort(build: Build) {
        const dialogRef = this.dialog.open(BuildAbortDialogComponent, {
            data: { build },
            disableClose: true,
            width: '40%',
        });
    }

    rebuild(build: Build) {
        const dialogRef = this.dialog.open(BuildRebuildDialogComponent, {
            data: { build },
            disableClose: true,
            width: '40%',
        });
    }

    buildlatest(id) {
        this.repositoryService.build(id).subscribe();
    }

    delete(build: Build) {
        const dialogRef = this.dialog.open(BuildDeleteDialogComponent, {
            data: { build },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    trigger(repoId: number) {
        this.http.get<Repository>(`${apiURL()}/api2/repository/${repoId}`).subscribe(
              res => {
                const repo = res;
                const dialogRef = this.dialog.open(TriggerBuildDialogComponent, {data: {
                    projectversion: this.projectversion, repoId, giturl: repo.url}, disableClose: true, width: '900px'});
                dialogRef.afterClosed().subscribe(result => this.loadData());
            });
    }
}
