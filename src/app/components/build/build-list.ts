import {Component, ElementRef, ViewChild, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {BuildService, BuildDataSource, buildicon} from '../../services/build.service';
import {RepositoryService} from '../../services/repository.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
  selector: 'app-build-list',
  templateUrl: './build-list.html',
  styleUrls: ['./build-list.scss']
})
export class BuildListComponent extends TableComponent implements OnDestroy {
    buildicon;
    dataSource: BuildDataSource;
    displayedColumns: string[] = [
        'buildstate',
        'sourcename',
        'buildvariant',
        'project',
        'maintainer',
        // 'git_ref',
        // 'branch',
        'commit',
        'duration',
        'actions'
    ];
    updateSubscription;
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputMaintainer', { static: false }) inputMaintainer: ElementRef;
    @ViewChild('inputProject', { static: false }) inputProject: ElementRef;
    @ViewChild('inputBuildvariant', { static: false }) inputBuildvariant: ElementRef;
    @ViewChild('inputCommit', { static: false }) inputCommit: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected buildService: BuildService,
                protected moliorService: MoliorService,
                protected repositoryService: RepositoryService) {
        super(route, router, [['filter_name', ''],
                              ['filter_maintainer', ''],
                              ['filter_project', ''],
                              ['filter_buildvariant', ''],
                              ['filter_commit', ''],
                             ]);
        this.dataSource = new BuildDataSource(buildService);
        this.buildicon = buildicon;
        this.contextmenuIndex = 0;  // no previous context menus
        this.updateSubscription = null;
    }

    loadData() {
        this.dataSource.load('/api/builds', this.params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
        this.inputMaintainer.nativeElement.value = this.params.get('filter_maintainer');
        this.inputProject.nativeElement.value = this.params.get('filter_project');
        this.inputBuildvariant.nativeElement.value = this.params.get('filter_buildvariant');
        this.inputCommit.nativeElement.value = this.params.get('filter_commit');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_maintainer', this.inputMaintainer.nativeElement.value);
        this.params.set('filter_project', this.inputProject.nativeElement.value);
        this.params.set('filter_buildvariant', this.inputBuildvariant.nativeElement.value);
        this.params.set('filter_commit', this.inputCommit.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputMaintainer.nativeElement);
        this.initFilter(this.inputProject.nativeElement);
        this.initFilter(this.inputCommit.nativeElement);
        this.initFilter(this.inputBuildvariant.nativeElement);
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

    scroll(event) {
        if (event.ctrlKey) {
            return;
        }
        if (event.deltaY > 0 && (this.paginator.pageIndex + 1) * this.paginator.pageSize < this.paginator.length) {
            this.paginator.pageIndex = this.paginator.pageIndex + 1;
            this.paginator.page.next();
        } else if (event.deltaY < 0 && this.paginator.pageIndex > 0) {
            this.paginator.pageIndex = this.paginator.pageIndex - 1;
            this.paginator.page.next();
        }
    }

    rebuild(id: number) {
        this.buildService.rebuild(id);
    }

    buildlatest(id) {
        this.repositoryService.build(id);
    }
}
