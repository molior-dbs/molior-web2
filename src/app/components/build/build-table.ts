import {Component, ElementRef, ViewChild, OnInit, OnDestroy, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {BuildService, BuildDataSource, buildicon} from '../../services/build.service';
import {RepositoryService} from '../../services/repository.service';
import {ProjectVersion} from '../../services/project.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
    selector: 'app-build-table',
    templateUrl: './build-table.html',
    styleUrls: ['./build-table.scss']
})
export class BuildTableComponent extends TableComponent implements OnInit, OnDestroy {
    buildicon;
    dataSource: BuildDataSource;
    displayedColumns: string[];
    updateSubscription;
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputMaintainer', { static: false }) inputMaintainer: ElementRef;
    @ViewChild('inputProject', { static: false }) inputProject: ElementRef;
    @ViewChild('inputCommit', { static: false }) inputCommit: ElementRef;
    @Input('projectversion') projectversion: ProjectVersion;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected buildService: BuildService,
                protected moliorService: MoliorService,
                protected repositoryService: RepositoryService) {
        super(route, router, [['filter_name', ''],
                              ['filter_maintainer', ''],
                              ['filter_project', ''],
                              ['filter_commit', ''],
                             ]);
        this.dataSource = new BuildDataSource(buildService);
        this.buildicon = buildicon;
        this.contextmenuIndex = 0;  // no previous context menus
        this.updateSubscription = null;
    }

    ngOnInit() {
        this.displayedColumns = [
            'buildstate',
            'sourcename',
            'maintainer',
            'commit',
            'duration',
            'actions'
        ];
        if (!this.projectversion) {
            this.displayedColumns.splice(2, 0, 'project');
        }
    }

    loadData() {
        const params = this.params;
        if (this.projectversion) {
            params.set('filter_project', this.projectversion.project_name + '/' + this.projectversion.name);
        }
        console.log('loadData', params);
        this.dataSource.load('/api/builds', params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
        this.inputMaintainer.nativeElement.value = this.params.get('filter_maintainer');
        if (!this.projectversion) {
            this.inputProject.nativeElement.value = this.params.get('filter_project');
        }
        this.inputCommit.nativeElement.value = this.params.get('filter_commit');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_maintainer', this.inputMaintainer.nativeElement.value);
        if (!this.projectversion) {
            this.params.set('filter_project', this.inputProject.nativeElement.value);
        }
        this.params.set('filter_commit', this.inputCommit.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputMaintainer.nativeElement);
        if (!this.projectversion) {
            this.initFilter(this.inputProject.nativeElement);
        }
        this.initFilter(this.inputCommit.nativeElement);
        this.updateSubscription = this.moliorService.builds.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt); });
    }

    ngDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
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
        if (build.endstamp !== '' && build.startstamp !== '') {
            const interval = (new Date(build.endstamp).getTime() - new Date(build.startstamp).getTime()) / 1000.0;
            const mins = Math.floor(interval / 60.0);
            let secs = `${Math.floor(interval % 60.0)}`;
            if (mins > 0) {
                secs = secs.padStart(2, '0');
                return `${mins}'${secs}''`;
            } else {
                return `${secs}''`;
            }
        }
        return null;
    }

    rebuild(id: number) {
        this.buildService.rebuild(id).subscribe();
    }

    buildlatest(id) {
        this.repositoryService.build(id).subscribe();
    }
}
