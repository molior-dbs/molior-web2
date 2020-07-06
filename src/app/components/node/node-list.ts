import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {TableComponent} from '../../lib/table.component';
import {NodeService, NodeDataSource} from '../../services/node.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './node-list.html'
})
export class NodeListComponent extends TableComponent {
    dataSource: NodeDataSource;
    displayedColumns: string[] = ['name', 'arch', 'state', 'load', 'uptime_seconds', 'actions'];
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

    getLoadColor(load: number) {
        let color = 'blue';
        if (load < 1.0) {
            color = `hsl(${ 128 - load * 64 }, 100%, 34%)`;
        } else if (load < 3.0) {
            color = `hsl(${ 64 - (load - 1.0) * 16 }, 100%, 34%)`;
        } else {
            color = `hsl(${ 32 - (load - 3.0) * 4 }, 100%, 34%)`;
        }
        return color;
    }

    getUptime(node) {
        const d = Math.floor(node.uptime_seconds / 3600.0 / 24.0);
        const h = Math.floor((node.uptime_seconds % (3600.0 * 24.0 * d)) / 3600.0);
        const m = Math.floor((node.uptime_seconds % 3600.0) / 60.0);
        if (d > 0) {
            const hrs = `${h}`.padStart(2, '0');
            const mins = `${m}`.padStart(2, '0');
            return `${d}d ${hrs}h ${mins}m`;
        } else if (h > 0) {
            const mins = `${m}`.padStart(2, '0');
            return `${h}h ${mins}m`;
        }
        return `${m}m`;
    }
}
