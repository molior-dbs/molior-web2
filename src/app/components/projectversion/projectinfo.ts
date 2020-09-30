import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectVersionService, ProjectVersionDataSource, ProjectVersion, Project} from '../../services/project.service';
import {MirrorService, Mirror, BaseMirrorValidator} from '../../services/mirror.service';
import {ValidationService} from '../../services/validation.service';


@Component({
    selector: 'app-projectversions',
    templateUrl: './projectinfo.html',
    styleUrls: ['./projectinfo.scss']
})
export class ProjectInfoComponent extends TableComponent {
    dataSource: ProjectVersionDataSource;
    project: Project;
    projectversion: ProjectVersion;
    displayedColumns: string[] = [
        'name',
        'architectures',
        'basemirror',
        'is_locked',
        'ci_builds_enabled',
        'description',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected projectversionService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.project = {id: null, name: this.route.parent.snapshot.paramMap.get('name'), description: ''};
        this.projectService.get(this.project.name).subscribe((res: Project) => this.project = res);
        this.dataSource = new ProjectVersionDataSource(projectversionService);
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
    projectName: string;
    projectversion: ProjectVersion;
    basemirrors: { [id: string]: string[]; };
    mirrorArchs: string[];
    defaultDependencyLevel: 'strict';
    form = this.fb.group({
        version: new FormControl('', [Validators.required,
                                      Validators.minLength(2),
                                      ValidationService.versionValidator]),
        description: new FormControl('', [Validators.maxLength(255)]),
        basemirror: new FormControl('', [Validators.required, BaseMirrorValidator.bind(this)]),
        architectures: new FormControl([]),
        architecture0: new FormControl(true),
        architecture1: new FormControl(true),
        architecture2: new FormControl(true),
        architecture3: new FormControl(true),
        dependencylevel: new FormControl('strict', [Validators.required])
    });

    constructor(public dialog: MatDialogRef<ProjectversionDialogComponent>,
                private fb: FormBuilder,
                protected mirrorService: MirrorService,
                protected projectVersionService: ProjectVersionService,
                protected router: Router,
                @Inject(MAT_DIALOG_DATA) private data: { projectName: string, projectversion: ProjectVersion}
    ) {
        this.projectName = data.projectName;
        this.projectversion = data.projectversion;
        if (this.projectversion) {
          this.form.patchValue({version: this.projectversion.name});
          this.form.patchValue({basemirror: this.projectversion.basemirror});
          this.form.patchValue({architectures: this.projectversion.architectures});
          this.form.patchValue({description: this.projectversion.description});
          this.form.patchValue({dependencylevel: this.projectversion.dependency_policy});
        }
        this.mirrorArchs = [];
        this.basemirrors = {};
        mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrors = {};
            for (const entry of res) {
                this.basemirrors[`${entry.name}/${entry.version}`] = entry.architectures;
            }
            if (this.editMode()) {
                this.mirrorArchs = this.basemirrors[this.form.value.basemirror];
                this.form.get('basemirror').updateValueAndValidity();
                this.updateArchs();
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
        if (this.editMode()) {
            this.projectVersionService.edit(this.data.projectName,
                                            this.projectversion.name,
                                            this.form.value.description,
                                            this.form.value.dependencylevel);
            // FIXME: .sunscribe(... handle error)
        } else {
            this.projectVersionService.create(this.data.projectName,
                                              this.form.value.version,
                                              this.form.value.description,
                                              this.form.value.dependencylevel,
                                              this.form.value.basemirror,
                                              this.form.value.architectures);
        }
        this.router.navigate(['/project', this.projectName, this.form.value.version]);
        this.dialog.close();
    }

    changeBaseMirror() {
        if (this.form.value.basemirror && this.form.value.basemirror in this.basemirrors) {
            this.mirrorArchs = this.basemirrors[this.form.value.basemirror];
        } else {
            this.mirrorArchs = [];
        }
        this.mirrorService.getBaseMirrors(this.form.value.basemirror).subscribe(res => {
            this.basemirrors = {};
            for (const entry of res) {
                this.basemirrors[`${entry.name}/${entry.version}`] = entry.architectures;
            }
        });
    }

    editMode(): boolean {
        if (this.projectversion && this.projectversion.name) {
           return true;
        }
        return false;
    }
}

