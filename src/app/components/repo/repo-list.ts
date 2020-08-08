import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatStepper} from '@angular/material/stepper';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators, AbstractControl, FormArray} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';

import {TableComponent} from '../../lib/table.component';
import {RepositoryService, RepositoryDataSource, Repository} from '../../services/repository.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {AlertService} from '../../services/alert.service';


@Component({
  selector: 'app-repos',
  templateUrl: './repo-list.html',
  styleUrls: ['./repo-list.scss']
})
export class RepositoryListComponent extends TableComponent {
    dataSource: RepositoryDataSource;
    displayedColumns: string[] = [
        'name',
        'url',
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected dialog: MatDialog,
                protected repoService: RepositoryService,
                protected moliorService: MoliorService) {
        super(route, router, [['filter_name', '']]);
        this.dataSource = new RepositoryDataSource(repoService);
    }

    loadData() {
        this.dataSource.load('/api2/repositories', this.params);
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

    create() {
        const dialogRef = this.dialog.open(RepositoryDialogComponent, {disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    edit(repo) {
        // const dialogRef = this.dialog.open(RepositoryDialogComponent, {data: repo, disableClose: true, width: '900px'});
        // dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(id: number) {
        if (confirm('Delete repo ?')) {
            // this.repoService.delete(id);
        }
    }

    update(id: number) {
        // this.repoService.update(id);
    }
}

@Component({
  selector: 'app-repo-dialog',
  templateUrl: 'repo-form.html',
  styleUrls: ['./repo-form.scss']
})
export class RepositoryDialogComponent {
    form = this.fb.group({
         formArray: this.fb.array([
             this.fb.group({
                 repourl:     new FormControl('', [Validators.required, ValidationService.httpValidator]),
                 reponame:    new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.nameValidator]),
                 repoversion: new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.versionValidator]),
             }),
             this.fb.group({
                 reposrc: false,
                 repoinst: false,
                 repodist: new FormControl('', [Validators.required]),
             })
         ])
    });


    constructor(public dialog: MatDialogRef<RepositoryDialogComponent>,
                protected repoService: RepositoryService,
                private fb: FormBuilder,
                protected alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) public repo: Repository) {
        if (this.repo) {
            this.formArray.get([0]).patchValue({reponame: this.repo.name,
                                                repourl: this.repo.url
                                              });
        }
    }

    get formArray() {
        // Typecast, because: reasons
        // https://github.com/angular/angular-cli/issues/6099
        return this.form.get('formArray') as FormArray;
    }

    save(): void {
    }
}