import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, Observer, BehaviorSubject, throwError} from 'rxjs';
import {MatPaginator} from '@angular/material';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, catchError} from 'rxjs/operators';

import {apiURL} from '../lib/url';
import {UpdateEvent} from '../services/websocket';

export class MoliorResult<T> extends Array<T> {
    total: number;
    constructor( tot?: number, items?: T[] ) {
        super();
        this.total = tot ? tot : 0;
        if ( items && items.length > 0 ) {
            this.push( ...items );
        }
    }
}

export class TableDataSource<T extends {}> implements DataSource<T>, Observer<MoliorResult<T>> {
    private items = new BehaviorSubject<MoliorResult<T>>( new MoliorResult<T>() );
    private loading = new BehaviorSubject<boolean>(false);
    private err = new BehaviorSubject<any>({});
    public  total = new BehaviorSubject<number>(-1);
    private service: TableService<T>;

    protected paginator: MatPaginator;
    public currentResults: MoliorResult<T>;

    items$ = this.items.asObservable();
    loading$ = this.loading.asObservable();
    error$ = this.err.asObservable();
    total$ = this.total.asObservable();

    closed = false;

    constructor(protected itemType: string, service: TableService<T>) {
        this.service = service;
        this.currentResults = null;
    }

    next(results: MoliorResult<T>): void {
        if (this.paginator) {
            this.paginator.length = results.total;
            this.total.next(results.total);
        } else {
            console.error('TableDataSource: paginator not set for ', this.itemType);
        }
        this.items.next(results);
    }
    error(err: any): void {
        console.error(`Error loading ${this.itemType}:`, err);
        this.err.next(err);
    }
    complete(): void {
        this.loading.next(false);
    }

    connect( collectionViewer: CollectionViewer ): Observable<MoliorResult<T>> {
        this.closed = false;
        return this.items$;
    }

    disconnect( collectionViewer: CollectionViewer ): void {
        this.closed = true;
        this.items.complete();
        this.loading.complete();
        this.err.complete();
    }

    protected preLoad(): void {
        this.err.next( {} );
        this.loading.next(true);
    }

    setPaginator( pgntr: MatPaginator ): void {
        this.paginator = pgntr;
    }

    load(url, params) {
        this.preLoad();
        this.service.load(url, params).subscribe(
            data => { this.currentResults = this.dataHook(data); this.next(data); },
            err => { this.total.next(-404); this.error(`API Error (${err.error})`); }
        );
    }

    update(event: UpdateEvent) {
        const idkey = 'id';
        const parentkey = 'parent_id';
        if (!event.data) {
            console.log('update: no data recieved', event);
            return;
        }
        if (this.currentResults === null) {
            console.log('update: no current data available', event);
            return;
        }
        if (event.event === 'added') {
            if (this.paginator.pageIndex !== 0) {
                return;
            }
            let insertat = null;
            if (event.data.hasOwnProperty(parentkey) && event.data[parentkey] !== null) {
                this.currentResults.forEach((item, i) => {
                    if (item[idkey] === event.data[parentkey] && this.currentResults.length !== i + 1) {
                        insertat = i + 1;
                    }
                });
            } else {
                insertat = 0;
            }
            if (insertat === null) {
                return;
            }
            if (this.currentResults.length >= this.paginator.pageSize) {
                this.currentResults.pop();
            }
            this.currentResults.splice(insertat, 0, event.data as T);
            this.dataHook(this.currentResults);
            this.next(this.currentResults);
        } else if (event.event === 'changed') {
            this.currentResults.forEach((item, i) => {
                if (item[idkey] === event.data[idkey]) {
                    for (const key in event.data) {
                        if (key) {
                            if (key !== idkey) {
                                this.currentResults[i][key] = event.data[key];
                            }
                        }
                    }
                    this.dataHook(this.currentResults);
                    this.next(this.currentResults);
                    this.total.next(this.currentResults.length);
                }
            });
        }
    }

    // virtual
    dataHook(data) {
        return data;
    }
}

export class TableService<T> {
    private dataparams: {};
    constructor(protected http: HttpClient) {
        this.dataparams = {};
    }

    setDataParams(params) {
        this.dataparams = params;
    }

    load(url, params): Observable<MoliorResult<T>> {
        let p = this.getAPIParams(params);
        for (const key in this.dataparams) {
            if (this.dataparams.hasOwnProperty(key)) {
                p = p.set(key, this.dataparams[key].toString());
            }
        }
        return this.http.get<MoliorResult<T>>(`${apiURL()}${url}`, { params: p }).pipe(
            /* tslint:disable:no-string-literal */
            map(res => new MoliorResult<T>(res['total_result_count'], res['results'])),
            /* tslint:enable:no-string-literal */
        );
    }

    // virtual
    getAPIParams(params) {
        return null;
    }
}
