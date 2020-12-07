import {Component, ElementRef, ViewChild, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatStepper} from '@angular/material/stepper';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators, AbstractControl, FormArray} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';

import {TableComponent} from '../../lib/table.component';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {AlertService} from '../../services/alert.service';
import {BehaviorSubject, Observable} from 'rxjs';

@Component({
  selector: 'app-repos',
  templateUrl: './repo-list.html',
  styleUrls: ['./repo-list.scss']
})
export class RepositoryListComponent extends TableComponent {
    dataSource: RepositoryDataSource;
    displayedColumns: string[] = [
        'state',
        'name',
        'url',
        'actions',
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputURL', { static: false }) inputURL: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected dialog: MatDialog,
                protected repoService: RepositoryService,
                protected moliorService: MoliorService) {
        super(route, router, [['filter_name', ''], ['filter_url', '']]);
        this.dataSource = new RepositoryDataSource(repoService);
    }

    loadData() {
        this.dataSource.load('/api2/repositories', this.params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
        this.inputURL.nativeElement.value = this.params.get('filter_url');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_url', this.inputURL.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputURL.nativeElement);
    }

    edit(repo: Repository) {
        const dialogRef = this.dialog.open(RepositoryDialogComponent, {data: {repo}, disableClose: true, width: '40%'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(repo: Repository) {
        const dialogRef = this.dialog.open(RepoDeleteDialogComponent, {
            data: { repo },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    mergeDuplicate(repo: Repository) {
        const dialog = this.dialog.open(RepoMergeDialogComponent, {
            data: { repo },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

}

@Component({
  selector: 'app-repo-dialog',
  templateUrl: 'repo-form.html',
  styleUrls: ['./repo-form.scss']
})
export class RepositoryDialogComponent {
    public repo: Repository;
    form = this.fb.group({
        url: new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.gitValidator]),
    });

    constructor(public dialog: MatDialogRef<RepositoryDialogComponent>,
                protected repoService: RepositoryService,
                private fb: FormBuilder,
                protected alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { repo: Repository }) {
        this.repo = data.repo;
        this.form.patchValue({
            url: this.repo.url
        });
    }
    save(): void {
        this.repoService.editUrl(this.repo.id,
                                 this.form.value.url.trim()).subscribe(
            r => this.dialog.close(), err => this.alertService.error(err.error));
    }
}

@Component({
    selector: 'app-repo-dialog',
    templateUrl: 'repo-merge-form.html',
})
export class RepoMergeDialogComponent implements OnInit {
    public repo: Repository;
    form = this.fb.group({
        original_url: new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.gitValidator])
    });
    repos: Repository[];

    constructor(public dialog: MatDialogRef<RepoMergeDialogComponent>,
                protected repositoryService: RepositoryService,
                private fb: FormBuilder,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { repo: Repository }
    ) {
        this.repo = data.repo;
        this.repos = [];
    }

    ngOnInit() {
        this.form.controls.original_url.valueChanges.subscribe(
            r => {
                this.repositoryService.find(r).subscribe( r2 => {
                    this.repos = [];
                    for (const rep of r2) {
                        this.repos.push(rep);
                    }
                });
            });
    }

    save(): void {
        let originalID = -1;
        for (const rep of this.repos) {
            if (rep.url === this.form.value.original_url) {
                originalID = rep.id;
                break;
            }
        }
        this.repositoryService.mergeDuplicate(originalID, this.repo.id).subscribe(
            r => this.dialog.close(),
            err => this.alertService.error(err.error));
    }

    excludeDuplicate(originalURL: string): boolean {
       return originalURL !== this.repo.url;
    }
}

@Component({
    selector: 'app-repo-dialog',
    templateUrl: 'repo-delete-form.html',
})
export class RepoDeleteDialogComponent {
    repo: Repository;
    constructor(public dialog: MatDialogRef<RepoDeleteDialogComponent>,
                protected repoService: RepositoryService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { repo: Repository }
    ) { this.repo = data.repo; }

    save(): void {
        this.repoService.delete_repo(this.repo.id).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/repos']);
        },
        err => this.alertService.error(err.error));
    }
}
