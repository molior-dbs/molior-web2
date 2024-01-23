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

    edit(): void {
        const dialogRef = this.dialog.open(ProjectversionRetentionEditDialogComponent, {
            width: '400px',
            data: {
                projectversion: this.projectversion,
                retention_successful_builds: this.projectversion.retention_successful_builds,
                retention_failed_builds: this.projectversion.retention_failed_builds,
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if(result) {
                this.projectversion.retention_successful_builds = result.retentionSuccessfulBuilds,
                this.projectversion.retention_failed_builds = result.retentionFailedBuilds
            }
        })
    }
}

@Component({
    selector: 'app-projectversion-retention-edit-form',
    templateUrl: './projectversion-retention-edit-form.html',
})

export class ProjectversionRetentionEditDialogComponent {
    retentionSuccessfulBuilds = new FormControl(null, [Validators.required, Validators.min(1), Validators.max(5)]);
    retentionFailedBuilds = new FormControl(null, [Validators.required, Validators.min(7)]);

    constructor(
        public dialogRef: MatDialogRef<ProjectversionRetentionEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        protected projectVersionService: ProjectVersionService,
    ) {
        this.retentionSuccessfulBuilds.setValue(data.retention_successful_builds);
        this.retentionFailedBuilds.setValue(data.retention_failed_builds);
    }

    ngAfterViewInit(){
    }

    save(): void{

        this.projectVersionService
        .edit(
            this.data.projectversion.project_name,
            this.data.projectversion.name,
            this.data.projectversion.description,
            this.data.projectversion.dependency_policy,
            this.data.projectversion.ci_builds_enabled,
            this.retentionSuccessfulBuilds.value,
            this.retentionFailedBuilds.value
            ).subscribe(
                () => {
                    this.dialogRef.close({
                        retentionSuccessfulBuilds: this.retentionSuccessfulBuilds.value,
                        retentionFailedBuilds: this.retentionFailedBuilds.value,
                    });
                    this.data.retention_successful_builds = this.retentionSuccessfulBuilds.value;
                    this.data.retention_failed_builds = this.retentionFailedBuilds.value;
                },
                error => {
                    console.error('Error saving retention values:', error);
                }
            );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
