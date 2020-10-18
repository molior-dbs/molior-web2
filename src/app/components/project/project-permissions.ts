import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatOptionSelectionChange} from '@angular/material';

import {TableComponent} from '../../lib/table.component';
import {ProjectService, ProjectVersionService, ProjectVersionDataSource, ProjectVersion, Project} from '../../services/project.service';
import {MirrorService, Mirror, BaseMirrorValidator} from '../../services/mirror.service';
import {ValidationService} from '../../services/validation.service';

@Component({
    selector: 'app-projectversion-permissions',
    templateUrl: './project-permissions.html',
    styleUrls: ['./project-permissions.scss']
})
export class ProjectPermissionsComponent extends TableComponent {
    dataSource: ProjectVersionDataSource;
    project: Project;
    displayedColumns: string[] = [
        'username',
        'role',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectService: ProjectService,
                protected projectversionService: ProjectVersionService,
                protected dialog: MatDialog) {
        super(route, router, [['filter_name', '']]);
        this.project = {id: -1, name: '', description: ''};
        this.dataSource = new ProjectVersionDataSource(projectversionService);
    }

    loadData() {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.projectService.get(name).subscribe((res: Project) => this.project = res);
            this.dataSource.load(`/api2/project/${name}/permissions`, this.params);
        });
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

    create(): void {
    }

    edit(element) {
    }

    delete(id: number) {
    }
}
