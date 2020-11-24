import {Component, OnInit, AfterViewInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {default as AnsiUp} from 'ansi_up';
import {DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import {MatPaginator} from '@angular/material';
import {MatDialog} from '@angular/material/dialog';

import {BuildService, Build, buildicon} from '../../services/build.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';
import {RepositoryService} from '../../services/repository.service';
import {BuildDeleteDialogComponent} from './build-list';

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
    follow: boolean;
    currenterr: number;
    totalerr: number;
    totalSearchresults: number;
    currentSearchresult: number;
    @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

    constructor(protected route: ActivatedRoute,
                protected buildService: BuildService,
                protected repositoryService: RepositoryService,
                protected router: Router,
                protected moliorService: MoliorService,
                protected dialog: MatDialog) {
        this.buildicon = buildicon;
        this.build = {id: -1,
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
        this.follow = true;
        this.subscriptionBuild = null;
        this.subscriptionLog = null;
        this.currenterr = 0;
        this.totalerr = 0;
        this.totalSearchresults = 0;
        this.currentSearchresult = 0;
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const id = +params.get('id');
            this.subscriptionBuild = this.moliorService.builds.subscribe((event: UpdateEvent) => {
                const idkey = 'id';
                if (event.event === 'changed' && event.data[idkey] === id) {
                    for (const key in event.data) {
                        if (key) {
                            if (key !== idkey) {
                                this.build[key] = event.data[key];
                            }
                        }
                    }
                }
            });
            this.fetchLogs(id);
        });
        const scroll = document.getElementById('log-scroll') as HTMLTableElement;
        scroll.focus();
    }

    ngAfterViewInit() {
        this.paginator.page.subscribe(p => {
            const linenumber = Math.round(p.pageIndex * p.pageSize) + 1;
            const row = document.getElementById('row-' + linenumber) as HTMLElement;
            if (row) {
                this.scrollToLog(row);
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

    fetchLogs(id: number) {
        this.buildService.get(id).subscribe((res: Build) => {
            this.build = res;
            const tbody = document.getElementById('buildlog') as HTMLTableElement;
            tbody.innerHTML = '';
            this.loglines = 0;
            this.incompleteline = '';
            this.up = true;
            this.cursor = null;

            if ( this.build.buildstate === 'new' ||
                 this.build.buildstate === 'needs_build' ||
                 this.build.buildstate === 'building' ||
                 this.build.buildstate === 'needs_publish' ||
                 this.build.buildstate === 'publishing' ) {
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
                        if (endrow && this.follow) {
                            endrow.scrollIntoView();
                        }
                    }
                    const errors = document.getElementsByClassName('errorline');
                    this.totalerr = errors.length;
                    this.highlightLine();
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
                const tbody2 = document.getElementById('buildlog') as HTMLTableElement;
                lines.forEach( line => {
                    if (!this.up) {
                        return;
                    }
                    const nr = this.loglines + 1;
                    const row = tbody2.insertRow(this.loglines);
                    row.id = `row-${nr}`;
                    const linenr = row.insertCell(0);
                    linenr.innerHTML = `<a href="build/${this.build.id}#line-${nr}" id="line-${nr}" class="line">${nr}</a>`;
                    linenr.className = 'lognr';
                    const logline = row.insertCell(1);
                    logline.innerHTML = this.ansiup.ansi_to_html(line);
                    logline.className = 'logline';

                    // head: cannot open '/etc/ssl/certs/java/cacerts' for reading: No such file or directory
                    const patterns = [
                        // this       but not any of all of that
                        [/\S*error: /i, [
                            [/dpkg-buildpackage: error: debian\/rules build subprocess returned exit status \d+$/],
                            [/sbuild command failed/],
                            [/dpkg-buildpackage/, /exit status \d+/],
                        ]],
                        [/^[^/(]*[^;]\berror\b[^:]/i, [
                            [/gpgv: keyblock resource/, /General error$/],
                            [/^(\x1b[^m]+m)*make/, /Error \d+$/],
                            [/error\.\S+$/],
                            [/dpkg-buildpackage/, /exit status \d+/],
                            [/: warning: unused parameter/],
                        ]],
                        [/^(\x1b[^m]+m)*E:/, [
                            [/dpkg-buildpackage died/],
                            [/Error building source package/],
                            [/Package build dependencies not satisfied; skipping/],
                        ]],
                        [/^(\x1b[^m]+m)*make.+No rule to make target.*Stop/, []],
                        [/dh_install: missing files, aborting/, []],
                        [/\/bin\/sh:.+not found/, []],
                        [/: No such file or directory/, [
                            [/head: cannot open/, /certs\/java\/cacerts/],
                        ]],
                        [/Target "[^"]" does not exist in the project/, []],
                        [/\.py:\d+:\d+: [FW]\d+ /, []],
                        [/dh_systemd_enable: Could not handle all of the requested services/, []],
                        [/unsat-dependency: /, []],
                    ];
                    for (const pattern of patterns) {
                        if (line.search(pattern[0] as RegExp) >= 0) {
                            const falsepositives = pattern[1] as [];
                            let found = false;
                            for (const fps of falsepositives) {
                                found = true;
                                for (const fp of fps as RegExp[]) {
                                    if (line.search(fp) === -1) {
                                        found = false;
                                        break;
                                    }
                                }
                                if (found) {
                                    break;
                                }
                            }
                            if (!found) {
                                row.className = 'errorline';
                                break;
                            }
                        }
                    }
                    this.loglines += 1;
                    lastrow = row;
                });
                if (lastrow && this.up && ( this.build.buildstate === 'building' ||
                                            this.build.buildstate === 'needs_publish' ||
                                            this.build.buildstate === 'publishing' )) {
                    if (this.follow) {
                        lastrow.scrollIntoView();
                    }
                    this.updatePaginator();
                }
            });

            this.moliorService.send({
                subject: 8, // buildlog
                action: 4,  // start
                data: {build_id: this.build.id}
            });

        });
    }

    highlightLine() {
        if (!this.selectedLine) {
            if (this.build.buildstate === 'build_failed') {
                this.findError();
            }
            return;
        }
        const linenumber = this.selectedLine;
        const line = document.querySelector('#line-' + linenumber) as HTMLElement;
        if (line ) {
            this.scrollToLog(line);

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
            this.follow = false;
            this.paginator.pageSize = end - start + 1;
            this.paginator.pageIndex = ((start  - 1) / this.paginator.pageSize);
            this.paginator.length = this.loglines;
        } else {
            this.follow = true;
            this.paginator.pageIndex = 0;
            this.paginator.pageSize = this.loglines;
            this.paginator.length = this.loglines;
        }
    }

    rebuild() {
        this.buildService.rebuild(this.build.id).subscribe( res => {
            this.fetchLogs(this.build.id);
        });
    }

    delete() {
        const dialogRef = this.dialog.open(BuildDeleteDialogComponent, {
            data: { build: this.build },
            disableClose: true,
            width: '40%',
        });
        dialogRef.afterClosed().subscribe(result => this.router.navigate(['builds']));
    }

    buildlatest() {
        this.repositoryService.build(this.build.sourcerepository_id).subscribe();
    }

    toggleFollow() {
        this.follow = !this.follow;
        if (this.follow) {
            const endrow = document.getElementById('row-' + this.loglines) as HTMLElement;
            if (endrow) {
                endrow.scrollIntoView();
            }
        }
    }

    findError() {
        const errors = document.getElementsByClassName('errorline');
        this.totalerr = errors.length;
        if (this.currenterr > this.totalerr - 1) {
            this.currenterr = 0;
        }
        let found = false;
        Array.prototype.forEach.call(errors, (error, i) => {
            if (this.currenterr === i) {
                this.scrollToLog(error);
                found = true;
            }
        });
        if (found) {
            this.currenterr++;
        }
    }

    scrollToLog(element) {
        const headerOffset = 42;
        const scroll = document.getElementById('log-scroll') as HTMLElement;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition - scroll.getBoundingClientRect().top + scroll.scrollTop - headerOffset;
        scroll.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    removeSearchHighlight(node) {
        const childs = node.childNodes;
        for (let j = 0; j < childs.length; j++) {
            const child = childs[j];
            if (child.nodeType === 1) {
                if (child.className === 'searchhighlight') {
                    node.replaceChild(child.childNodes[0], child);
                } else {
                    this.removeSearchHighlight(child);
                }
            }
        }
    }

    search(query: string) {
        // clear previous search results, if any
        let searchresults = document.getElementsByClassName('searchresult');
        const staticSearchresults = [];
        for (let i = 0; i < searchresults.length; i++) {
            staticSearchresults.push(searchresults[i]);
        }
        for (let i = 0; i < staticSearchresults.length; i++) {
            this.removeSearchHighlight(staticSearchresults[i]);
            staticSearchresults[i].classList.remove('searchresult');
        }
        this.totalSearchresults = 0;
        this.currentSearchresult = 0;

        // search if 3 chars or more
        if (query.length < 3) {
            return;
        }

        // search
        const querylength = query.length;
        const regescape = '\\.()*+[]/$^|~';
        for (let i = 0; i < regescape.length; i++) {
            query = query.replace(RegExp(`\\${regescape[i]}`, 'g'), `\\${regescape[i]}`);
        }
        const r = RegExp(`(${query})(?![^<]*>)`, 'gi');
        const buildlog = document.getElementById('buildlog') as HTMLElement;
        const rows = buildlog.children;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const log = row.children[1];
            let first = true;
            let match = r.exec(log.innerHTML);
            while (match !== null) {
                if (first) {
                    first = false;
                    log.classList.add('searchresult');
                }
                const pos = match.index; // r.lastIndex - querylength;
                const pre = log.innerHTML.slice(0, pos);
                const highligh = log.innerHTML.slice(pos, pos + querylength);
                const post = log.innerHTML.slice(pos + querylength);
                log.innerHTML = pre + '<span class="searchhighlight">' + highligh + '</span>' + post;
                r.lastIndex += 30 + 7;
                match = r.exec(log.innerHTML);
            }
        }
        searchresults = document.getElementsByClassName('searchresult');
        this.totalSearchresults = searchresults.length;
        this.searchNext();
    }

    searchNext() {
        const searchresults = document.getElementsByClassName('searchresult');
        this.currentSearchresult++;
        if (this.currentSearchresult === searchresults.length + 1) {
            this.currentSearchresult = 1;
        }
        for (let i = 0; i < searchresults.length; i++) {
            if (this.currentSearchresult === i + 1) {
                this.scrollToLog(searchresults[i]);
                break;
            }
        }
    }

    searchPrev() {
        const searchresults = document.getElementsByClassName('searchresult');
        if (this.currentSearchresult === 1) {
            this.currentSearchresult = searchresults.length;
        } else {
            this.currentSearchresult--;
        }
        for (let i = 0; i < searchresults.length; i++) {
            if (this.currentSearchresult === i + 1) {
                this.scrollToLog(searchresults[i]);
                break;
            }
        }
    }
}
