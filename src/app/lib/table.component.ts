import {AfterViewInit, OnInit, ViewChild, ViewChildren, OnDestroy, QueryList} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MatPaginator, MatMenuTrigger} from '@angular/material';
import {Router} from '@angular/router';
import {Subscription, fromEvent} from 'rxjs';
import {debounceTime, distinctUntilChanged, tap} from 'rxjs/operators';

export class TableParams {
    DefaultParams: {};
    CurrentParams: {};
    ExtraParams: {};
    constructor(private URLParams: [string, any][]) {
        this.DefaultParams = {};
        URLParams.forEach(p => {
            this.DefaultParams[p[0]] = p[1];
            this.CurrentParams = {...this.DefaultParams};
            this.ExtraParams = {};
        });
    }

    set(param: string, value: any) {
        this.CurrentParams[param] = value;
    }

    get(param: string) {
        return this.CurrentParams[param];
    }

    load(routeparams) {
        for (const param in routeparams) {
            if (!param) { continue; }
            if (!(param in this.DefaultParams)) {
                this.ExtraParams[param] = routeparams[param];
            }
        }
        for (const param of Object.keys(this.DefaultParams)) {
            let t = null;
            if (routeparams) {
                t = routeparams[param] || null;
            }
            if (!t) {
                t = this.DefaultParams[param];
            }
            if (typeof this.DefaultParams[param] === 'number') {
                this.set(param, +t);
            } else {
                this.set(param, t);
            }
        }
    }

    dict() {
        const urlparams = {};
        for (const param of Object.keys(this.DefaultParams)) {
            const t = this.CurrentParams[param];
            if (t !== this.DefaultParams[param]) {
                urlparams[param] = t;
            }
        }
        for (const param in this.ExtraParams) {
            if (!param) { continue; }
            urlparams[param] = this.ExtraParams[param];
        }
        return urlparams;
    }
}

export class TableComponent implements AfterViewInit, OnDestroy {
    params: TableParams;
    @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
    sParams: Subscription;
    pParams: Subscription;
    firstload: boolean;
    contextmenuIndex: number;
    rowHeight = 42;
    @ViewChildren(MatMenuTrigger) menubuttons: QueryList<MatMenuTrigger>;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                URLParams: [string, any][]) {
        URLParams.push(['page', 1]);
        URLParams.push(['pagesize', 10]);
        this.params = new TableParams(URLParams);
        this.firstload = true;
        this.contextmenuIndex = 1;
    }

    ngAfterViewInit() {
        this.sParams = this.route.queryParams.subscribe(params => {
            this.params.load(params);
            this.resize2parent();

            if (this.firstload) {
                this.firstload = false;
                this.loadPage();
                this.updateElements();
            }
        });
        this.pParams = this.paginator.page.subscribe(
            () => {
                this.params.set('page',     this.paginator.pageIndex + 1);
                this.params.set('pagesize', this.paginator.pageSize);
                this.loadPage();
            });

        this.AfterViewInit();
    }

    ngOnDestroy() {
        if (this.sParams) {
            this.sParams.unsubscribe();
        }
        if (this.pParams) {
            this.pParams.unsubscribe();
        }
    }

    updateElements() {
        setTimeout(() => {
            this.paginator.pageIndex = +this.params.get('page') - 1;
            this.paginator.pageSize = +this.params.get('pagesize');
            this.initElements();
        });
    }

    loadPage() {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {...this.params.dict()},
        });
        this.loadData();
    }

    resize2parent() {
        const parent = document.getElementById('table-wrapper') as HTMLElement;
        if (parent) {
            (parent.firstChild as HTMLTableElement).style.display = 'none';
            const rows = Math.floor((parent.getBoundingClientRect().height - this.rowHeight - (this.rowHeight / 2)) / this.rowHeight);
            (parent.firstChild as HTMLTableElement).style.display = 'table';
            if (+this.params.get('pagesize') !== rows) {
                this.params.set('pagesize', rows);
                this.updateElements();
                this.loadPage();
            }
        }
    }

    initFilter(element) {
        fromEvent(element, 'keyup')
            .pipe(
                debounceTime(150),
                distinctUntilChanged(),
                tap(() => {
                    this.paginator.pageIndex = 0;
                    this.params.set('page', 1);
                    this.setParams();
                    this.loadPage();
                }),
            ).subscribe();
    }

    // context menus
    setmenupos(event) {
        const menu = document.getElementsByClassName('cdk-overlay-connected-position-bounding-box')[0] as HTMLDivElement;
        menu.style.right = window.innerWidth - event.pageX - (menu.firstChild as HTMLDivElement).clientWidth + 'px';
    }

    contextmenu(event, id) {
        // FIXME: menubuttons out of date when items added to table
        this.menubuttons.toArray()[id + this.contextmenuIndex].openMenu();
        setTimeout(this.setmenupos, 100, event);
        return false;
    }

    scroll(event) {
        if (event.ctrlKey) {
            return;
        }
        if (event.deltaY > 0 && (this.paginator.pageIndex + 1) * this.paginator.pageSize < this.paginator.length) {
            this.paginator.pageIndex = this.paginator.pageIndex + 1;
            this.paginator.page.next();
        } else if (event.deltaY < 0 && this.paginator.pageIndex > 0) {
            this.paginator.pageIndex = this.paginator.pageIndex - 1;
            this.paginator.page.next();
        }
    }


    // virtual
    loadData() {
        console.error('not implemented yet');
    }
    setParams() {
        console.error('not implemented yet');
    }
    initElements() {
        console.error('not implemented yet');
    }
    initParams(params: {}) {
        console.error('not implemented yet');
    }
    AfterViewInit() {
        console.error('not implemented yet');
    }
}
