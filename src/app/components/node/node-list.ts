import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {Node, NodeService, NodeDataSource, getLoadColor, getUptime, getMemory, getDisk,
       memoryAlmostFull, diskAlmostFull} from '../../services/node.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
  selector: 'app-nodes',
  templateUrl: './node-list.html',
  styleUrls: ['./node-list.scss']
})
export class NodeListComponent extends TableComponent {
    updateSubscription;
    dataSource: NodeDataSource;
    displayedColumns: string[] = ['type', 'name', 'state', 'load', 'cpu_cores', 'ram_mem', 'disk',
                                  'ip', 'sourcename', 'client_ver', 'uptime_seconds', 'actions'];
    getLoadColor = getLoadColor;
    getUptime = getUptime;
    getMemory = getMemory;
    getDisk = getDisk;
    memoryAlmostFull = memoryAlmostFull;
    diskAlmostFull = diskAlmostFull;
    @ViewChild('input', { static: false }) input: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected nodeService: NodeService,
                protected moliorService: MoliorService) {
        super(route, router, [['filter', '']]);
        this.dataSource = new NodeDataSource(this.nodeService);
        this.updateSubscription = null;
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
        this.updateSubscription = this.moliorService.nodes.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt, true); });
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.input.nativeElement);
    }

    OnDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = null;
        }
    }
}
