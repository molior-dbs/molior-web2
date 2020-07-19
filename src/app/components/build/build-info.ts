import {Component, OnInit, AfterViewInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {default as AnsiUp} from 'ansi_up';
import {DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import {MatPaginator} from '@angular/material';

import {BuildService, Build, buildicon} from '../../services/build.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
    selector: 'app-build',
    templateUrl: 'build-info.html',
    styleUrls: ['build-info.scss'],
})
export class BuildInfoComponent implements OnInit, OnDestroy, AfterViewInit {
    build: Build;
    selectedLine: number;
    LastSelectedLine: number;
    ansiup: AnsiUp;
    loglines: number;
    incompleteline: string;
    up: boolean;
    subscriptionBuild;
    subscriptionLog;
    cursor;
    buildicon;
    @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

    constructor(protected route: ActivatedRoute,
                protected buildService: BuildService,
                protected moliorService: MoliorService) {
        this.buildicon = buildicon;
        this.build = {id: +this.route.snapshot.paramMap.get('id'),
            can_rebuild: false,
            buildstate: '',
            buildtype: '',
            startstamp: '',
            endstamp: '',
            version: '',
            sourcename: '',
            maintainer: '',
            maintainer_email: '',
            git_ref: '',
            branch: '',
            sourcerepository_id: 0,
            project: { id: 0, name: '', version: { id: 0, name: '', is_locked: false }},
            buildvariant: { name: '', architecture: { id: 0, name: '' }, base_mirror: { id: 0, name: '', version: '' }},
            progress: null
        };
        this.selectedLine = null;
        this.LastSelectedLine = null;
        this.route.fragment.subscribe( f => {
            if (f) {
                this.selectedLine = +f.replace('line-', '');
                setTimeout(() => this.highlightLine());
            }
        });
        this.ansiup = new AnsiUp();
        this.loglines = 0;
        this.incompleteline = '';
        this.up = true;
        this.cursor = null;
    }

    ngOnInit() {
        this.subscriptionBuild = this.moliorService.builds.subscribe((event: UpdateEvent) => {
            const idkey = 'id';
            if (event.event === 'changed' && event.data[idkey] === this.build.id) {
                for (const key in event.data) {
                    if (key) {
                        if (key !== idkey) {
                            this.build[key] = event.data[key];
                        }
                    }
                }
            }
        });

        this.buildService.get(this.build.id).subscribe((res: Build) => {
            this.build = res;
            if ( this.build.buildstate === 'new' ||
                 this.build.buildstate === 'needs_build' ||
                 this.build.buildstate === 'building' ||
                 this.build.buildstate === 'needs_publish' ||
                 this.build.buildstate === 'publishing' ) {
                const tbody = document.getElementById('buildlog') as HTMLTableElement;
                this.cursor = tbody.insertRow(0);
                this.cursor.id = 'row-cursor';
                const linenr = this.cursor.insertCell(0);
                linenr.className = 'lognr blinking-cursor';
                linenr.innerHTML = '▁';
                const logline = this.cursor.insertCell(1);
                logline.className = 'logline';
            }

            this.subscriptionLog = this.moliorService.buildlog.subscribe(log => {
                if (log.hasOwnProperty('event') && log.event === 'done') {
                    this.up = false;
                    if (this.cursor) {
                        const parent = document.getElementById('buildlog') as HTMLTableElement;
                        parent.removeChild(this.cursor);
                        const endrow = document.getElementById('row-' + this.loglines) as HTMLElement;
                        if (endrow) {
                            endrow.scrollIntoView();
                        }
                    }
                    this.updatePaginator();
                    return;
                }
                let data = log.data as unknown as string;
                if (this.incompleteline !== '') {
                    data = this.incompleteline + data;
                    this.incompleteline = '';
                }
                const lines = data.split('\n');
                if (data[data.length - 1] === '\n') {
                    lines.pop();
                } else {
                    this.incompleteline = lines.pop();
                }
                let lastrow = null;
                const tbody = document.getElementById('buildlog') as HTMLTableElement;
                lines.forEach( line => {
                    if (!this.up) {
                        return;
                    }
                    const nr = this.loglines + 1;
                    const row = tbody.insertRow(this.loglines);
                    row.id = `row-${nr}`;
                    const linenr = row.insertCell(0);
                    linenr.innerHTML = `<a href="builds/${this.build.id}#line-${nr}" id="line-${nr}" class="line">${nr}</a>`;
                    linenr.className = 'lognr';
                    const logline = row.insertCell(1);
                    logline.innerHTML = this.ansiup.ansi_to_html(line);
                    logline.className = 'logline';
                    this.loglines += 1;
                    lastrow = row;
                });
                if (lastrow && this.up && ( this.build.buildstate === 'building' ||
                                            this.build.buildstate === 'needs_publish' ||
                                            this.build.buildstate === 'publishing' )) {
                    lastrow.scrollIntoView();
                    this.updatePaginator();
                }
            });

            this.moliorService.send({
                subject: 8, // buildlog
                action: 4,  // start
                data: {build_id: this.build.id}
            });

            setTimeout(() => this.highlightLine(), 2000);
        });
    }

    ngAfterViewInit() {
        this.paginator.page.subscribe(p => {
            const linenumber = Math.round(p.pageIndex * p.pageSize) + 1;
            const row = document.getElementById('row-' + linenumber) as HTMLElement;
            if (row) {
                row.scrollIntoView();
            }
        });
    }

    ngOnDestroy() {
        if (this.up) {
            this.up = false;
            this.moliorService.send({
                subject: 8, // buildlog
                action: 5,  // stop
                data: {build_id: this.build.id}
            });
        }
        if (this.subscriptionBuild) {
            this.subscriptionBuild.unsubscribe();
            this.subscriptionBuild = null;
        }
        if (this.subscriptionLog) {
            this.subscriptionLog.unsubscribe();
            this.subscriptionLog = null;
        }
    }

    highlightLine() {
        if (!this.selectedLine) {
            return;
        }
        const linenumber = this.selectedLine;
        const line = document.querySelector('#line-' + linenumber) as HTMLElement;
        if (line ) {
            line.scrollIntoView();

            const row = document.getElementById('row-' + linenumber) as HTMLElement;
            if (row) {
                console.log(row.getBoundingClientRect());
                row.style.background = 'cadetblue';
                if (this.LastSelectedLine && linenumber !== this.LastSelectedLine) {
                    const lastrow = document.getElementById('row-' + this.LastSelectedLine) as HTMLElement;
                    if (lastrow) {
                        lastrow.style.background = 'unset';
                    }
                }
                this.LastSelectedLine = linenumber;
            } else {
                console.log('row not found');
            }
        } else {
            console.log('element not found');
        }
    }

    updatePaginator() {
        const scroll = document.getElementById('log-scroll') as HTMLElement;
        const height = scroll.scrollTop + scroll.getBoundingClientRect().height - 16;
        let h = 0;
        let start = null;
        let end = null;
        for (let i = 1; i <= this.loglines; i++) {
            const row = document.getElementById('row-' + i) as HTMLElement;
            h += row.getBoundingClientRect().height;
            if (start === null && h > scroll.scrollTop) {
                start = i;
            }
            if (h > height) {
                end = i;
                break;
            }
        }
        if (end !== null) {
            this.paginator.pageSize = end - start + 1;
            this.paginator.pageIndex = ((start  - 1) / this.paginator.pageSize);
            this.paginator.length = this.loglines;
        } else {
            this.paginator.pageIndex = 0;
            this.paginator.pageSize = this.loglines;
            this.paginator.length = this.loglines;
        }
    }
}
