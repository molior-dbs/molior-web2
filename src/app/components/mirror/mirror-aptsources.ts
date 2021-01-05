import {Component} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {Mirror, MirrorService} from '../../services/mirror.service';


@Component({
    selector: 'app-mirror-aptsources',
    templateUrl: './mirror-aptsources.html',
    styleUrls: ['./mirror-aptsources.scss']
})
export class MirrorAPTSourcesComponent {
    mirror: Mirror;
    aptSources: string;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected mirrorService: MirrorService
                ) {
        this.mirror = { id: -1, name: '', version: '', url: '', basemirror_id: -1, description: '',
                        basemirror_url: '', basemirror_name: '', distribution: '',
                        components: '', is_basemirror: false, architectures: [],
                        is_locked: false, with_sources: false, with_installer: false,
                        project_id: -1, state: '', apt_url: '', mirrorkeyurl: '',
                        mirrorkeyids: '', mirrorkeyserver: '', external_repo: false, dependency_policy: 'strict' };
        this.aptSources = '';
        this.route.paramMap.subscribe((params: ParamMap) => {
            const mirrorName = params.get('name');
            const mirrorVersion = params.get('version');
            this.mirrorService.get( mirrorName, mirrorVersion).subscribe((r: Mirror) => this.mirror = r);
            this.mirrorService.get_apt_sources(mirrorName, mirrorVersion).subscribe((r: string) => this.aptSources = r);
        });
    }

    getAPTSources() {
        let sources = '';
        const aptsources = this.aptSources;
        const lines = aptsources.split('\n');
        lines.pop();  // get rid of last empty line
        for (const line of lines) {
            if (line.startsWith('#')) {
                sources += `<span>${line}\n</span>`;
            } else if (line.startsWith('deb ')) {
                const items = line.split(' ');
                sources += '<strong class="debsource">';
                sources += `<span>${items[0]}</span> <span>${items[1]}</span> <span>${items[2]}</span> <span>${items[3]}</span>`;
                sources += '</strong>\n';
            } else {
                sources += line + '\n';
            }
        }
        return sources;
    }
}
