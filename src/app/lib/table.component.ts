import {AfterViewInit, OnInit, ViewChild, OnDestroy} from '@angular/core';
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
    rowHeight = 42;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                URLParams: [string, any][]) {
        URLParams.push(['page', 1]);
        this.params = new TableParams(URLParams);
        this.firstload = true;
    }

    ngAfterViewInit() {
        this.sParams = this.route.queryParams.subscribe(params => {
            this.params.load(params);
            this.calculateSize();

            if (this.firstload) {
                this.firstload = false;
                this.loadPage();
                this.updateElements();
            }
        });
        this.pParams = this.paginator.page.subscribe(
            () => {
                /* tslint:disable:no-string-literal */
                if (this.paginator.pageIndex > 0) {
                    this.params.DefaultParams['pagesize'] = '';
                } else {
                    delete this.params.DefaultParams['pagesize'];
                    delete this.params.CurrentParams['pagesize'];
                }
                delete this.params.ExtraParams['pagesize'];
                /* tslint:enable:no-string-literal */
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

        this.OnDestroy();
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

    calculateSize() {
        const parent = document.getElementById('table-wrapper') as HTMLElement;
        if (parent) {
            (parent.firstChild as HTMLTableElement).style.display = 'none';
            const rows = Math.floor((parent.getBoundingClientRect().height - this.rowHeight - (this.rowHeight / 2)) / this.rowHeight);
            (parent.firstChild as HTMLTableElement).style.display = 'table';
            if (+this.params.get('pagesize') !== rows) {
                this.params.set('pagesize', rows);
                return true;
            }
        }
        return false;
    }

    resize2parent() {
        if (this.calculateSize()) {
            this.updateElements();
            this.loadPage();
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
                    /* tslint:disable:no-string-literal */
                    delete this.params.DefaultParams['pagesize'];
                    delete this.params.CurrentParams['pagesize'];
                    delete this.params.ExtraParams['pagesize'];
                    /* tslint:enable:no-string-literal */
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

    contextmenu(event, element) {
        document.getElementById(`menu_${element.id}`).click();
        setTimeout(this.setmenupos, 10, event);
        return false;
    }

    // mouse scroll
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
    OnDestroy() {
    }
}
