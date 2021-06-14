import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {Node, NodeService, NodeDataSource, getLoadColor, getUptime, getMemory, getDisk,
       memoryAlmostFull, diskAlmostFull, getUptimeSeconds} from '../../services/node.service';
import {ServerInfo, ServerService} from '../../services/server.service';
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
    getUptimeSeconds = getUptimeSeconds;
    getMemory = getMemory;
    getDisk = getDisk;
    memoryAlmostFull = memoryAlmostFull;
    diskAlmostFull = diskAlmostFull;
    serverInfo: ServerInfo;
    timer;
    @ViewChild('input', { static: false }) input: ElementRef;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected nodeService: NodeService,
                protected serverService: ServerService,
                protected moliorService: MoliorService) {
        super(route, router, [['filter', '']]);
        this.dataSource = new NodeDataSource(this.nodeService);
        this.serverInfo = null;
        this.updateSubscription = null;
        this.timer = null;
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

    loadServerInfo() {
        this.serverService.getInfo().subscribe(r => this.serverInfo = r);
        this.timer = setTimeout(this.loadServerInfo.bind(this), 15000);
    }

    AfterViewInit() {
        this.updateSubscription = this.moliorService.nodes.subscribe((evt: UpdateEvent) => { this.dataSource.update(evt, true); });
        this.dataSource.setPaginator(this.paginator);
        this.initFilter(this.input.nativeElement);
        this.loadServerInfo();
    }

    OnDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = null;
        }
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
