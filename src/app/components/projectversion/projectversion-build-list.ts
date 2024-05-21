import {Component, ElementRef, ViewChild, Input, Inject} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {ProjectService, ProjectVersion, ProjectVersionService} from '../../services/project.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';


@Component({
    selector: 'app-projectversion-build-list',
    templateUrl: './projectversion-build-list.html',
    styleUrls: ['./projectversion-build-list.scss']
})
export class ProjectversionBuildListComponent {
    buildicon;
    projectversion: ProjectVersion;

    constructor(protected route: ActivatedRoute,
                public dialog: MatDialog,
                protected projectversionService: ProjectVersionService) {
        this.route.parent.paramMap.subscribe((params: ParamMap) => {
            const version = params.get('version');
            this.route.parent.parent.paramMap.subscribe((params2: ParamMap) => {
                const name = params2.get('name');
                this.projectversionService.get(name, version).subscribe((res: ProjectVersion) => {
                    this.projectversion = res;
                });
            });
        });
    }
}
