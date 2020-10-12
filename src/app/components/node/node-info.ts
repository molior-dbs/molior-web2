import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {NodeService, Node, getLoadColor, getUptime} from '../../services/node.service';

@Component({
    selector: 'app-node',
    templateUrl: './node-info.html',
})
export class NodeInfoComponent implements OnInit {
    node: Node;
    getLoadColor = getLoadColor;
    getUptime = getUptime;

    constructor(protected route: ActivatedRoute,
                protected nodeService: NodeService) {
        this.node = {id: 0,
            name: '',
            arch: '',
            state: '',
            load: [0, 0, 0],
            uptime_seconds: 0
        };
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const name = params.get('name');
            this.nodeService.get(name).subscribe((res: Node) => this.node = res);
        });
    }
}
