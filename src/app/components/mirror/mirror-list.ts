import {Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatStepper} from '@angular/material/stepper';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl, Validators, AbstractControl, FormArray} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';

import {TableComponent} from '../../lib/table.component';
import {MirrorService, MirrorDataSource, Mirror, BaseMirrorValidator} from '../../services/mirror.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {AlertService} from '../../services/alert.service';


@Component({
  selector: 'app-mirrors',
  templateUrl: './mirror-list.html',
  styleUrls: ['./mirror-list.scss']
})
export class MirrorListComponent extends TableComponent {
    dataSource: MirrorDataSource;
    displayedColumns: string[] = [
        'is_basemirror',
        'state',
        'name',
        'components',
        'architectures',
        'basemirror',
        'url',
        'actions'
    ];
    @ViewChild('inputName', { static: false }) inputName: ElementRef;
    @ViewChild('inputBasemirror', { static: false }) inputBasemirror: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected dialog: MatDialog,
                protected mirrorService: MirrorService,
                protected moliorService: MoliorService) {
        super(route, router, [['filter_name', ''], ['filter_basemirror', '']]);
        this.dataSource = new MirrorDataSource(mirrorService);
    }

    loadData() {
        this.dataSource.load('/api/mirror', this.params);
    }

    initElements() {
        this.inputName.nativeElement.value = this.params.get('filter_name');
        this.inputBasemirror.nativeElement.value = this.params.get('filter_basemirror');
    }

    setParams() {
        this.params.set('filter_name', this.inputName.nativeElement.value);
        this.params.set('filter_basemirror', this.inputBasemirror.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.inputName.nativeElement);
        this.initFilter(this.inputBasemirror.nativeElement);
        this.moliorService.mirrors.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt); });
    }

    public mirroricon(state) {
        switch (state) {
            case 'created':
                return 'schedule';
            case 'ready':
                return 'done';
            case 'error':
                return 'error';
            case 'updating':
                return 'sync';
            case 'publishing':
                return 'publish';
            default:
                return 'more_horiz';
        }
    }

    create() {
        const dialogRef = this.dialog.open(MirrorDialogComponent, {data: {mirror: null}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    edit(mirror) {
        const dialogRef = this.dialog.open(MirrorDialogComponent, {data: {mirror}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    copy(mirror) {
        const dialogRef = this.dialog.open(MirrorCopyDialogComponent, {data: {mirror}, disableClose: true, width: '900px'});
        dialogRef.afterClosed().subscribe(result => this.loadData());
    }

    delete(mirror: Mirror): void {
        const dialog = this.dialog.open(MirrorDeleteDialogComponent, {
            data: { mirror },
            disableClose: true,
            width: '40%',
        });
        dialog.afterClosed().subscribe(r => this.loadData());
    }

    update(id: number) {
        this.mirrorService.update(id).subscribe();
    }
}

@Component({
  selector: 'app-mirror-dialog',
  templateUrl: 'mirror-form.html',
  styleUrls: ['./mirror-form.scss']
})
export class MirrorDialogComponent {
    clicked: boolean;
    mirror: Mirror;
    basemirrorArchs: { [id: string]: string[]; };
    basemirrors: any[];
    architectures = [ 'amd64', 'i386', 'arm64', 'armhf' ];
    defaultDependencyLevel: 'strict';
    distpreset: string;
    mirrorurls = [];
    form = this.fb.group({
         formArray: this.fb.array([
             this.fb.group({
                 mirrorurl:     new FormControl('', [Validators.required, ValidationService.httpValidator]),
                 mirrorname:    new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.nameValidator]),
                 mirrorversion: new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.versionValidator]),
                 mirrortype:    new FormControl('1'),
                 basemirror:    new FormControl(''),
                 external_repo: new FormControl(false),
                 dependencylevel: new FormControl('strict', [Validators.required]),
             }),
             this.fb.group({
                 mirrorsrc: new FormControl(false),
                 mirrorinst: new FormControl(false),
                 mirrordist: new FormControl('', [Validators.required]),
                 mirrorcomponents: new FormControl('main', [Validators.required]),
                 architectures: new FormControl(this.architectures, [Validators.required]),
                 architecture0: new FormControl(true),
                 architecture1: new FormControl(true),
                 architecture2: new FormControl(true),
                 architecture3: new FormControl(true),
             }),
             this.fb.group({
                 mirrorkeytype: new FormControl(['1']),
                 mirrorkeyurl: new FormControl('', [Validators.required]),
                 mirrorkeyids: new FormControl(''),
                 mirrorkeyserver: new FormControl('hkp://keyserver.ubuntu.com:80')
             }),
             this.fb.group({
                 mirrorfilter: new FormControl(''),
             })
         ])
    });


    constructor(public dialog: MatDialogRef<MirrorDialogComponent>,
                protected mirrorService: MirrorService,
                private fb: FormBuilder,
                protected alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { mirror: Mirror }) {
        this.clicked = false;
        if (data.mirror) {
            this.mirror = data.mirror;
        }
        this.basemirrorArchs = {};
        this.basemirrors = [];
        this.distpreset = '';
        this.mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrorArchs = {};
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrorArchs[`${entry.name}/${entry.version}`] = entry.architectures;
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
        });
        this.mirrorService.getMirrors().subscribe(res => {
            this.mirrorurls = [];
            for (const entry of res) {
                if (!this.mirrorurls.includes(entry.url)) {
                    this.mirrorurls.push(entry.url);
                }
            }
        });
        if (this.mirror) {
            this.formArray.get([0]).patchValue({mirrorname: this.mirror.name,
                                                mirrorversion: this.mirror.version,
                                                mirrorurl: this.mirror.url,
                                                mirrortype: this.mirror.is_basemirror ? '1' : '2',
                                                external_repo: this.mirror.external_repo,
                                                basemirror: this.mirror.basemirror_name,
                                                dependencylevel: this.mirror.dependency_policy
                                              });
            this.formArray.get([1]).patchValue({mirrorsrc: this.mirror.with_sources,
                                                mirrorinst: this.mirror.with_installer,
                                                mirrordist: this.mirror.distribution,
                                                mirrorcomponents: this.mirror.components,
                                                architecture0: this.mirror.architectures.includes('amd64'),
                                                architecture1: this.mirror.architectures.includes('i386'),
                                                architecture2: this.mirror.architectures.includes('arm64'),
                                                architecture3: this.mirror.architectures.includes('armhf')
                                              });
            this.formArray.get([2]).patchValue({
                                                mirrorkeyurl: this.mirror.mirrorkeyurl,
                                                mirrorkeyids: this.mirror.mirrorkeyids.split(/[, ]/).join(' '),
                                                mirrorkeyserver: this.mirror.mirrorkeyserver
                                              });
            this.formArray.get([3]).patchValue({mirrorfilter: this.mirror.mirrorfilter,
                                              });
            if (this.mirror.mirrorkeyurl !== '') {
                this.formArray.get([2]).patchValue({mirrorkeytype: '1'});
            } else if (this.mirror.mirrorkeyids !== '') {
                this.formArray.get([2]).patchValue({mirrorkeytype: '2'});
            } else {
                this.formArray.get([2]).patchValue({mirrorkeytype: '3'});
            }
            setTimeout(this.initKeyTab.bind(this));
        }
    }

    initKeyTab() {
        if (this.mirror) {
            if (this.mirror.mirrorkeyurl !== '') {
                this.chooseKeyFile();
            } else { // if (this.mirror.mirrorkeyids !== '') {
                this.chooseKeyServer();
            } // else {
            //  this.chooseNoKey();
            // }
        }
    }

    get formArray() {
        // Typecast, because: reasons
        // https://github.com/angular/angular-cli/issues/6099
        return this.form.get('formArray') as FormArray;
    }

    updateArchs(): void {
        this.formArray.get([1]).patchValue({architectures: null});
        const archs = [];
        this.architectures.forEach((item, index) => {
            if (this.formArray.get([1]).value[`architecture${index}`] === true) {
                archs.push(item);
            }
        });
        if (archs.length > 0) {
            this.formArray.get([1]).patchValue({architectures: archs});
            this.formArray.get([1]).get('architectures').markAsTouched();
        }
        this.formArray.get([1]).get('architectures').updateValueAndValidity();
    }

    changeMirrorURL() {
        const data = this.formArray.value;
        this.mirrorService.getMirrors(data[0].mirrorurl).subscribe(res => {
            this.mirrorurls = [];
            for (const entry of res) {
                if (!this.mirrorurls.includes(entry.url)) {
                    this.mirrorurls.push(entry.url);
                }
            }
        });
    }

    changeName() {
        if (this.formArray.value[0].mirrortype === '1' && this.formArray.value[1].mirrordist.trim() === this.distpreset) {
            this.distpreset = this.formArray.value[0].mirrorname.trim();
            this.formArray.get([1]).patchValue({mirrordist: this.distpreset});
        }
    }

    changeBaseMirror() {
        this.formArray.get([0]).patchValue({mirrortype: '2'});
        const data = this.formArray.value;
        this.mirrorService.getBaseMirrors(data[0].basemirror).subscribe(res => {
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
        });
        this.chooseAdditionalMirror();
    }

    changeKeyFile() {
        this.formArray.get([2]).patchValue({mirrorkeytype: '1'});
        this.chooseKeyFile();
    }

    changeKeyServer() {
        this.formArray.get([2]).patchValue({mirrorkeytype: '2'});
        this.chooseKeyServer();
    }

    chooseBaseMirror() {
        const form = this.formArray.get([0]);
        form.get('basemirror').setValidators(null);
        form.get('basemirror').updateValueAndValidity();
        if (this.distpreset !== '' && this.formArray.value[1].mirrordist.trim() === '') {
            this.formArray.get([1]).patchValue({mirrordist: this.distpreset});
        }
        form.patchValue({dependencylevel: this.defaultDependencyLevel});
    }

    chooseAdditionalMirror() {
        const form = this.formArray.get([0]);
        form.get('basemirror').setValidators([Validators.required, BaseMirrorValidator.bind(this)]);
        form.get('basemirror').markAsTouched();
        form.get('basemirror').updateValueAndValidity();
        if (this.distpreset !== '' && this.formArray.value[1].mirrordist.trim() === this.distpreset) {
            this.formArray.get([1]).patchValue({mirrordist: ''});
        }
    }

    chooseKeyFile() {
        const form = this.formArray.get([2]);
        form.get('mirrorkeyurl').setValidators(Validators.required);
        form.get('mirrorkeyurl').updateValueAndValidity();

        form.get('mirrorkeyids').setValidators(null);
        form.get('mirrorkeyids').updateValueAndValidity();
        form.get('mirrorkeyserver').setValidators(null);
        form.get('mirrorkeyserver').updateValueAndValidity();
    }

    chooseKeyServer() {
        const form = this.formArray.get([2]);
        form.get('mirrorkeyurl').setValidators(null);
        form.get('mirrorkeyurl').updateValueAndValidity();

        form.get('mirrorkeyids').setValidators(Validators.required);
        form.get('mirrorkeyids').updateValueAndValidity();
        form.get('mirrorkeyserver').setValidators(Validators.required);
        form.get('mirrorkeyserver').updateValueAndValidity();
    }

    // chooseNoKey() {
    //     const form = this.formArray.get([2]);
    //     form.get('mirrorkeyurl').setValidators(null);
    //     form.get('mirrorkeyurl').updateValueAndValidity();
    //     form.get('mirrorkeyids').setValidators(null);
    //     form.get('mirrorkeyids').updateValueAndValidity();
    //     form.get('mirrorkeyserver').setValidators(null);
    //     form.get('mirrorkeyserver').updateValueAndValidity();
    // }

    save(): void {
        this.clicked = true;
        this.updateArchs();
        const data = this.formArray.value;
        // FIXME: only send needed key info
        if (!this.mirror) {
            this.mirrorService.create(data[0].mirrorname,
                                      data[0].mirrorversion,
                                      data[0].mirrortype,
                                      data[0].basemirror,
                                      data[0].external_repo,
                                      data[0].mirrorurl,
                                      data[0].dependencylevel,
                                      data[1].mirrordist,
                                      data[1].mirrorcomponents,
                                      data[1].architectures,
                                      data[1].mirrorsrc,
                                      data[1].mirrorinst,
                                      data[2].mirrorkeytype,
                                      data[2].mirrorkeytype == 1 ? data[2].mirrorkeyurl : "",
                                      data[2].mirrorkeytype == 2 ? data[2].mirrorkeyids : "",
                                      data[2].mirrorkeytype == 2 ? data[2].mirrorkeyserver : "",
                                      data[3].mirrorfilter,
                                     ).subscribe(
                                        msg => this.dialog.close(),
                                        err => {
                                            this.alertService.error(err.error);
                                            this.clicked = false;
                                        }
                                     );
        } else {
            this.mirrorService.edit(this.mirror.name,
                                    this.mirror.version,
                                    data[0].mirrortype,
                                    data[0].basemirror,
                                    data[0].external_repo,
                                    data[0].mirrorurl,
                                    data[0].dependencylevel,
                                    data[1].mirrordist,
                                    data[1].mirrorcomponents,
                                    data[1].architectures,
                                    data[1].mirrorsrc,
                                    data[1].mirrorinst,
                                    data[2].mirrorkeytype,
                                    data[2].mirrorkeytype == 1 ? data[2].mirrorkeyurl : "",
                                    data[2].mirrorkeytype == 2 ? data[2].mirrorkeyids : "",
                                    data[2].mirrorkeytype == 2 ? data[2].mirrorkeyserver : "",
                                    data[3].mirrorfilter,
                                   ).subscribe(
                                      msg => this.dialog.close(),
                                      err => {
                                          this.alertService.error(err.error);
                                          this.clicked = false;
                                      }
                                   );
        }
    }
}

@Component({
  selector: 'app-mirror-dialog',
  templateUrl: 'mirror-copy-form.html',
  styleUrls: ['./mirror-copy-form.scss']
})
export class MirrorCopyDialogComponent {
    clicked: boolean;
    mirror: Mirror;
    basemirrorArchs: { [id: string]: string[]; };
    basemirrors: any[];
    architectures = [ 'amd64', 'i386', 'arm64', 'armhf' ];
    defaultDependencyLevel: 'strict';
    distpreset: string;
    mirrorurls = [];
    form = this.fb.group({
         formArray: this.fb.array([
             this.fb.group({
                 mirrorurl:     new FormControl('', [Validators.required, ValidationService.httpValidator]),
                 mirrorname:    new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.nameValidator]),
                 mirrorversion: new FormControl('', [Validators.required, Validators.minLength(2), ValidationService.versionValidator]),
                 mirrortype:    new FormControl(['1']),
                 basemirror:    new FormControl(''),
                 external_repo: new FormControl(false),
                 dependencylevel: new FormControl('strict'),
             }),
             this.fb.group({
                 mirrorsrc: new FormControl(false),
                 mirrorinst: new FormControl(false),
                 mirrordist: new FormControl('', [Validators.required]),
                 mirrorcomponents: new FormControl('main', [Validators.required]),
                 architectures: new FormControl(this.architectures, [Validators.required]),
                 architecture0: new FormControl(true),
                 architecture1: new FormControl(true),
                 architecture2: new FormControl(true),
                 architecture3: new FormControl(true),
             }),
             this.fb.group({
                 mirrorkeytype: new FormControl(['1']),
                 mirrorkeyurl: new FormControl('', [Validators.required]),
                 mirrorkeyids: new FormControl(''),
                 mirrorkeyserver: new FormControl('hkp://keyserver.ubuntu.com:80')
             }),
             this.fb.group({
                 mirrorfilter: new FormControl(''),
             })
         ])
    });


    constructor(public dialog: MatDialogRef<MirrorCopyDialogComponent>,
                protected mirrorService: MirrorService,
                private fb: FormBuilder,
                protected alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { mirror: Mirror }) {
        this.clicked = false;
        if (data.mirror) {
            this.mirror = data.mirror;
        }
        this.basemirrorArchs = {};
        this.basemirrors = [];
        this.distpreset = '';
        this.mirrorService.getBaseMirrors().subscribe(res => {
            this.basemirrorArchs = {};
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrorArchs[`${entry.name}/${entry.version}`] = entry.architectures;
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
        });
        this.mirrorService.getMirrors().subscribe(res => {
            this.mirrorurls = [];
            for (const entry of res) {
                if (!this.mirrorurls.includes(entry.url)) {
                    this.mirrorurls.push(entry.url);
                }
            }
        });
        this.formArray.get([0]).patchValue({mirrorurl: this.mirror.url,
                                            mirrorname: this.mirror.name,
                                            mirrorversion: this.mirror.version + '-copy',
                                            mirrortype: this.mirror.is_basemirror ? '1' : '2',
                                            basemirror: this.mirror.basemirror_name,
                                            external_repo: this.mirror.external_repo,
                                            dependencylevel: this.mirror.dependency_policy
                                          });
        this.formArray.get([1]).patchValue({mirrorsrc: this.mirror.with_sources,
                                            mirrorinst: this.mirror.with_installer,
                                            mirrordist: this.mirror.distribution,
                                            mirrorcomponents: this.mirror.components,
                                            architecture0: this.mirror.architectures.includes('amd64'),
                                            architecture1: this.mirror.architectures.includes('i386'),
                                            architecture2: this.mirror.architectures.includes('arm64'),
                                            architecture3: this.mirror.architectures.includes('armhf')
                                          });
        this.formArray.get([2]).patchValue({
                                            mirrorkeyurl: this.mirror.mirrorkeyurl,
                                            mirrorkeyids: this.mirror.mirrorkeyids.split(/[, ]/).join(' '),
                                            mirrorkeyserver: this.mirror.mirrorkeyserver
                                          });
        if (this.mirror.mirrorfilter != null) {
            this.formArray.get([3]).patchValue({mirrorfilter: this.mirror.mirrorfilter});
        }
        if (this.mirror.mirrorkeyurl !== '') {
            this.formArray.get([2]).patchValue({mirrorkeytype: '1'});
        } else if (this.mirror.mirrorkeyids !== '') {
            this.formArray.get([2]).patchValue({mirrorkeytype: '2'});
        } else {
            this.formArray.get([2]).patchValue({mirrorkeytype: '3'});
        }
        setTimeout(this.initKeyTab.bind(this));
    }

    initKeyTab() {
        if (this.mirror.mirrorkeyurl !== '') {
            this.chooseKeyFile();
        } else { // if (this.mirror.mirrorkeyids !== '') {
            this.chooseKeyServer();
        } // else {
        //  this.chooseNoKey();
        // }
    }

    get formArray() {
        // Typecast, because: reasons
        // https://github.com/angular/angular-cli/issues/6099
        return this.form.get('formArray') as FormArray;
    }

    updateArchs(): void {
        this.formArray.get([1]).patchValue({architectures: null});
        const archs = [];
        this.architectures.forEach((item, index) => {
            if (this.formArray.get([1]).value[`architecture${index}`] === true) {
                archs.push(item);
            }
        });
        if (archs.length > 0) {
            this.formArray.get([1]).patchValue({architectures: archs});
            this.formArray.get([1]).get('architectures').markAsTouched();
        }
        this.formArray.get([1]).get('architectures').updateValueAndValidity();
    }

    changeMirrorURL() {
        const data = this.formArray.value;
        this.mirrorService.getMirrors(data[0].mirrorurl).subscribe(res => {
            this.mirrorurls = [];
            for (const entry of res) {
                if (!this.mirrorurls.includes(entry.url)) {
                    this.mirrorurls.push(entry.url);
                }
            }
        });
    }

    changeName() {
        if (this.formArray.value[0].mirrortype === '1' && this.formArray.value[1].mirrordist.trim() === this.distpreset) {
            this.distpreset = this.formArray.value[0].mirrorname.trim();
            this.formArray.get([1]).patchValue({mirrordist: this.distpreset});
        }
    }

    changeBaseMirror() {
        this.formArray.get([0]).patchValue({mirrortype: '2'});
        const data = this.formArray.value;
        this.mirrorService.getBaseMirrors(data[0].basemirror).subscribe(res => {
            this.basemirrors = [];
            for (const entry of res) {
                this.basemirrors.push({name: `${entry.name}/${entry.version}`, architectures: entry.architectures});
            }
        });
        this.chooseAdditionalMirror();
    }

    changeKeyFile() {
        this.formArray.get([2]).patchValue({mirrorkeytype: '1'});
        this.chooseKeyFile();
    }

    changeKeyServer() {
        this.formArray.get([2]).patchValue({mirrorkeytype: '2'});
        this.chooseKeyServer();
    }

    chooseBaseMirror() {
        const form = this.formArray.get([0]);
        form.get('basemirror').setValidators(null);
        form.get('basemirror').updateValueAndValidity();
        if (this.distpreset !== '' && this.formArray.value[1].mirrordist.trim() === '') {
            this.formArray.get([1]).patchValue({mirrordist: this.distpreset});
        }
        form.patchValue({dependencylevel: this.defaultDependencyLevel});
    }

    chooseAdditionalMirror() {
        const form = this.formArray.get([0]);
        form.get('basemirror').setValidators([Validators.required, BaseMirrorValidator.bind(this)]);
        form.get('basemirror').markAsTouched();
        form.get('basemirror').updateValueAndValidity();
        if (this.distpreset !== '' && this.formArray.value[1].mirrordist.trim() === this.distpreset) {
            this.formArray.get([1]).patchValue({mirrordist: ''});
        }
    }

    chooseKeyFile() {
        const form = this.formArray.get([2]);
        form.get('mirrorkeyurl').setValidators(Validators.required);
        form.get('mirrorkeyurl').updateValueAndValidity();

        form.get('mirrorkeyids').setValidators(null);
        form.get('mirrorkeyids').updateValueAndValidity();
        form.get('mirrorkeyserver').setValidators(null);
        form.get('mirrorkeyserver').updateValueAndValidity();
    }

    chooseKeyServer() {
        const form = this.formArray.get([2]);
        form.get('mirrorkeyurl').setValidators(null);
        form.get('mirrorkeyurl').updateValueAndValidity();

        form.get('mirrorkeyids').setValidators(Validators.required);
        form.get('mirrorkeyids').updateValueAndValidity();
        form.get('mirrorkeyserver').setValidators(Validators.required);
        form.get('mirrorkeyserver').updateValueAndValidity();
    }

    // chooseNoKey() {
    //     const form = this.formArray.get([2]);
    //     form.get('mirrorkeyurl').setValidators(null);
    //     form.get('mirrorkeyurl').updateValueAndValidity();
    //     form.get('mirrorkeyids').setValidators(null);
    //     form.get('mirrorkeyids').updateValueAndValidity();
    //     form.get('mirrorkeyserver').setValidators(null);
    //     form.get('mirrorkeyserver').updateValueAndValidity();
    // }

    save(): void {
        this.clicked = true;
        this.updateArchs();
        const data = this.formArray.value;
        // FIXME: only send neede key info
        this.mirrorService.create(data[0].mirrorname,
                                  data[0].mirrorversion,
                                  data[0].mirrortype,
                                  data[0].basemirror,
                                  data[0].external_repo,
                                  data[0].mirrorurl,
                                  data[0].dependencylevel,
                                  data[1].mirrordist,
                                  data[1].mirrorcomponents,
                                  data[1].architectures,
                                  data[1].mirrorsrc,
                                  data[1].mirrorinst,
                                  data[2].mirrorkeytype,
                                  data[2].mirrorkeyurl,
                                  data[2].mirrorkeyids,
                                  data[2].mirrorkeyserver,
                                  data[3].mirrorfilter,
                                 ).subscribe(
                                    msg => this.dialog.close(),
                                    err => {
                                        this.alertService.error(err.error);
                                        this.clicked = false;
                                    }
                                 );
    }
}

@Component({
    selector: 'app-mirror-delete-dialog',
    templateUrl: 'mirror-delete-form.html',
})
export class MirrorDeleteDialogComponent {
    clicked: boolean;
    mirror: Mirror;
    constructor(public dialog: MatDialogRef<MirrorDeleteDialogComponent>,
                protected mirrorService: MirrorService,
                protected router: Router,
                private alertService: AlertService,
                @Inject(MAT_DIALOG_DATA) private data: { mirror: Mirror }
    ) {
        this.mirror = data.mirror;
        this.clicked = false;
    }

    save(): void {
        this.clicked = true;
        this.mirrorService.delete(this.mirror).subscribe( r => {
            this.dialog.close();
            this.router.navigate(['/mirrors']);
        },
        err => {
            this.alertService.error(err.error);
            this.clicked = false;
        });
    }
}
