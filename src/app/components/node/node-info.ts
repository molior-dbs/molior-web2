import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {NodeService, Node, getLoadColor, getUptime, getMemory, getDisk,
        memoryAlmostFull, diskAlmostFull} from '../../services/node.service';

@Component({
    selector: 'app-node',
    templateUrl: './node-info.html',
})
export class NodeInfoComponent implements OnInit {
    node: Node;
    getLoadColor = getLoadColor;
    getUptime = getUptime;
    getMemory = getMemory;
    getDisk = getDisk;
    memoryAlmostFull = memoryAlmostFull;
    diskAlmostFull = diskAlmostFull;

    constructor(protected route: ActivatedRoute,
                protected nodeService: NodeService) {
        this.node = {id: 0,
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
            machine_id: '',
            ip: '',
            client_ver: '',
            sourcename: ''
        };
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.nodeService.get(name).subscribe((res: Node) => this.node = res);
        });
    }
}
