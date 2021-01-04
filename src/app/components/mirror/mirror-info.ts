import {Component, OnInit, Input, ViewChild, ElementRef, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {MirrorService, Mirror} from '../../services/mirror.service';
import {ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MirrorDeleteDialogComponent, MirrorCopyDialogComponent, MirrorDialogComponent} from './mirror-list';

@Component({
    selector: 'app-mirror',
    templateUrl: './mirror-info.html',
    styleUrls: ['./mirror-info.scss']
})
export class MirrorInfoComponent extends TableComponent {
    mirror: Mirror;
    dataSource: ProjectVersionDataSource;
    displayedColumns: string[] = [
        'dependent',
        'architectures',
        'is_locked',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected mirrorService: MirrorService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.mirror = {id: -1,
            name: '',
            version: '',
            url: '',
            basemirror_id: 0,
            basemirror_name: '',
            basemirror_url: '',
            distribution: '',
            components: '',
            is_basemirror: false,
            architectures: [],
            is_locked: false,
            with_sources: false,
            with_installer: false,
            project_id: 0,
            state: '',
            apt_url: '',
            mirrorkeyurl: '',
            mirrorkeyids: '',
            mirrorkeyserver: '',
            dependency_policy: 'strict'
        };
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    loadData() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            const version = params.get('version');
            this.mirrorService.get(name, version).subscribe((res: Mirror) => {
                this.mirror = res;
                this.dataSource.load(`/api2/mirror/${this.mirror.name}/${this.mirror.version}/dependents`, this.params);
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

    edit() {
        const dialogRef = this.dialog.open(MirrorDialogComponent, { data: { mirror: this.mirror }, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    copy() {
        const dialogRef = this.dialog.open(MirrorCopyDialogComponent, { data: { mirror: this.mirror }, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(): void {
        const dialog = this.dialog.open(MirrorDeleteDialogComponent, {
            data: { mirror: this.mirror },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    update() {
        this.mirrorService.update(this.mirror.id).subscribe();
    }
}
