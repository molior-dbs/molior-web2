import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NodeService, Node} from '../../services/node.service';

@Component({
    selector: 'app-node',
    templateUrl: './node.html',
})
export class NodeDetailComponent implements OnInit {
    node: Node;

    constructor(protected route: ActivatedRoute,
                protected nodeService: NodeService) {
        this.node = {id: 0,
            name: this.route.snapshot.paramMap.get('name'),
            arch: '',
            state: '',
            load: [0, 0, 0],
            uptime_seconds: 0
        };
    }

    ngOnInit() {
        this.nodeService.get(this.node.name).subscribe((res: Node) => this.node = res);
    }
}
