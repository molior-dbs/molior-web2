import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {Node, NodeService, NodeDataSource, getLoadColor, getUptime, getMemory, getDisk} from '../../services/node.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
  selector: 'app-nodes',
  templateUrl: './node-list.html'
})
export class NodeListComponent extends TableComponent {
    dataSource: NodeDataSource;
    displayedColumns: string[] = ['type', 'name', 'state', 'load', 'cpu_cores', 'ram_mem', 'disk',
                                  'ip', 'client_ver', 'uptime_seconds', 'actions'];
    getLoadColor = getLoadColor;
    getUptime = getUptime;
    getMemory = getMemory;
    getDisk = getDisk;
    @ViewChild('input', { static: false }) input: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected nodeService: NodeService,
                protected moliorService: MoliorService) {
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
        this.moliorService.nodes.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt, true); });
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.input.nativeElement);
    }

    memoryAlmostFull(node: Node): boolean {
        if (node && node.ram_used / node.ram_total > 0.9) {
            return true;
        }
        return false;
    }

    diskAlmostFull(node: Node): boolean {
        if (node && node.disk_used / node.disk_total > 0.9) {
            return true;
        }
        return false;
    }
}
