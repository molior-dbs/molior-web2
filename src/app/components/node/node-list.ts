import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {NodeService, NodeDataSource, getLoadColor, getUptime} from '../../services/node.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './node-list.html'
})
export class NodeListComponent extends TableComponent {
    dataSource: NodeDataSource;
    displayedColumns: string[] = ['name', 'arch', 'state', 'load', 'uptime_seconds', 'actions'];
    getLoadColor = getLoadColor;
    getUptime = getUptime;
    @ViewChild('input', { static: false }) input: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected nodeService: NodeService) {
        super(route, router, [['filter', '']]);
        this.dataSource = new NodeDataSource(this.nodeService);
    }

    loadData() {
        this.dataSource.load('/api/nodes', this.params);
    }

    initElements() {
        this.input.nativeElement.value = this.params.get('filter');
    }

    setParams() {
        this.params.set('filter', this.input.nativeElement.value);
    }

    AfterViewInit() {
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.input.nativeElement);
    }
}
