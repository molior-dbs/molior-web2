import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {MirrorService, Mirror} from '../../services/mirror.service';

@Component({
    selector: 'app-mirror',
    templateUrl: './mirror-detail.html',
    styleUrls: ['./mirror-detail.scss']
})
export class MirrorDetailComponent implements OnInit {
    mirror: Mirror;

    constructor(protected route: ActivatedRoute,
                protected mirrorService: MirrorService) {
        this.mirror = {id: 0,
            name: this.route.snapshot.paramMap.get('name'),
            version: this.route.snapshot.paramMap.get('version'),
            url: '',
            basemirror_id: 0,
            basemirror_name: '',
            basemirror_url: '',
            distribution: '',
            components: '',
            is_basemirror: false,
            architectures: [],
            is_locked: false,
            with_sources: false,
            with_installer: false,
            project_id: 0,
            state: '',
            apt_url: '',
            mirrorkeyurl: '',
            mirrorkeyids: '',
            mirrorkeyserver: ''
        };
    }

    ngOnInit() {
        this.mirrorService.get(this.mirror.name, this.mirror.version).subscribe((res: Mirror) => this.mirror = res);
    }
}
