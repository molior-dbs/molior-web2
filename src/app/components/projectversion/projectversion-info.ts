import {Component, OnInit, Input, ViewChild, ElementRef, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

import {ProjectVersion, ProjectVersionService, ProjectVersionDataSource} from '../../services/project.service';
import {TableComponent} from '../../lib/table.component';

@Component({
    selector: 'app-projectversion-info',
    templateUrl: './projectversion-info.html'
})
export class ProjectversionInfoComponent extends TableComponent {
    projectversion: ProjectVersion;
    apt_sources: string;
    dataSource: ProjectVersionDataSource;
    displayedColumns: string[] = [
        'dependency',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(public route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.projectversion = {id: -1, name: this.route.parent.snapshot.paramMap.get('version'), is_locked: false,
                               project_name: this.route.parent.parent.snapshot.paramMap.get('name'),
                               apt_url: '', architectures: [], basemirror: ''};
        this.dataSource = new ProjectVersionDataSource(projectversionService);
        this.contextmenuIndex = 0;  // no previous context menus
        this.apt_sources = '';
    }

    loadData() {
        this.dataSource.load(`/api2/project/${this.projectversion.project_name}/${this.projectversion.name}/dependencies`, this.params);
        this.projectversionService.get(this.projectversion.project_name,
            this.projectversion.name).subscribe((res: ProjectVersion) => this.projectversion = res);
        this.projectversionService.get_apt_sources(this.projectversion.project_name,
            this.projectversion.name).subscribe((res: string) => this.apt_sources = res);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    add() {
        const dialog = this.dialog.open(DependencyDialogComponent, {
            data: { projectversion: this.projectversion },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }

    removeDependency(name: string, version: string) {
        this.projectversionService.removeDependency(this.projectversion, `${name}/${version}`).subscribe( r => {
            this.loadData();
        });
    }
}


@Component({
    selector: 'app-dependency-dialog',
    templateUrl: 'projectversion-dependency-form.html',
})
export class DependencyDialogComponent {
    projectversion: ProjectVersion;
    dependencies: any;
    form = this.fb.group({
        dependency: new FormControl('', [Validators.required]),
    });

    constructor(public dialog: MatDialogRef<DependencyDialogComponent>,
                private fb: FormBuilder,
                protected projectversionService: ProjectVersionService,
                @Inject(MAT_DIALOG_DATA) private data: { projectversion: ProjectVersion }
    ) {
        this.projectversion = data.projectversion;
        projectversionService.getDependencies(data.projectversion).subscribe(res => {
            this.dependencies = {};
            for (const entry of res) {
                this.dependencies[entry.id] = `${entry.project_name}/${entry.name}`;
            }
        });
    }

    changeDependency() {
    }

    save(): void {
        this.projectversionService.addDependency(this.projectversion, this.form.value.dependency).subscribe( r => {
            this.dialog.close();
        });
    }
}

