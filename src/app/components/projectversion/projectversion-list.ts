import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectVersionService, ProjectVersionDataSource, ProjectVersion, Project} from '../../services/project.service';
import {MirrorService, Mirror} from '../../services/mirror.service';
import {ValidationService} from '../../services/validation.service';


@Component({
  selector: 'app-projectversions',
  templateUrl: './projectversion-list.html',
})
export class ProjectversionListComponent extends TableComponent {
    dataSource: ProjectVersionDataSource;
    project: Project;
    projectversion: ProjectVersion;
    displayedColumns: string[] = [
        'name',
        'architectures',
        'basemirror',
        'is_locked',
        'ci_builds_enabled',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected projectVersionsService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.project = {id: null, name: this.route.parent.snapshot.paramMap.get('name'), description: ''};
        this.projectService.get(this.project.name).subscribe((res: Project) => this.project = res);
        this.dataSource = new ProjectVersionDataSource(projectVersionsService);
        this.contextmenuIndex = 0;  // no previous context menus
    }

    loadData() {
        this.dataSource.load(`/api2/project/${this.project.name}/versions`, this.params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_name', this.inputName.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
    }

    create(): void {
        const dialog = this.dialog.open(ProjectversionDialogComponent, {
            data: { projectName: this.project.name },
            disableClose: true,
            width: '40%',
        });

        dialog.afterClosed().subscribe(result => {
            this.loadData();
        });
    }
}

@Component({
    selector: 'app-projectversion-dialog',
    templateUrl: 'projectversion-form.html',
})
export class ProjectversionDialogComponent {
    basemirrors: { [id: string]: string[]; };
    mirrorArchs: string[];
    form = this.fb.group({
        version: new FormControl('', [Validators.required,
                                      Validators.minLength(2),
                                      ValidationService.versionValidator]),
        description: new FormControl('', [Validators.maxLength(255)]),
        basemirror: new FormControl('', [Validators.required]),
        architectures: new FormControl([]),
        architecture0: new FormControl(true),
        architecture1: new FormControl(true),
        architecture2: new FormControl(true),
        architecture3: new FormControl(true)
    });

    constructor(public dialog: MatDialogRef<ProjectversionDialogComponent>,
                private fb: FormBuilder,
                protected mirrorService: MirrorService,
                protected projectVersionService: ProjectVersionService,
                @Inject(MAT_DIALOG_DATA) private data: { projectName: string }
    ) {
        this.basemirrors = {};
        this.mirrorArchs = [];
        mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrors = {};
            for (const entry of res) {
                this.basemirrors[`${entry.name}/${entry.version}`] = entry.architectures;
            }
        });
    }

    updateArchs(): void {
        this.mirrorArchs.forEach((item, index) => {
            if (this.form.value[`architecture${index}`] === true) {
                this.form.value.architectures.push(item);
            }
        });
    }

    save(): void {
        this.updateArchs();
        this.projectVersionService.create(this.data.projectName,
            this.form.value.version,
            this.form.value.description,
            this.form.value.basemirror,
            this.form.value.architectures);
        this.dialog.close();
    }

    getArchitectures(event: MatOptionSelectionChange) {
        /* tslint:disable:no-string-literal */
        this.mirrorArchs = this.basemirrors[event['value']];
        /* tslint:enable:no-string-literal */
    }
}

