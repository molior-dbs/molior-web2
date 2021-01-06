import {Component, ElementRef, ViewChild, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';

import {TableComponent} from '../../lib/table.component';
import {BuildService, BuildDataSource, buildicon, Build} from '../../services/build.service';
import {RepositoryService} from '../../services/repository.service';
import {ProjectVersion} from '../../services/project.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {BuildDeleteDialogComponent, BuildRebuildDialogComponent} from './build-list';

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
    @ViewChild('inputSearch', { static: false }) inputSearch: ElementRef;
    @ViewChild('inputMaintainer', { static: false }) inputMaintainer: ElementRef;
    @ViewChild('inputProject', { static: false }) inputProject: ElementRef;
    @ViewChild('inputCommit', { static: false }) inputCommit: ElementRef;
    /* tslint:disable-next-line:no-input-rename */
    @Input('projectversion') projectversion: ProjectVersion;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected buildService: BuildService,
                protected moliorService: MoliorService,
                protected repositoryService: RepositoryService,
                protected dialog: MatDialog) {
        super(route, router, [['search', ''],
                              ['maintainer', ''],
                              ['commit', ''],
                             ]);
        this.dataSource = new BuildDataSource(buildService);
        this.buildicon = buildicon;
        this.updateSubscription = null;
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

    OnDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = null;
        }
    }

    getRowBackground(buildtype) {
        switch (buildtype) {
            case 'build':
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

    startTime(build) {
        if (build.startstamp !== '') {
            const date = new Date(build.startstamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hrs = String(date.getHours()).padStart(2, '0');
            const mins = String(date.getMinutes()).padStart(2, '0');
            const secs = String(date.getSeconds()).padStart(2, '0');
            const dateToday = new Date();
            const yToday = dateToday.getFullYear();
            const mToday = String(dateToday.getMonth() + 1).padStart(2, '0');
            const dToday = String(dateToday.getDate()).padStart(2, '0');
            if (year === yToday && month === mToday && day === dToday) {
                return hrs + ':' + mins + ':' + secs;
            }
            return year + '-' + month + '-' + day + ' ' + hrs + ':' + mins + ':' + secs;
        }
        return null;
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
}
