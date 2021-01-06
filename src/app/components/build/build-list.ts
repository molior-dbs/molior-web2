import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {BuildService, BuildDataSource, buildicon, Build} from '../../services/build.service';
import {AlertService} from '../../services/alert.service';

@Component({
    selector: 'app-build-list',
    templateUrl: './build-list.html',
    styleUrls: ['./build-list.scss']
})
export class BuildListComponent {
    constructor() {
    }
}

@Component({
    selector: 'app-build-dialog',
    templateUrl: 'build-delete-form.html',
})
export class BuildDeleteDialogComponent {
    clicked: boolean;
    build: Build;
    constructor(public dialog: MatDialogRef<BuildDeleteDialogComponent>,
                protected buildService: BuildService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { build: Build }
    ) {
        this.clicked = false;
        this.build = data.build;
    }

    save(): void {
        this.clicked = true;
        this.buildService.delete(this.build.id).subscribe( r => {
            this.dialog.close();
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}

@Component({
    selector: 'app-build-dialog',
    templateUrl: 'build-rebuild-form.html',
})
export class BuildRebuildDialogComponent {
    clicked: boolean;
    build: Build;
    constructor(public dialog: MatDialogRef<BuildRebuildDialogComponent>,
                protected buildService: BuildService,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { build: Build }
    ) {
        this.clicked = false;
        this.build = data.build;
    }

    save(): void {
        this.clicked = true;
        this.buildService.rebuild(this.build.id).subscribe( r => {
            this.dialog.close();
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}
