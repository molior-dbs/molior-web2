import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {NodeService, Node, getLoadColor, getUptime, getMemory, getDisk,
        getMemoryUsagePerc, getDiskUsagePerc} from '../../services/node.service';
import {MoliorService, UpdateEvent} from '../../services/websocket';

@Component({
    selector: 'app-node',
    templateUrl: './node-info.html',
    styleUrls: ['./node-info.scss']
})
export class NodeInfoComponent implements OnInit, OnDestroy {
    node: Node;
    subscriptionNode;
    getLoadColor = getLoadColor;
    getUptime = getUptime;
    getMemory = getMemory;
    getDisk = getDisk;
    getMemoryUsagePerc = getMemoryUsagePerc;
    getDiskUsagePerc = getDiskUsagePerc;

    constructor(protected route: ActivatedRoute,
                protected nodeService: NodeService,
                protected moliorService: MoliorService) {
        this.node = {
            name: '',
            arch: '',
            state: '',
            load: [0, 0, 0],
            uptime_seconds: 0,
            cpu_cores: 0,
            ram_used: 0,
            ram_total: 0,
            disk_used: 0,
            disk_total: 0,
            id: '',
            ip: '',
            client_ver: '',
            sourcename: '',
            sourceversion: '',
            sourcearch: ''
        };
        this.subscriptionNode = null;
        this.route.paramMap.subscribe((params: ParamMap) => {
            const machineID = params.get('machine_id');
            this.nodeService.get(machineID).subscribe((res: Node) => this.node = res);
        });
    }

    ngOnInit() {
        this.subscriptionNode = this.moliorService.nodes.subscribe((event: UpdateEvent) => {
            const idKey = 'id';
            if (event.event === 'changed') {
                (event.data as []).forEach( item => {
                    if (item[idKey] === this.node.id) {
                        for (const key in item as {}) {
                            if (key) {
                                if (key !== idKey) {
                                    this.node[key] = item[key];
                                }
                            }
                        }
                    }
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.subscriptionNode) {
            this.subscriptionNode.unsubscribe();
            this.subscriptionNode = null;
        }
    }
}
